import prisma from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'
import { Order } from '@/lib/types/order'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = parseInt(searchParams.get('offset') || '0')

        const [orders, totalCount] = await Promise.all([
            prisma.order.findMany({
                select: {
                    id: true,
                    businessId: true,
                    orderNumber: true,
                    createdAt: true,
                    customerName: true,
                    deliveryAddress: true,
                    status: true,
                    estimatedDeliveryTime: true,
                    estimatedPickupTime: true,
                    deliveredAt: true,
                    customerSubTotal: true,
                    customerDeliveryFee: true,
                    customerTip: true,
                    business: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: offset,
                take: limit,
            }),
            prisma.invoice.count(),
        ])

        const hasMore = offset + limit < totalCount

        // Transform the data to include businessName
        const transformedOrders = orders.map((order: any) => ({
            ...order,
            businessName: order.business?.name || 'N/A',
        }))

        return NextResponse.json({
            message: 'Orders fetched successfully',
            orders: transformedOrders as Order[],
            pagination: {
                limit,
                offset,
                totalCount,
                hasMore,
            },
            success: true,
        })
    } catch (error: any) {
        console.error('Fetch orders error:', error)

        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}
