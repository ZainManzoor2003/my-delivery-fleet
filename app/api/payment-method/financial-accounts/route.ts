// app/api/payment-method/financial-accounts/route.ts
import { PaymentType } from '@/lib/enums/paymentType';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { BusinessStatus } from '@/lib/types/business';
import { autoBillPendingInvoices } from '@/services/billingService';

export async function POST(req: Request) {
    try {
        const {
            businessId,
            customerId,
            financialConnectionsAccountId,
        } = await req.json();

        // Validate inputs
        if (!customerId || !financialConnectionsAccountId) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields',
            }, { status: 400 });
        }

        if (!businessId) {
            return NextResponse.json({
                success: false,
                message: 'Business ID is required',
            }, { status: 400 });
        }

        const business = await prisma.business.findUnique({
            where: { id: businessId },
        });

        if (!business) {
            return NextResponse.json({
                success: false,
                message: 'Business not found',
            }, { status: 404 });
        }

        // Step 1: Retrieve the Financial Connections Account
        const fcAccount = await stripe.financialConnections.accounts.retrieve(
            financialConnectionsAccountId
        );

        // Check if account is active
        if (fcAccount.status !== 'active') {
            return NextResponse.json({
                success: false,
                message: `Bank account is ${fcAccount.status}. Please reconnect.`,
            }, { status: 400 });
        }

        // Step 2: Create a PaymentMethod from the FC Account
        const paymentMethod = await stripe.paymentMethods.create({
            type: 'us_bank_account',
            us_bank_account: {
                financial_connections_account: financialConnectionsAccountId,
            },
            billing_details: {
                name: business.name,
            },
        });

        // Step 3: Attach PaymentMethod to Customer
        await stripe.paymentMethods.attach(paymentMethod.id, {
            customer: customerId,
        });

        const forwardedFor = req.headers.get('x-forwarded-for');
        const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        await stripe.setupIntents.create({
            customer: customerId,
            payment_method: paymentMethod.id,
            payment_method_types: ['us_bank_account'],
            usage: 'off_session',
            confirm: true,
            mandate_data: {
                customer_acceptance: {
                    type: 'online',
                    online: {
                        ip_address: ipAddress,
                        user_agent: userAgent,
                    },
                },
            },
        });

        // Step 4: Set as default payment method
        await stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethod.id,
            },
        });

        // Step 5: Get balance information
        const balanceInfo = {
            available: fcAccount.balance?.cash?.available?.usd || 0,
            current: fcAccount.balance?.current?.usd || 0,
            asOf: fcAccount.balance?.as_of,
        };

        // Step 6: Get ownership verification
        const ownershipVerified = !!fcAccount.ownership;

        // Step 7: Save to Database
        const existingPaymentMethod = await prisma.paymentMethod.findUnique({
            where: { businessId: businessId },
        });

        if (existingPaymentMethod) {
            await prisma.paymentMethod.update({
                where: { businessId: businessId },
                data: {
                    stripePaymentMethodId: paymentMethod.id,
                    financialConnectionsAccountId: fcAccount.id,
                    paymentType: PaymentType.ACH,

                    // ACH info (safe to store)
                    achBankName: fcAccount.institution_name || 'Unknown Bank',
                    achAccountLast4: fcAccount.last4,
                    achAccountType: fcAccount.subcategory,

                    // Clear card fields
                    cardHolderName: null,
                    cardLast4: null,
                    cardBrand: null,
                    cardExpMonth: null,
                    cardExpYear: null,

                    // Verification info
                    isVerified: true,
                    verificationDate: new Date(),
                    ownershipVerified: ownershipVerified,

                    // Balance info
                    lastBalanceCheck: new Date(),
                    availableBalance: BigInt(balanceInfo.available),
                    currentBalance: BigInt(balanceInfo.current),

                    // Status
                    isDefault: true,
                    isActive: true,
                },
            });
        } else {
            // Create new payment method
            await prisma.paymentMethod.create({
                data: {
                    businessId: businessId,
                    stripePaymentMethodId: paymentMethod.id,
                    financialConnectionsAccountId: fcAccount.id,
                    paymentType: PaymentType.ACH,

                    // ACH info (safe to store)
                    achBankName: fcAccount.institution_name || 'Unknown Bank',
                    achAccountLast4: fcAccount.last4,
                    achAccountType: fcAccount.subcategory,

                    // Verification info
                    isVerified: true,
                    verificationDate: new Date(),
                    ownershipVerified: ownershipVerified,

                    // Balance info
                    lastBalanceCheck: new Date(),
                    availableBalance: BigInt(balanceInfo.available),
                    currentBalance: BigInt(balanceInfo.current),

                    // Status
                    isDefault: true,
                    isActive: true,
                },
            });
            await prisma.business.update({
                where: { id: businessId },
                data: { status: BusinessStatus.UNDER_REVIEW },
            });
        }

        // Step 8: Update business with Stripe customer ID if not set
        await prisma.business.update({
            where: { id: businessId },
            data: { stripeCustomerId: customerId },
        });

        // Auto-bill any pending/failed invoices now that payment method is updated
        autoBillPendingInvoices(businessId).catch((err) =>
            console.error('Auto-billing pending invoices failed:', err)
        );

        return NextResponse.json({
            success: true,
            paymentMethodId: paymentMethod.id,
            bankName: fcAccount.institution_name,
            last4: fcAccount.last4,
            accountType: fcAccount.subcategory,
            verified: true,
            ownershipVerified,
            balanceInfo,
            financialConnectionsAccountId: fcAccount.id,
            message: 'Bank account verified and linked successfully',
        });

    } catch (error: any) {
        console.error('Complete Financial Connections Error:', error);

        let errorMessage = 'Failed to complete bank account setup';

        if (error.type === 'StripeInvalidRequestError') {
            errorMessage = 'Invalid bank account information';
        } else if (error.code === 'resource_missing') {
            errorMessage = 'Bank account session expired. Please try again.';
        }

        return NextResponse.json({
            success: false,
            error: error.message,
            code: error.code,
            message: errorMessage,
        }, { status: 500 });
    }
}
