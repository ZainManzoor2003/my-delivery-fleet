import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Order, OrderItem, OrderItemSize, OrderStatus } from "@/lib/types/order";
import { AddressType } from "@/lib/enums/address";
import { DeliveryType } from "@/lib/enums/deliveryType";

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json(
                { message: "Order ID is required" },
                { status: 400 }
            );
        }

        const body: Order = await req.json();


        const existingOrder = await prisma.order.findUnique({
            where: { id },
            select: { orderNumber: true, status: true },
        });

        if (!existingOrder) {
            return NextResponse.json(
                { message: "Order not found" },
                { status: 404 }
            );
        }

        const { items, deliveryAddress, status, courier, estimatedPickupTime, quoteExpiresAt, ...orderData } = body;

        const estimatedPickupTimeDate = estimatedPickupTime ? new Date(estimatedPickupTime as any) : null;
        const quoteExpiresAtDate = quoteExpiresAt ? new Date(quoteExpiresAt as any) : null;

        // Check if orderNumber is being updated and validate for same-day duplicates
        if (orderData.orderNumber && orderData.orderNumber !== existingOrder.orderNumber) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)

            const existingOrderWithSameNumber = await prisma.order.findFirst({
                where: {
                    orderNumber: orderData.orderNumber,
                    createdAt: {
                        gte: today,
                        lt: tomorrow
                    },
                    id: {
                        not: id
                    }
                },
            })

            if (existingOrderWithSameNumber) {
                return NextResponse.json(
                    { message: "Order number already exists for today" },
                    { status: 409 }
                )
            }
        }

        const isNewItem = (item: OrderItem) => !item.id || item.id == null || (typeof item.id === 'string' && item.id.startsWith('new_'));
        const itemsToUpdate = items?.filter((item: OrderItem) => !isNewItem(item)) ?? [];
        const itemsToCreate = items?.filter((item: OrderItem) => isNewItem(item)) ?? [];

        const order = await prisma.order.update({
            where: { id },
            data: {
                ...orderData,
                totalTip: Number(orderData.driverTip) + Number(orderData.customerTip),
                estimatedPickupTime: estimatedPickupTimeDate,
                providerQuote: null,
                serviceFee: null,
                quoteExpiresAt: quoteExpiresAtDate,
                status: orderData.deliveryType === DeliveryType.ASAP ? status : OrderStatus.Scheduled || existingOrder.status,
                deliveryAddress: deliveryAddress ? {
                    upsert: {
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
                        update: {
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
                } : undefined,
                items: items ? {
                    deleteMany: {
                        id: {
                            notIn: itemsToUpdate.map((item: OrderItem) => String(item.id))
                        }
                    },
                    update: itemsToUpdate.map((item: OrderItem) => ({
                        where: { id: String(item.id) },
                        data: {
                            name: item.name,
                            size: OrderItemSize.Small,
                            quantity: item.quantity ?? 1,
                            unitPrice: item.unitPrice ?? null,
                        },
                    })),
                    create: itemsToCreate.map((item: OrderItem) => ({
                        name: item.name,
                        size: OrderItemSize.Small,
                        quantity: item.quantity ?? 1,
                        unitPrice: item.unitPrice ?? null,
                    })),
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
                isCatering: true,
                containsAlcohol: true,
                provider: true,
                providerDeliveryId: true,
                providerQuoteId: true,
                quoteExpiresAt: true,
                trackingUrl: true,
                customerDeliveryFee: true,
                customerTip: true,
                driverTip: true,
                totalTip: true,
                discount: true,
                customerSubTotal: true,
                totalAmount: true,
                status: true,
                deliveryType: true,
                estimatedDeliveryTime: true,
                estimatedPickupTime: true,
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
        });

        return NextResponse.json(
            { success: true, message: "Order updated successfully", order },
            { status: 200 }
        );
    } catch (error) {
        console.error("Update order error:", error);

        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params

    if (!id) {
        return NextResponse.json(
            { message: "Order ID is required" },
            { status: 400 }
        )
    }

    try {
        const existingOrder = await prisma.order.findUnique({
            where: { id },
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
                isCatering: true,
                containsAlcohol: true,
                provider: true,
                providerDeliveryId: true,
                providerQuoteId: true,
                quoteExpiresAt: true,
                trackingUrl: true,
                customerDeliveryFee: true,
                customerTip: true,
                driverTip: true,
                totalTip: true,
                discount: true,
                customerSubTotal: true,
                totalAmount: true,
                deliveryFee: true,
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
                courier: true,
            },
        })

        if (!existingOrder) {
            return NextResponse.json(
                { message: "Order not found" },
                { status: 404 }
            )
        }

        return NextResponse.json(
            { success: true, message: "Order fetched successfully", order: existingOrder },
            { status: 200 }
        )
    } catch (error) {
        console.error("Get order error:", error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params

    if (!id) {
        return NextResponse.json(
            { message: "Order ID is required" },
            { status: 400 }
        )
    }

    try {
        const existingOrder = await prisma.order.findUnique({
            where: { id },
        })

        if (!existingOrder) {
            return NextResponse.json(
                { message: "Order not found" },
                { status: 404 }
            )
        }

        await prisma.order.delete({
            where: { id },
        })

        return NextResponse.json(
            { success: true, message: "Order deleted successfully" },
            { status: 200 }
        )
    } catch (error) {
        console.error("Delete order error:", error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}
