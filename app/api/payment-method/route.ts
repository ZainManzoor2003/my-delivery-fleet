import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { PaymentMethodApiResponse } from '@/lib/types/paymentMethod';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const businessId = searchParams.get('businessId');

        if (!businessId) {
            return NextResponse.json(
                { error: 'businessId query parameter is required' },
                { status: 400 }
            );
        }

        const paymentMethod = await prisma.paymentMethod.findUnique({
            where: { businessId },
            select: {
                id: true,
                paymentType: true,
                cardHolderName: true,
                cardLast4: true,
                cardBrand: true,
                cardExpMonth: true,
                cardExpYear: true,
                achAccountHolderName: true,
                achBankName: true,
                achAccountLast4: true,
                achAccountType: true,
                isVerified: true,
                ownershipVerified: true,
                billingAddress: {
                    select: {
                        id: true,
                        type: true,
                        address: true,
                        street: true,
                        city: true,
                        state: true,
                        postalCode: true,
                    },
                },
            },
        });

        return NextResponse.json(
            { success: true, paymentMethod: paymentMethod as unknown as PaymentMethodApiResponse['paymentMethod'] ?? null },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error fetching payment method:', error);
        return NextResponse.json<PaymentMethodApiResponse>(
            { success: false, paymentMethod: null, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
