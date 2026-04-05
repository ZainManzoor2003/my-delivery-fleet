import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { OrderStatus } from "@/lib/types/order";
import { DeliveryType } from "@/lib/enums/deliveryType";

const mapUberStatusToOrderStatus = (uberStatus: string, deliveryType: DeliveryType): string => {
    switch (uberStatus) {
        case "pending":
            return deliveryType === DeliveryType.SCHEDULE ? OrderStatus.Scheduled : OrderStatus.RequestingDriver;
        case "pickup":
            return OrderStatus.PickUp;
        case "pickup_complete":
            return OrderStatus.Delivery;
        case "dropoff":
            return OrderStatus.Delivery;
        case "delivered":
            return OrderStatus.Delivered;
        case "canceled":
            return OrderStatus.Canceled;
        case "returned":
            return OrderStatus.Returned;
        default:
            return uberStatus;
    }
};

interface UberDeliveryStatusWebhook {
    account_id: string;
    customer_id: string;
    delivery_id: string;
    status: string;
    created: string;
    kind: string;
    live_mode: boolean;
    data: {
        courier?: {
            name?: string;
            phone_number?: string;
            img_href?: string;
            rating?: string;
            vehicle_type?: string;
            vehicle_make?: string;
            vehicle_model?: string;
            vehicle_color?: string;
            location?: {
                lat: number;
                lng: number;
            };
        };
        pickup?: {
            verification?: {
                picture?: { image_url?: string };
            };
        };
        dropoff?: {
            verification?: {
                picture?: { image_url?: string };
            };
        };

        courier_imminent?: boolean;
        dropoff_eta?: string;
        pickup_eta?: string;
        tracking_url?: string;
        fee?: number;
    };
}

export async function POST(req: NextRequest) {
    try {
        const body: UberDeliveryStatusWebhook = await req.json();

        const { delivery_id, status, data } = body;
        const courier_imminent = data.courier_imminent;
        const order = await prisma.order.findFirst({
            where: {
                providerDeliveryId: delivery_id,
                provider: "uber",
            },
        });

        if (!order) {
            return NextResponse.json(
                { message: "Order not found, webhook acknowledged" },
                { status: 200 }
            );
        }
        
        const mappedStatus = mapUberStatusToOrderStatus(status, order.deliveryType as DeliveryType);

        if (order.status === OrderStatus.Delivered) {
            return NextResponse.json(
                { message: "Order already delivered, webhook acknowledged" },
                { status: 200 }
            );
        }

        const orderUpdateData: Record<string, unknown> = {
            status: mappedStatus,
        };

        if (data.tracking_url) {
            orderUpdateData.trackingUrl = data.tracking_url;
        }

        if (data.dropoff_eta) {
            orderUpdateData.estimatedDeliveryTime = new Date(data.dropoff_eta);
        }

        if (data.pickup_eta) {
            orderUpdateData.estimatedPickupTime = new Date(data.pickup_eta);
        }

        if (status === "delivered") {
            if (!order.deliveryStartTime) {
                orderUpdateData.deliveryStartTime = new Date();
            }
            orderUpdateData.deliveredAt = new Date();

            const pickupPicture = data.pickup?.verification?.picture?.image_url;
            const dropoffPicture = data.dropoff?.verification?.picture?.image_url;

            if (pickupPicture) {
                orderUpdateData.pickupVerificationPhoto = pickupPicture;
            }
            if (dropoffPicture) {
                orderUpdateData.dropoffVerificationPhoto = dropoffPicture;
            }
        }

        if (status === "pickup") {
            orderUpdateData.driverAcceptedAt = new Date();
        }

        if (status === "pickup_complete") {
            orderUpdateData.deliveryStartTime = new Date();
        }

        await prisma.order.update({
            where: { id: order.id },
            data: orderUpdateData,
        });

        if (data.courier) {
            const courierData = {
                name: data.courier.name || null,
                phone: data.courier.phone_number || null,
                photoUrl: data.courier.img_href || null,
                vehicleType: data.courier.vehicle_type || null,
                vehicleMake: data.courier.vehicle_make || null,
                vehicleModel: data.courier.vehicle_model || null,
                vehicleColor: data.courier.vehicle_color || null,
                latitude: data.courier.location?.lat || null,
                longitude: data.courier.location?.lng || null,
                isImminent: courier_imminent ?? false,
                locationUpdatedAt: new Date(),
            };

            await prisma.courier.upsert({
                where: { orderId: order.id },
                update: courierData,
                create: {
                    orderId: order.id,
                    ...courierData,
                },
            });
        }

        return NextResponse.json(
            { success: true, message: "Webhook processed successfully" },
            { status: 200 }
        );
    } catch {
        return NextResponse.json(
            { success: false, message: "Webhook processing failed" },
            { status: 500 }
        );
    }
}
