// app/api/business/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { BusinessType } from '@/lib/enums/businessType';
import { Business, BusinessStatus } from '@/lib/types/business';
import { AddressType } from '@/lib/enums/address';
import { stripe } from '@/lib/stripe';

function generateReferralCode(): string {
    const timestamp = Date.now().toString(36).slice(-4);
    const random = Math.random().toString(36).substring(2, 6);
    return (timestamp + random).toUpperCase();
}

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const {
            userId,
            name,
            pickupInstructions,
            phone,
            address,
            routingPreference,
            referredByCode,
            type,
            logo,
            avgOrdersPerDay,
            deliveryRadius,
        } = data;

        // Validate required fields
        if (!userId || !name || !phone || !address) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (!address.address || !address.street || !address.city || !address.state || !address.postalCode) {
            return NextResponse.json(
                { error: 'Address must include address, street, city, state, and postalCode' },
                { status: 400 }
            );
        }

        const [user, existingBusiness, referrer] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId } }),
            prisma.business.findUnique({ where: { userId } }),
            referredByCode
                ? prisma.business.findUnique({ where: { referralCode: referredByCode } })
                : Promise.resolve(null),
        ]);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        if (existingBusiness) {
            return NextResponse.json(
                { error: 'User already has a business', business: existingBusiness },
                { status: 400 }
            );
        }

        if (referredByCode && !referrer) {
            return NextResponse.json(
                { error: 'Invalid referral code' },
                { status: 400 }
            );
        }

        const referralCode = generateReferralCode();

        let stripeCustomer;
        try {
            stripeCustomer = await stripe.customers.create({
                name: name,
                phone: phone,
                email: user.email || undefined,
                address: {
                    line1: address.street,
                    line2: address.apartment || undefined,
                    city: address.city,
                    state: address.state,
                    postal_code: address.postalCode,
                    country: 'US',
                },
                metadata: {
                    userId: user.id,
                    businessName: name,
                },
            });
        } catch (stripeError: any) {
            console.error('Stripe customer creation error:', stripeError);
            return NextResponse.json(
                { error: 'Failed to create payment account', details: stripeError.message },
                { status: 500 }
            );
        }

        // Create new business with Stripe customer ID
        const business = await prisma.business.create({
            data: {
                userId: user.id,
                type: type || BusinessType.RESTAURANT,
                name,
                pickupInstructions: pickupInstructions || null,
                logo: logo || null,
                phone,
                routingPreference: routingPreference || 'auto',
                referralCode,
                referredByCode: referredByCode || null,
                avgOrdersPerDay: avgOrdersPerDay,
                deliveryRadius: deliveryRadius,
                status: BusinessStatus.INCOMPLETE,
                stripeCustomerId: stripeCustomer.id,
                address: {
                    create: {
                        type: AddressType.BUSINESS,
                        address: address.address,
                        street: address.street,
                        apartment: address.apartment || null,
                        city: address.city,
                        state: address.state,
                        postalCode: address.postalCode,
                        latitude: address.latitude || null,
                        longitude: address.longitude || null,
                    }
                }
            },
            include: {
                address: true,
            }
        });

        // Update the referrer's record to track that their code was used
        if (referredByCode && referrer) {
            await prisma.business.update({
                where: { id: referrer.id },
                data: {
                    referrerCodeUsedBy: business.id,
                    referredCodeUsedAt: new Date(),
                },
            });
        }

        return NextResponse.json(
            { success: true, business },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating business:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('user-id');
        const fields = searchParams.get('fields');

        // Validate required parameter
        if (!userId) {
            return NextResponse.json(
                { error: 'user-id query parameter is required' },
                { status: 400 }
            );
        }

        if (fields === 'minimal') {
            const business = await prisma.business.findUnique({
                where: { userId },
                select: {
                    id: true,
                    status: true,
                    type: true,
                    paymentMethod: {
                        select: { id: true }
                    },
                    address: true,
                }
            });

            if (!business) {
                return NextResponse.json(
                    { error: 'Business not found for this user' },
                    { status: 404 }
                );
            }

            return NextResponse.json({
                success: true,
                business: {
                    id: business.id,
                    status: business.status,
                    type: business.type,
                    paymentMethod: business.paymentMethod ? { id: business.paymentMethod.id } : null,
                    address: business.address,
                }
            }, { status: 200 });
        }

        // Full fetch - all business details with relations
        const business = await prisma.business.findUnique({
            where: { userId },
            include: {
                address: true,
                paymentMethod: {
                    include: {
                        billingAddress: true,
                    }
                }
            }
        });

        if (!business) {
            return NextResponse.json(
                { error: 'Business not found for this user' },
                { status: 404 }
            );
        }

        const businessResponse: Business = {
            id: business.id,
            name: business.name,
            phone: business.phone,
            pickupInstructions: business.pickupInstructions,
            address: business.address ? {
                id: business.address.id,
                address: business.address.address,
                street: business.address.street,
                apartment: business.address.apartment,
                city: business.address.city,
                state: business.address.state,
                postalCode: business.address.postalCode,
                latitude: business.address.latitude,
                longitude: business.address.longitude,
                type: business.address.type as AddressType,
            } : null,
            routingPreference: business.routingPreference,
            referralCode: business.referralCode,
            referredByCode: business.referredByCode,
            type: business.type,
            logo: business.logo,
            avgOrdersPerDay: business.avgOrdersPerDay,
            deliveryRadius: business.deliveryRadius,
            userId: business.userId,
            status: business.status as BusinessStatus,
            stripeCustomerId: business.stripeCustomerId,
            paymentMethod: business.paymentMethod ? {
                id: business.paymentMethod.id,
                businessId: business.paymentMethod.businessId,
                financialConnectionsAccountId: business.paymentMethod.financialConnectionsAccountId || null,
                paymentType: business.paymentMethod.paymentType,
                stripePaymentMethodId: business.paymentMethod.stripePaymentMethodId,
                cardHolderName: business.paymentMethod.cardHolderName,
                achAccountHolderName: business.paymentMethod.achAccountHolderName,
                billingAddress: business.paymentMethod.billingAddress ? {
                    id: business.paymentMethod.billingAddress.id,
                    address: business.paymentMethod.billingAddress.address,
                    street: business.paymentMethod.billingAddress.street,
                    apartment: business.paymentMethod.billingAddress.apartment,
                    city: business.paymentMethod.billingAddress.city,
                    state: business.paymentMethod.billingAddress.state,
                    postalCode: business.paymentMethod.billingAddress.postalCode,
                    type: business.paymentMethod.billingAddress.type as AddressType,
                } : null,
            } : null,
            createdAt: business.createdAt,
            updatedAt: business.updatedAt,
        }

        return NextResponse.json(
            { success: true, business: businessResponse },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error fetching business:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
