// app/api/payment-method/setup-card-token/route.ts
import { PaymentType } from '@/lib/enums/paymentType';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { AddressType } from '@/lib/enums/address';
import { BusinessStatus } from '@/lib/types/business';
import { autoBillPendingInvoices } from '@/services/billingService';

export async function POST(req: Request) {
    try {
        const {
            businessId,
            paymentMethodId,
            cardholderName,
            billingAddress,
        } = await req.json();

        if (!businessId) {
            return NextResponse.json({
                success: false,
                message: 'Business ID is required',
            }, { status: 400 });
        }

        if (!paymentMethodId || !paymentMethodId.startsWith('pm_')) {
            return NextResponse.json({
                success: false,
                message: 'Invalid payment method ID',
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

        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: stripeCustomerId,
        });

        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

        const setupIntent = await stripe.setupIntents.create({
            customer: stripeCustomerId,
            payment_method: paymentMethodId,
            confirm: true,
            usage: 'off_session',
            payment_method_types: ['card'],
            automatic_payment_methods: {
                enabled: false,
            },
            mandate_data: {
                customer_acceptance: {
                    type: 'online',
                    online: {
                        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
                        user_agent: req.headers.get('user-agent') || 'unknown',
                    },
                },
            },
        });

        // Check if verification requires action (3D Secure)
        if (setupIntent.status === 'requires_action') {
            return NextResponse.json({
                success: false,
                requiresAction: true,
                clientSecret: setupIntent.client_secret,
                nextActionType: setupIntent.next_action?.type,
                message: 'Card requires 3D Secure authentication',
            });
        }

        if (setupIntent.status === 'succeeded') {
            const verificationChecks = {
                cvcCheck: paymentMethod.card?.checks?.cvc_check,
                avsCheck: paymentMethod.card?.checks?.address_postal_code_check,
            };

            await stripe.customers.update(stripeCustomerId, {
                invoice_settings: {
                    default_payment_method: paymentMethodId,
                },
            });

            const existingPaymentMethod = await prisma.paymentMethod.findUnique({
                where: { businessId: businessId },
            });

            let savedPaymentMethod;

            if (existingPaymentMethod) {
                savedPaymentMethod = await prisma.paymentMethod.update({
                    where: { businessId: businessId },
                    data: {
                        stripePaymentMethodId: paymentMethodId,
                        paymentType: PaymentType.CARD,

                        // Card info (safe to store)
                        cardHolderName: cardholderName,
                        cardLast4: paymentMethod.card?.last4,
                        cardBrand: paymentMethod.card?.brand,
                        cardExpMonth: paymentMethod.card?.exp_month,
                        cardExpYear: paymentMethod.card?.exp_year,

                        // Clear ACH fields
                        achAccountHolderName: null,
                        achBankName: null,
                        achAccountLast4: null,
                        achAccountType: null,
                        financialConnectionsAccountId: null,

                        // Verification info
                        isVerified: true,
                        verificationDate: new Date(),
                        cvcCheckResult: verificationChecks.cvcCheck,
                        avsCheckResult: verificationChecks.avsCheck,

                        // Status
                        isDefault: true,
                        isActive: true,
                    },
                });

                if (billingAddress && existingPaymentMethod) {
                    await prisma.address.upsert({
                        where: { paymentMethodId: existingPaymentMethod.id },
                        create: {
                            type: AddressType.BILLING,
                            address: billingAddress.address,
                            street: billingAddress.street,
                            apartment: billingAddress.apartment,
                            city: billingAddress.city,
                            state: billingAddress.state,
                            postalCode: billingAddress.postalCode,
                            paymentMethodId: existingPaymentMethod.id,
                            latitude: billingAddress.latitude,
                            longitude: billingAddress.longitude,
                        },
                        update: {
                            address: billingAddress.address,
                            street: billingAddress.street,
                            apartment: billingAddress.apartment,
                            city: billingAddress.city,
                            state: billingAddress.state,
                            postalCode: billingAddress.postalCode,
                            latitude: billingAddress.latitude,
                            longitude: billingAddress.longitude,
                        },
                    });
                }
            } else {
                savedPaymentMethod = await prisma.paymentMethod.create({
                    data: {
                        businessId: businessId,
                        stripePaymentMethodId: paymentMethodId,
                        paymentType: PaymentType.CARD,

                        // Card info (safe to store)
                        cardHolderName: cardholderName,
                        cardLast4: paymentMethod.card?.last4,
                        cardBrand: paymentMethod.card?.brand,
                        cardExpMonth: paymentMethod.card?.exp_month,
                        cardExpYear: paymentMethod.card?.exp_year,

                        // Verification info
                        isVerified: true,
                        verificationDate: new Date(),
                        cvcCheckResult: verificationChecks.cvcCheck,
                        avsCheckResult: verificationChecks.avsCheck,

                        // Status
                        isDefault: true,
                        isActive: true,
                    },
                });

                if (billingAddress) {
                    await prisma.address.create({
                        data: {
                            type: AddressType.BILLING,
                            address: billingAddress.address,
                            street: billingAddress.street,
                            apartment: billingAddress.apartment,
                            city: billingAddress.city,
                            state: billingAddress.state,
                            postalCode: billingAddress.postalCode,
                            paymentMethodId: savedPaymentMethod.id,
                            latitude: billingAddress.latitude,
                            longitude: billingAddress.longitude,
                        },
                    });
                }

                await prisma.business.update({
                    where: { id: businessId },
                    data: { status: BusinessStatus.UNDER_REVIEW },
                });
            }

            await prisma.business.update({
                where: { id: businessId },
                data: { stripeCustomerId },
            });

            // Auto-bill any pending/failed invoices now that payment method is updated
            autoBillPendingInvoices(businessId).catch((err) =>
                console.error('Auto-billing pending invoices failed:', err)
            );

            return NextResponse.json({
                success: true,
                stripeCustomerId,
                paymentMethodId: paymentMethodId,
                cardBrand: paymentMethod.card?.brand,
                last4: paymentMethod.card?.last4,
                expMonth: paymentMethod.card?.exp_month,
                expYear: paymentMethod.card?.exp_year,
                verified: true,
                verificationChecks,
                savedToDatabase: true,
                message: 'Card verified successfully',
            });
        }

        return NextResponse.json({
            success: false,
            status: setupIntent.status,
            lastSetupError: setupIntent.last_setup_error?.message,
            message: setupIntent.last_setup_error?.message || 'Card verification failed',
        }, { status: 400 });

    } catch (error: any) {
        console.error('Card Setup Error:', error);

        let errorMessage = 'Failed to verify card. Please try again.';

        if (error.type === 'StripeCardError') {
            errorMessage = error.message;
        } else if (error.code === 'resource_missing') {
            errorMessage = 'Payment method not found. Please try again.';
        } else if (error.code === 'card_declined') {
            errorMessage = 'Card was declined. Please use a different card.';
        }

        return NextResponse.json({
            success: false,
            error: error.message,
            code: error.code,
            type: error.type,
            message: errorMessage,
        }, { status: 500 });
    }
}
