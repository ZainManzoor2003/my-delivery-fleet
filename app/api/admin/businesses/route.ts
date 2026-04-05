import prisma from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'
import { Business } from '@/lib/types/business'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = parseInt(searchParams.get('offset') || '0')

        const adminFilter = { user: { role: { not: 'admin' } } }

        const [businesses, totalCount] = await Promise.all([
            prisma.business.findMany({
                where: adminFilter,
                select: {
                    id: true,
                    name: true,
                    phone: true,
                    address: true,
                    routingPreference: true,
                    referralCode: true,
                    referredByCode: true,
                    type: true,
                    logo: true,
                    avgOrdersPerDay: true,
                    deliveryRadius: true,
                    userId: true,
                    status: true,
                    stripeCustomerId: true,
                    surchargeBaseQuote: true,
                    surchargeExtendedQuote: true,
                    surchargeCatering: true,
                    surchargeRetail: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: { select: { orders: true } },
                    orders: { select: { createdAt: true }, orderBy: { createdAt: 'asc' }, take: 1 },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: offset,
                take: limit,
            }),
            prisma.business.count({ where: adminFilter }),
        ])

        const msPerDay = 1000 * 60 * 60 * 24
        const businessesWithActual = businesses.map(({ _count, orders: bOrders, ...b }) => {
            const oldestOrder = bOrders[0]
            let actualAvgOrdersPerDay: number | null = null
            if (oldestOrder) {
                const daysSinceFirst = Math.max(1, Math.ceil((Date.now() - new Date(oldestOrder.createdAt).getTime()) / msPerDay))
                actualAvgOrdersPerDay = Math.max(1, Math.round(_count.orders / daysSinceFirst))
            }
            return { ...b, actualAvgOrdersPerDay }
        })

        const hasMore = offset + limit < totalCount

        return NextResponse.json({
            message: 'Businesses fetched successfully',
            businesses: businessesWithActual as Business[],
            pagination: {
                limit,
                offset,
                totalCount,
                hasMore,
            },
            success: true,
        })
    } catch (error: any) {
        console.error('Fetch businesses error:', error)

        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}
