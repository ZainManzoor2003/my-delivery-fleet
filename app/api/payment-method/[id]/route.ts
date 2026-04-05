import { NextRequest, NextResponse } from "next/server"
import prisma from '@/lib/prisma'
import { PaymentType } from "@/lib/enums/paymentType"

interface PaymentMethodUpdateSchema {
    paymentType?: string;
    // Card fields
    cardHolderName?: string;
    cardLast4?: string;
    cardExpMonth?: number;
    cardExpYear?: number;
    cardBrand?: string;
    cardNumber?: string;
    // ACH fields
    achAccountHolderName?: string;
    achBankName?: string;
    achRoutingNumber?: string;
    achAccountNumber?: string;
    achAccountLast4?: string;
    achAccountType?: "checking" | "savings";
}

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json(
                { message: "Payment method ID is required" },
                { status: 400 }
            );
        }

        const paymentMethod = await prisma.paymentMethod.findUnique({
            where: { id },
        });

        if (!paymentMethod) {
            return NextResponse.json(
                { message: "Payment method not found" },
                { status: 404 }
            );
        }

        const paymentDetails = {
            businessId: paymentMethod.businessId,
            paymentType: paymentMethod.paymentType,
            ...(paymentMethod.paymentType === PaymentType.CARD && {
                cardHolderName: paymentMethod.cardHolderName,
                cardLast4: paymentMethod.cardLast4,
                cardExpMonth: paymentMethod.cardExpMonth,
                cardExpYear: paymentMethod.cardExpYear,
            }),
            ...(paymentMethod.paymentType === PaymentType.ACH && {
                achAccountHolderName: paymentMethod.achAccountHolderName,
                achBankName: paymentMethod.achBankName,
                achAccountLast4: paymentMethod.achAccountLast4,
                achAccountType: paymentMethod.achAccountType,
            })
        }

        return NextResponse.json(
            { message: "Payment method fetched successfully", paymentDetails },
            { status: 200 }
        );
    } catch (error) {
        console.error("Payment method fetch error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json(
                { message: "Payment method ID is required" },
                { status: 400 }
            );
        }

        const body: PaymentMethodUpdateSchema = await req.json();

        const existingPaymentMethod = await prisma.paymentMethod.findUnique({
            where: { id },
        });

        if (!existingPaymentMethod) {
            return NextResponse.json(
                { message: "Payment method not found" },
                { status: 404 }
            );
        }

        const paymentType = body.paymentType || existingPaymentMethod.paymentType;

        if (paymentType === PaymentType.CARD) {
            if (body.cardExpMonth !== undefined && (body.cardExpMonth < 1 || body.cardExpMonth > 12)) {
                return NextResponse.json(
                    { message: "Card expiration month must be between 1 and 12" },
                    { status: 400 }
                );
            }

            if (body.cardExpYear !== undefined && body.cardExpYear < new Date().getFullYear()) {
                return NextResponse.json(
                    { message: "Card expiration year cannot be in the past" },
                    { status: 400 }
                );
            }

            if (body.cardLast4 !== undefined && body.cardLast4.length !== 4) {
                return NextResponse.json(
                    { message: "Card last 4 digits must be exactly 4 characters" },
                    { status: 400 }
                );
            }

            if (body.cardNumber !== undefined && (body.cardNumber.length < 15 || body.cardNumber.length > 19)) {
                return NextResponse.json(
                    { message: "Card number must be between 15-19 digits" },
                    { status: 400 }
                )
            }
        } else if (paymentType === PaymentType.ACH) {
            if (body.achAccountLast4 !== undefined && body.achAccountLast4.length !== 4) {
                return NextResponse.json(
                    { message: "ACH account last 4 digits must be exactly 4 characters" },
                    { status: 400 }
                );
            }

            if (body.achAccountType !== undefined && !["checking", "savings"].includes(body.achAccountType)) {
                return NextResponse.json(
                    { message: "ACH account type must be 'checking' or 'savings'" },
                    { status: 400 }
                );
            }
            if (body.achRoutingNumber != undefined && body.achRoutingNumber.length != 9) {
                return NextResponse.json(
                    { message: "ACH routing number must be exactly 9 digits" },
                    { status: 400 }
                )
            }

            if (body.achAccountNumber != undefined && (body.achAccountNumber.length < 8 || body.achAccountNumber.length > 20)) {
                return NextResponse.json(
                    { message: "ACH account number must be between 8-20 digits" },
                    { status: 400 }
                )
            }


        }

        await prisma.paymentMethod.update({
            where: { id },
            data: body,
        });

        return NextResponse.json(
            { message: "Payment method updated successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Payment method update error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json(
                { message: "Payment method ID is required" },
                { status: 400 }
            );
        }

        const existingMethod = await prisma.paymentMethod.findUnique({
            where: { id },
        });

        if (!existingMethod) {
            return NextResponse.json(
                { message: "Payment method not found" },
                { status: 404 }
            );
        }

        // Delete payment method
        await prisma.paymentMethod.delete({
            where: { id },
        });

        return NextResponse.json(
            { message: "Payment method deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Payment method delete error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
