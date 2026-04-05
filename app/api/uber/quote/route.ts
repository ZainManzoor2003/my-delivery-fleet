import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uberService, UberServiceError } from "@/services/ubserService";
import { DeliveryType } from "@/lib/enums/deliveryType";
import { BusinessType } from "@/lib/enums/businessType";
import { UberAccountType } from "@/lib/enums/uberAccountType";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            businessId,
            customerSubTotal,
            deliveryAddress,
            driverTip,
            handoffType,
            deliveryType,
            estimatedPickupTime,
            isCatering,
        } = body;

        if (!businessId || !deliveryAddress || !customerSubTotal) {
            return NextResponse.json(
                { message: "businessId, customerSubTotal and deliveryAddress are required" },
                { status: 400 }
            );
        }

        if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.postalCode) {
            return NextResponse.json(
                { message: "Delivery address is incomplete" },
                { status: 400 }
            );
        }

        const business = await prisma.business.findUnique({
            where: { id: businessId },
            select: {
                type: true,
                surchargeBaseQuote: true,
                surchargeExtendedQuote: true,
                surchargeCatering: true,
                surchargeRetail: true,
                address: true,
            },
        });

        if (!business?.address) {
            return NextResponse.json(
                { message: "Business pickup address not configured" },
                { status: 400 }
            );
        }

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

        const pickupReadyDt =
            deliveryType === DeliveryType.SCHEDULE && estimatedPickupTime
                ? new Date(estimatedPickupTime).toISOString()
                : new Date().toISOString();

        const quoteRequest: Record<string, unknown> = {
            pickup_address: formatUberAddress(business.address),
            dropoff_address: formatUberAddress(deliveryAddress),
            pickup_ready_dt: pickupReadyDt,
            manifest_total_value: Math.round(Number(customerSubTotal) * 100),
        };

        if (driverTip) {
            quoteRequest.tip = Math.round(Number(driverTip) * 100);
        }
        if (handoffType) {
            quoteRequest.deliverable_action = handoffType;
        }
        if (business.address.latitude && business.address.longitude) {
            quoteRequest.pickup_latitude = Number(business.address.latitude);
            quoteRequest.pickup_longitude = Number(business.address.longitude);
        }
        if (deliveryAddress.latitude && deliveryAddress.longitude) {
            quoteRequest.dropoff_latitude = Number(deliveryAddress.latitude);
            quoteRequest.dropoff_longitude = Number(deliveryAddress.longitude);
        }

        let uberAccountType: UberAccountType;

        if (business.type === BusinessType.RETAIL) {
            uberAccountType = UberAccountType.RETAIL;
        } else {
            if (isCatering) {
                uberAccountType = UberAccountType.CATERING;
            } else {
                uberAccountType = UberAccountType.RESTAURANT;
            }
        }

        const quoteResponse = await uberService.createQuote(quoteRequest, uberAccountType);

        let surcharge = 0;

        if (business.type === BusinessType.RETAIL) {
            surcharge = Number(business.surchargeRetail);
        } else {
            if (isCatering) {
                surcharge = Number(business.surchargeCatering);
            } else {
                const tipInCents = driverTip ? Math.round(Number(driverTip) * 100) : 0;
                surcharge = (quoteResponse.fee - tipInCents) <= 525
                    ? Number(business.surchargeBaseQuote)
                    : Number(business.surchargeExtendedQuote);
            }
        }

        const dispatchFee = (quoteResponse.fee / 100) + surcharge;

        return NextResponse.json(
            {
                success: true,
                quote: {
                    id: quoteResponse.id,
                    fee: dispatchFee,
                    currency: quoteResponse.currency,
                    expires: quoteResponse.expires,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Get Uber quote error:", error);

        if (error instanceof UberServiceError) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Failed to get delivery quote",
                    error: error.message,
                    validationErrors: error.getValidationErrors(),
                },
                { status: error.status }
            );
        }

        return NextResponse.json(
            {
                success: false,
                message: "Failed to get delivery quote",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
