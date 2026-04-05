import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { OrderStatus } from "@/lib/types/order";

interface UberCourierUpdateWebhook {
    created: string;
    data: {
        batch_id: string;
        complete: boolean;
        courier?: {
            img_href?: string;
            location?: {
                lat: number;
                lng: number;
            };
            location_description?: string;
            name?: string;
            phone_number?: string;
            public_phone_info?: {
                formatted_phone_number?: string;
                pin_code?: string;
            };
            rating?: string;
            unmarked_location_description?: string;
            vehicle_color?: string;
            vehicle_license_plate?: string;
            vehicle_make?: string;
            vehicle_model?: string;
            vehicle_type?: string;
        };
        courier_imminent?: boolean;
        created: string;
        currency: string;
        deliverable_action?: string;
        dropoff?: {
            address: string;
            detailed_address?: any;
            location: {
                lat: number;
                lng: number;
            };
            name: string;
            notes?: string;
            phone_number: string;
        };
        dropoff_deadline?: string;
        dropoff_eta?: string;
        dropoff_ready?: string;
        external_id?: string;
        fee?: number;
        id: string;
        kind: string;
        live_mode: boolean;
        manifest?: {
            description: string;
            total_value: number;
        };
        manifest_items?: any[];
        pickup?: {
            address: string;
            detailed_address?: any;
            location: {
                lat: number;
                lng: number;
            };
            name: string;
            notes?: string;
            phone_number: string;
        };
        pickup_action?: string;
        pickup_deadline?: string;
        pickup_eta?: string;
        pickup_ready?: string;
        quote_id?: string;
        route_id?: string;
        status: string;
        tracking_url?: string;
        undeliverable_action?: string;
        undeliverable_reason?: string;
        updated: string;
        uuid: string;
    };
    delivery_id: string;
    id: string;
    kind: string;
    live_mode: boolean;
    location: {
        lat: number;
        lng: number;
    };
}

export async function POST(req: NextRequest) {
    try {
        const body: UberCourierUpdateWebhook = await req.json();
        
        const { delivery_id, location, data } = body;
        const courier = data?.courier;
        const courier_imminent = data?.courier_imminent;

        if (location.lat == 0 && location.lng == 0) {
            return NextResponse.json(
                { success: true, message: "Declining Webhook" },
                { status: 200 }
            );
        }

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

        if (order.status === OrderStatus.Delivered) {
            return NextResponse.json(
                { success: true, message: "Order already delivered" },
                { status: 200 }
            );
        }

        const orderUpdateData: Record<string, unknown> = {};

        if (data?.dropoff_eta) {
            orderUpdateData.estimatedDeliveryTime = new Date(data.dropoff_eta);
        }

        if (data?.pickup_eta) {
            orderUpdateData.estimatedPickupTime = new Date(data.pickup_eta);
        }

        if (data?.tracking_url) {
            orderUpdateData.trackingUrl = data.tracking_url;
        }

        const courierData: Record<string, unknown> = {
            latitude: location.lat,
            longitude: location.lng,
            locationUpdatedAt: new Date(),
        };

        if (courier_imminent !== undefined) {
            courierData.isImminent = courier_imminent;
        }

        if (courier) {
            if (courier.name) courierData.name = courier.name;
            if (courier.phone_number) courierData.phone = courier.phone_number;
            if (courier.img_href) courierData.photoUrl = courier.img_href;
            if (courier.vehicle_type) courierData.vehicleType = courier.vehicle_type;
            if (courier.vehicle_make) courierData.vehicleMake = courier.vehicle_make;
            if (courier.vehicle_model) courierData.vehicleModel = courier.vehicle_model;
            if (courier.vehicle_color) courierData.vehicleColor = courier.vehicle_color;
            if (courier.vehicle_license_plate) courierData.licensePlate = courier.vehicle_license_plate;
        }

        if (Object.keys(orderUpdateData).length > 0) {
            await prisma.order.update({
                where: { id: order.id },
                data: orderUpdateData,
            });
        }

        await prisma.courier.upsert({
            where: { orderId: order.id },
            update: courierData,
            create: {
                orderId: order.id,
                ...courierData,
            },
        });

        return NextResponse.json(
            { success: true, message: "Courier update processed successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Uber courier update webhook error:", error);

        return NextResponse.json(
            { success: false, message: "Webhook processing failed" },
            { status: 500 }
        );
    }
}
