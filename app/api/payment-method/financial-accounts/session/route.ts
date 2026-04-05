// app/api/payment-method/financial-accounts/session/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
    try {
        const { businessId } = await req.json();

        if (!businessId) {
            return NextResponse.json({
                success: false,
                message: 'Business ID is required',
            }, { status: 400 });
        }

        const business = await prisma.business.findUnique({
            where: { id: businessId },
            select: { stripeCustomerId: true },
        });

        if (!business?.stripeCustomerId) {
            return NextResponse.json({
                success: false,
                message: 'Stripe customer not found. Please complete business setup first.',
            }, { status: 400 });
        }

        const stripeCustomerId = business.stripeCustomerId;

        const session = await stripe.financialConnections.sessions.create({
            account_holder: {
                type: 'customer',
                customer: stripeCustomerId,
            },
            permissions: ['payment_method', 'balances', 'ownership'],
            prefetch: ['balances', 'ownership'],
            filters: {
                countries: ['US'],
                account_subcategories: ['checking', 'savings'],
            },
        });

        return NextResponse.json({
            success: true,
            clientSecret: session.client_secret,
            sessionId: session.id,
            stripeCustomerId,
        });

    } catch (error: any) {
        console.error('Financial Connections Session Error:', error);

        return NextResponse.json({
            success: false,
            error: error.message,
            message: 'Failed to create bank connection session',
        }, { status: 500 });
    }
}
