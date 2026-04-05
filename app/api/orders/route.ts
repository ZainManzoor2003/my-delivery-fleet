import prisma from "@/lib/prisma"
import { OrderStatus } from "@/lib/types/order"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const businessId = searchParams.get("businessId")
        const limit = parseInt(searchParams.get("limit") || "10")
        const offset = parseInt(searchParams.get("offset") || "0")
        const minimal = searchParams.get("minimal") === "true" ? true : false

        if (!businessId) {
            return NextResponse.json({ message: "businessId query param is required" }, { status: 400 })
        }

        const selectFields = minimal
            ? {
                id: true,
                orderNumber: true,
                businessId: true,
                customerName: true,
                customerPhone: true,
                customerEmail: true,
                customerDeliveryFee: true,
                customerTip: true,
                driverTip: true,
                totalTip: true,
                customerSubTotal: true,
                status: true,
                estimatedDeliveryTime: true,
                providerDeliveryId: true,
                estimatedPickupTime: true,
                createdAt: true,
                deliveredAt: true,
                deliveryAddress: true,
                isClearedFromTracking: true,
            } : {
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
                customerTip: true,
                driverTip: true,
                totalTip: true,
                discount: true,
                customerSubTotal: true,
                totalAmount: true,
                status: true,
                estimatedDeliveryTime: true,
                estimatedPickupTime: true,
                createdAt: true,
                deliveredAt: true,
                driverRequestedAt: true,
                driverAcceptedAt: true,
                deliveryStartTime: true,
                isClearedFromTracking: true,
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
            }

        const ninetyMinutesFromNow = new Date(Date.now() + 90 * 60 * 1000)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
        const ninetyMinutesAgo = new Date(Date.now() - 90 * 60 * 1000)

        const whereClause = minimal
            ? { businessId }
            : {
                businessId,
                deliveryAddress: {
                    is: {
                        street: { not: "" },
                        city: { not: "" },
                        postalCode: { not: "" },
                    },
                },
                AND: [
                    {
                        OR: [
                            {
                                status: {
                                    notIn: [
                                        OrderStatus.Canceled,
                                        OrderStatus.Scheduled,
                                    ],
                                },
                            },
                            {
                                status: OrderStatus.Scheduled,
                                providerDeliveryId: { not: null },
                                estimatedPickupTime: { lte: ninetyMinutesFromNow },
                                OR: [
                                    { isClearedFromTracking: false },
                                    {
                                        isClearedFromTracking: null,
                                        createdAt: { gte: ninetyMinutesAgo },
                                    },
                                ],
                            },
                            {
                                status: OrderStatus.Scheduled,
                                providerDeliveryId: null,
                                OR: [
                                    { isClearedFromTracking: false },
                                    {
                                        isClearedFromTracking: null,
                                        createdAt: { gte: ninetyMinutesAgo },
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        OR: [
                            { status: { not: OrderStatus.Delivered } },
                            { deliveredAt: { gte: fifteenMinutesAgo } },
                        ],
                    },
                    {
                        OR: [
                            { status: { not: OrderStatus.Unassigned } },
                            { createdAt: { gte: ninetyMinutesAgo } },
                            { isClearedFromTracking: false },
                        ],
                    },
                    {
                        OR: [
                            { isClearedFromTracking: false },
                            {
                                isClearedFromTracking: null,
                                createdAt: { gte: ninetyMinutesAgo },
                            },
                        ],
                    },
                ],
            }
        const [orders, totalCount] = await Promise.all([
            prisma.order.findMany({
                where: whereClause,
                select: selectFields,
                orderBy: {
                    createdAt: 'desc'
                },
                ...(minimal && { skip: offset, take: limit }),
            }),
            prisma.order.count({
                where: whereClause
            })
        ])

        const hasMore = offset + limit < totalCount

        return NextResponse.json({
            message: "Orders fetched",
            orders: orders || [],
            pagination: {
                limit,
                offset,
                totalCount,
                hasMore
            }
        }, { status: 200 })
    } catch (error: any) {
        console.error("Get orders error:", error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}