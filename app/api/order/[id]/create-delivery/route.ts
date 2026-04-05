import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uberService, UberServiceError } from "@/services/ubserService";
import { OrderStatus, HandoffType } from "@/lib/types/order";
import { DeliveryType } from "@/lib/enums/deliveryType";
import { BusinessStatus } from "@/lib/types/business";
import { BusinessType } from "@/lib/enums/businessType";
import { SurchargeType } from "@/lib/types/order";
import { UberAccountType } from "@/lib/enums/uberAccountType";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await req.json().catch(() => ({}));
        const quoteId: string | undefined = body?.quoteId;

        if (!id) {
            return NextResponse.json(
                { message: "Order ID is required" },
                { status: 400 }
            );
        }

        if (!quoteId) {
            return NextResponse.json(
                { message: "Quote not found. Please try again." },
                { status: 400 }
            );
        }

        // Fetch order with all related data
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: true,
                deliveryAddress: true,
                business: {
                    include: {
                        address: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json(
                { message: "Order not found" },
                { status: 404 }
            );
        }

        if (!order.business?.address) {
            return NextResponse.json(
                { message: "Business pickup address not configured" },
                { status: 400 }
            );
        }

        if (!order.deliveryAddress) {
            return NextResponse.json(
                { message: "Delivery address is required" },
                { status: 400 }
            );
        }

        if (order.business.status === BusinessStatus.SUSPENDED) {
            return NextResponse.json(
                { message: "Your business is suspended. Please pay your pending invoice to resume service." },
                { status: 400 }
            );
        }


        if (!order.handoffType) {
            return NextResponse.json(
                { message: "Handoff type is required" },
                { status: 400 }
            );
        }

        if (!order.customerSubTotal || order.customerSubTotal.toNumber() <= 0) {
            return NextResponse.json(
                { message: "Order subtotal must be greater than 0" },
                { status: 400 }
            );
        }

        if (!order.items || order.items.length === 0) {
            return NextResponse.json(
                { message: "Order must have at least one item" },
                { status: 400 }
            );
        }

        for (const item of order.items) {
            if (!item.name?.trim()) {
                return NextResponse.json(
                    { message: "All items must have a name" },
                    { status: 400 }
                );
            }
            if (!item.quantity || item.quantity < 1) {
                return NextResponse.json(
                    { message: `Item "${item.name}" must have a quantity of at least 1` },
                    { status: 400 }
                );
            }
        }

        if (order.deliveryType === DeliveryType.SCHEDULE && !order.estimatedPickupTime) {
            return NextResponse.json(
                { message: "Scheduled delivery requires a delivery date and time" },
                { status: 400 }
            );
        }

        const pickupAddress = order.business.address;
        const dropoffAddress = order.deliveryAddress;

        // Format addresses for Uber Direct API
        const formatUberAddress = (address: {
            street: string;
            apartment?: string | null;
            city: string;
            state: string;
            postalCode: string;
        }) => {
            const streetAddress = address.apartment
                ? [address.street, address.apartment]
                : [address.street];

            return JSON.stringify({
                street_address: streetAddress,
                city: address.city,
                state: address.state,
                zip_code: address.postalCode,
                country: "US",
            });
        };

        // Format manifest items for Uber
        const manifestItems = order.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            size: item.size || "small",
            price: item.unitPrice ? Math.round(item.unitPrice.toNumber() * 100) : 0,
        }));

        // Format phone number to E.164 format (+1XXXXXXXXXX)
        const formatPhoneNumber = (phone: string): string => {
            // Remove all non-digit characters except leading +
            const cleaned = phone.replace(/[^\d+]/g, '');
            // If already has country code, return as-is
            if (cleaned.startsWith('+')) return cleaned;
            // Otherwise add US country code
            return `+1${cleaned.replace(/^\+?1?/, '')}`;
        };

        const pickupReadyDt = order.deliveryType === DeliveryType.SCHEDULE ? order.estimatedPickupTime?.toISOString() : new Date().toISOString();

        const deliveryRequest: Record<string, unknown> = {
            pickup_name: order.business.name || 'Store',
            pickup_address: formatUberAddress(pickupAddress),
            pickup_phone_number: formatPhoneNumber(order.business.phone),
            pickup_ready_dt: pickupReadyDt,
            dropoff_name: order.customerName || 'Customer',
            dropoff_address: formatUberAddress(dropoffAddress),
            dropoff_phone_number: formatPhoneNumber(order.customerPhone),
            manifest_items: manifestItems,
            tip: order.totalTip ? Math.round(order.totalTip.toNumber() * 100) : 0,
            pickup_notes: order.business.pickupInstructions ?? "",
            dropoff_notes: order.deliveryInstruction ?? "",
            deliverable_action: order.handoffType,
            pickup_verification: {
                picture: true
            },
            dropoff_verification: order.handoffType === HandoffType.MEET_AT_DOOR
                ? {
                    ...(order.isCatering
                        ? { pin_code: { enabled: true } }
                        : { picture: true }
                    ),
                    ...(order.containsAlcohol && {
                        identification: { min_age: 21, no_sobriety_check: false }
                    }),
                }
                : null,
            undeliverable_action: order.containsAlcohol ? "return" : "leave_at_door",
            manifest_reference: order.orderNumber,
            manifest_total_value: order.customerSubTotal ? Math.round(order.customerSubTotal.toNumber() * 100) : 0,
            quote_id: quoteId,
            external_id: order.id,
        };

        if (pickupAddress.latitude && pickupAddress.longitude) {
            deliveryRequest.pickup_latitude = Number(pickupAddress.latitude);
            deliveryRequest.pickup_longitude = Number(pickupAddress.longitude);
        }
        if (dropoffAddress.latitude && dropoffAddress.longitude) {
            deliveryRequest.dropoff_latitude = Number(dropoffAddress.latitude);
            deliveryRequest.dropoff_longitude = Number(dropoffAddress.longitude);
        }

        if (order.containsAlcohol) {
            deliveryRequest.return_verification = {
                picture: true,
            };
        }

        if (process.env.VERCEL_ENV !== "production") {
            deliveryRequest.test_specifications = {
                robo_courier_specification: {
                    mode: "auto",
                },
            };
        }

        let uberAccountType: UberAccountType;

        if (order.business.type === BusinessType.RETAIL) {
            uberAccountType = UberAccountType.RETAIL;
        } else {
            if (order.isCatering) {
                uberAccountType = UberAccountType.CATERING;
            } else {
                uberAccountType = UberAccountType.RESTAURANT;
            }
        }

        // Create delivery with Uber
        const uberResponse = await uberService.createDelivery(deliveryRequest, uberAccountType);
        const providerFee = uberResponse.fee / 100;

        let surcharge = 0;
        let surchargeType: SurchargeType | null = null;

        if (order.business.type === BusinessType.RETAIL) {
            surcharge = order.business.surchargeRetail?.toNumber() || 0;
            surchargeType = SurchargeType.RETAIL;
        } else {
            if (order.isCatering) {
                surcharge = order.business.surchargeCatering?.toNumber() || 0;
                surchargeType = SurchargeType.CATERING;
            } else {
                const tipInCents = order.totalTip ? Math.round(order.totalTip.toNumber() * 100) : 0;
                const isBaseQuote = (uberResponse.fee - tipInCents) <= 525;
                surcharge = isBaseQuote
                    ? order.business.surchargeBaseQuote?.toNumber() || 0
                    : order.business.surchargeExtendedQuote?.toNumber() || 0;
                surchargeType = isBaseQuote ? SurchargeType.BASE_QUOTE : SurchargeType.EXTENDED_QUOTE;
            }
        }

        // Update order with provider info
        const updatedOrder = await prisma.order.update({
            where: { id },
            data: {
                provider: "uber",
                providerDeliveryId: uberResponse.id,
                providerQuoteId: quoteId ?? null,
                providerQuote: providerFee - (order.totalTip?.toNumber() || 0),
                deliveryFee: providerFee + surcharge - (order.totalTip?.toNumber() || 0),
                totalAmount: providerFee + surcharge,
                trackingUrl: uberResponse.tracking_url,
                serviceFee: surcharge,
                surchargeType: surchargeType ?? undefined,
                status: order.deliveryType === DeliveryType.ASAP ? OrderStatus.RequestingDriver : OrderStatus.Scheduled,
                driverRequestedAt: new Date(),
            },
            select: {
                id: true,
                orderNumber: true,
                businessId: true,
                description: true,
                customerName: true,
                customerPhone: true,
                customerEmail: true,
                deliveryInstruction: true,
                handoffType: true,
                provider: true,
                providerDeliveryId: true,
                trackingUrl: true,
                customerDeliveryFee: true,
                deliveryFee: true,
                discount: true,
                customerSubTotal: true,
                totalAmount: true,
                status: true,
                totalTip: true
            },
        });

        return NextResponse.json(
            {
                success: true,
                message: "Delivery created successfully",
                order: updatedOrder,
                delivery: {
                    id: uberResponse.id,
                    trackingUrl: uberResponse.tracking_url,
                    status: uberResponse.status,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create delivery error:", error);

        // Handle Uber API validation errors
        if (error instanceof UberServiceError) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Failed to create delivery",
                    error: error.message,
                    code: error.code,
                    validationErrors: error.getValidationErrors(),
                },
                { status: error.status }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: "Failed to create delivery",
                error: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}
