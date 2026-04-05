import { NextRequest, NextResponse } from "next/server"
import prisma from '@/lib/prisma'
import crypto from "crypto"
import { AddressType } from "@/lib/enums/address"
import { OrderItemSize } from "@/lib/types/order"

function generateOrderNumber(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    const randomBytes = crypto.randomBytes(8)
    for (let i = 0; i < 8; i++) {
        result += chars[randomBytes[i] % chars.length]
    }
    return result
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        const {
            businessId,
            description,
            orderNumber,
            customerName,
            customerPhone,
            customerEmail,
            deliveryAddress,
            deliveryInstruction,
            deliveryFee,
            handoffType,
            deliveryType,
            discount,
            customerDeliveryFee,
            customerTip,
            driverTip,
            customerSubTotal,
            status,
            items,
            estimatedPickupTime,
            providerQuoteId,
            quoteExpiresAt,
            isCatering,
            containsAlcohol,
        } = body

        if (
            !businessId ||
            !customerName ||
            !customerPhone ||
            !status ||
            !customerSubTotal ||
            !customerDeliveryFee ||
            !customerTip ||
            !driverTip ||
            deliveryFee == null
        ) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            )
        }

        if (orderNumber) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)

            const existingOrder = await prisma.order.findFirst({
                where: {
                    orderNumber,
                    createdAt: {
                        gte: today,
                        lt: tomorrow
                    }
                },
            })

            if (existingOrder) {
                return NextResponse.json(
                    { message: "Order number already exists for today" },
                    { status: 409 }
                )
            }
        }

        const orderNum = orderNumber || generateOrderNumber()
        const estimatedPickupTimeDate = estimatedPickupTime ? new Date(estimatedPickupTime) : null
        const quoteExpiresAtDate = quoteExpiresAt ? new Date(quoteExpiresAt) : null

        const order = await prisma.order.create({
            data: {
                businessId,
                orderNumber: orderNum,
                description,
                customerName,
                customerPhone,
                customerEmail,
                deliveryInstruction,
                handoffType,
                deliveryType,
                customerDeliveryFee,
                customerTip,
                driverTip,
                totalTip: Number(driverTip) + Number(customerTip),
                isCatering: isCatering ?? false,
                containsAlcohol: containsAlcohol ?? false,
                customerSubTotal,
                discount,
                status: status,
                deliveryFee,
                estimatedPickupTime: estimatedPickupTimeDate,
                providerQuoteId: providerQuoteId || null,
                providerQuote: null,
                serviceFee: null,
                quoteExpiresAt: quoteExpiresAtDate,
                ...(deliveryAddress && deliveryAddress.street && deliveryAddress.city && deliveryAddress.state && deliveryAddress.postalCode ? {
                    deliveryAddress: {
                        create: {
                            type: AddressType.DELIVERY,
                            address: deliveryAddress.address,
                            street: deliveryAddress.street,
                            apartment: deliveryAddress.apartment,
                            city: deliveryAddress.city,
                            state: deliveryAddress.state,
                            postalCode: deliveryAddress.postalCode,
                            latitude: deliveryAddress.latitude,
                            longitude: deliveryAddress.longitude,
                        },
                    },
                } : {}),
                items: items?.length > 0 ? {
                    create: items.map((item: {
                        name: string;
                        size: OrderItemSize.Small;
                        quantity?: number;
                        unitPrice?: number;
                    }) => ({
                        name: item.name,
                        size: OrderItemSize.Small,
                        quantity: item.quantity ?? 1,
                        unitPrice: item.unitPrice ?? null,
                    }))
                } : undefined,
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
                providerQuoteId: true,
                quoteExpiresAt: true,
                trackingUrl: true,
                customerDeliveryFee: true,
                deliveryFee: true,
                customerTip: true,
                driverTip: true,
                totalTip: true,
                discount: true,
                customerSubTotal: true,
                totalAmount: true,
                status: true,
                estimatedDeliveryTime: true,
                estimatedPickupTime: true,
                deliveryType: true,
                createdAt: true,
                deliveredAt: true,
                driverRequestedAt: true,
                driverAcceptedAt: true,
                deliveryStartTime: true,
                items: {
                    select: {
                        id: true,
                        name: true,
                        quantity: true,
                        unitPrice: true,
                    }
                },
                deliveryAddress: true,
            },
        })

        return NextResponse.json(
            { success: true, message: "Order created successfully", order },
            { status: 201 }
        )
        
    } catch (error: any) {
        console.error("Create order error:", error)

        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}