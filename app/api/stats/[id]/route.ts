import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { OrderStatus } from '@/lib/types/order';
import { TicketStatus } from '@/lib/enums/ticketStatus';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json(
                { message: "Business ID is required" },
                { status: 400 }
            );
        }

        // Timezone-aware date setup using client's UTC offset (minutes, positive = behind UTC)
        const tzOffsetParam = req.nextUrl.searchParams.get('tzOffset')
        const tzOffset = tzOffsetParam !== null ? parseInt(tzOffsetParam) : 0

        const now = new Date()
        // Shift now back by tzOffset to get the client's local time expressed in UTC components
        const localNow = new Date(now.getTime() - tzOffset * 60 * 1000)
        const localMidnightUTC = new Date(Date.UTC(
            localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate()
        ))
        // Actual UTC instants for start/end of local today
        const startOfToday = new Date(localMidnightUTC.getTime() + tzOffset * 60 * 1000)
        const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1)

        // Prev 7 days: 7 local days ago → end of local yesterday
        const startOfPrev7Days = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000)
        const endOfPrev7Days = new Date(startOfToday.getTime() - 1)

        const business = await prisma.business.findFirst({
            where: {
                id: id
            },
            select: {
                status: true
            }
        })

        // --- Today's Orders vs prev 7 days total ---
        const [todayOrders, prev7DaysOrders] = await Promise.all([
            prisma.order.count({
                where: {
                    businessId: id,
                    createdAt: { gte: startOfToday, lte: endOfToday },
                },
            }),
            prisma.order.count({
                where: {
                    businessId: id,
                    createdAt: { gte: startOfPrev7Days, lte: endOfPrev7Days },
                },
            }),
        ])

        // --- Total Sales & Average Order Value (customerSubTotal) ---
        const [todaySubTotalAgg, prev7DaysSubTotalAgg] = await Promise.all([
            prisma.order.aggregate({
                where: {
                    businessId: id,
                    createdAt: { gte: startOfToday, lte: endOfToday },
                },
                _sum: { customerSubTotal: true },
                _avg: { customerSubTotal: true },
            }),
            prisma.order.aggregate({
                where: {
                    businessId: id,
                    createdAt: { gte: startOfPrev7Days, lte: endOfPrev7Days },
                },
                _sum: { customerSubTotal: true },
                _avg: { customerSubTotal: true },
            }),
        ])
        const totalSales = Math.round(Number(todaySubTotalAgg._sum.customerSubTotal ?? 0) * 100) / 100
        const prev7DaysTotalSales = Math.round(Number(prev7DaysSubTotalAgg._sum.customerSubTotal ?? 0) * 100) / 100
        const avgOrderValue = Math.round(Number(todaySubTotalAgg._avg.customerSubTotal ?? 0) * 100) / 100
        const prev7DaysAvgOrderValue = Math.round(Number(prev7DaysSubTotalAgg._avg.customerSubTotal ?? 0) * 100) / 100

        // --- Delivered Orders ---
        const [deliveredOrders, prev7DaysDeliveredOrders] = await Promise.all([
            prisma.order.count({
                where: {
                    businessId: id,
                    status: OrderStatus.Delivered,
                    deliveredAt: { gte: startOfToday, lte: endOfToday },
                },
            }),
            prisma.order.count({
                where: {
                    businessId: id,
                    status: OrderStatus.Delivered,
                    deliveredAt: { gte: startOfPrev7Days, lte: endOfPrev7Days },
                },
            }),
        ])

        // --- Average Delivery Time (in minutes) ---
        const [todayDelivered, prev7DaysDelivered] = await Promise.all([
            prisma.order.findMany({
                where: {
                    businessId: id,
                    status: OrderStatus.Delivered,
                    deliveredAt: { gte: startOfToday, lte: endOfToday },
                    deliveryStartTime: { not: null },
                },
                select: { deliveredAt: true, deliveryStartTime: true },
            }),
            prisma.order.findMany({
                where: {
                    businessId: id,
                    status: OrderStatus.Delivered,
                    deliveredAt: { gte: startOfPrev7Days, lte: endOfPrev7Days },
                    deliveryStartTime: { not: null },
                },
                select: { deliveredAt: true, deliveryStartTime: true },
            }),
        ])

        // --- Additional Metrics ---
        const [
            canceledOrders,
            prev7DaysCanceledOrders,
            failedDeliveries,
            prev7DaysFailedDeliveries,
            todayOnTimeOrders,
            prev7DaysOnTimeOrders,
            repeatCustomersGroups,
            openTicketsCount,
            todayRefunds,
            prev7DaysRefunds,
        ] = await Promise.all([
            prisma.order.count({
                where: { businessId: id, status: OrderStatus.Canceled, createdAt: { gte: startOfToday, lte: endOfToday } },
            }),
            prisma.order.count({
                where: { businessId: id, status: OrderStatus.Canceled, createdAt: { gte: startOfPrev7Days, lte: endOfPrev7Days } },
            }),
            prisma.order.count({
                where: { businessId: id, status: OrderStatus.Returned, createdAt: { gte: startOfToday, lte: endOfToday } },
            }),
            prisma.order.count({
                where: { businessId: id, status: OrderStatus.Returned, createdAt: { gte: startOfPrev7Days, lte: endOfPrev7Days } },
            }),
            prisma.order.findMany({
                where: { businessId: id, status: OrderStatus.Delivered, deliveredAt: { gte: startOfToday, lte: endOfToday }, estimatedDeliveryTime: { not: null } },
                select: { deliveredAt: true, estimatedDeliveryTime: true },
            }),
            prisma.order.findMany({
                where: { businessId: id, status: OrderStatus.Delivered, deliveredAt: { gte: startOfPrev7Days, lte: endOfPrev7Days }, estimatedDeliveryTime: { not: null } },
                select: { deliveredAt: true, estimatedDeliveryTime: true },
            }),
            prisma.order.groupBy({
                by: ['customerPhone'],
                where: { businessId: id },
                having: { customerPhone: { _count: { gt: 1 } } },
                _count: { customerPhone: true },
            }),
            prisma.ticket.count({
                where: { businessId: id, status: TicketStatus.OPEN },
            }),
            prisma.refund.count({
                where: { order: { businessId: id }, createdAt: { gte: startOfToday, lte: endOfToday } },
            }),
            prisma.refund.count({
                where: { order: { businessId: id }, createdAt: { gte: startOfPrev7Days, lte: endOfPrev7Days } },
            }),
        ])

        // --- Tickets ---
        const tickets = await prisma.ticket.findMany({
            where: {
                businessId: id,
            },
            take: 3,
            select: {
                id: true,
                ticketNumber: true,
                subject: true,
                status: true,
                business: {
                    select: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        // --- Helpers ---
        const calcAvgMinutes = (orders: { deliveredAt: Date | null; deliveryStartTime: Date | null }[]) => {
            const valid = orders.filter(o => o.deliveredAt && o.deliveryStartTime)
            if (!valid.length) return 0
            const totalMs = valid.reduce((sum, o) => {
                return sum + (o.deliveredAt!.getTime() - o.deliveryStartTime!.getTime())
            }, 0)
            return Math.round(totalMs / valid.length / 60000)
        }

        const calcTrend = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0
            return Math.round(((current - previous) / previous) * 100)
        }

        // 0 vs 0 is not positive — it's neutral
        const calcPositive = (current: number, previous: number) => {
            if (current === 0 && previous === 0) return false
            return current >= previous
        }

        const calcOnTimePercent = (orders: { deliveredAt: Date | null; estimatedDeliveryTime: Date | null }[]) => {
            if (!orders.length) return 0
            const onTime = orders.filter(o => o.deliveredAt && o.estimatedDeliveryTime && o.deliveredAt <= o.estimatedDeliveryTime)
            return Math.round((onTime.length / orders.length) * 100)
        }

        const avgDeliveryTime = calcAvgMinutes(todayDelivered)
        const prev7DaysAvgDeliveryTime = calcAvgMinutes(prev7DaysDelivered)

        const hoursElapsed = Math.max(1, (now.getTime() - startOfToday.getTime()) / (1000 * 60 * 60))
        const ordersPerHour = Math.round((todayOrders / hoursElapsed) * 10) / 10
        const prev7DaysOrdersPerHour = Math.round((prev7DaysOrders / (7 * 24)) * 10) / 10

        const onTimePercent = calcOnTimePercent(todayOnTimeOrders)
        const prev7DaysOnTimePercent = calcOnTimePercent(prev7DaysOnTimeOrders)
        const repeatCustomers = repeatCustomersGroups.length

        return NextResponse.json({
            success: true,
            tickets,
            businessStatus: business?.status,
            stats: {
                todayOrders: {
                    value: todayOrders,
                    trend: calcTrend(todayOrders, prev7DaysOrders),
                    positive: calcPositive(todayOrders, prev7DaysOrders),
                },
                totalSales: {
                    value: totalSales,
                    trend: calcTrend(totalSales, prev7DaysTotalSales),
                    positive: calcPositive(totalSales, prev7DaysTotalSales),
                },
                avgOrderValue: {
                    value: avgOrderValue,
                    trend: calcTrend(avgOrderValue, prev7DaysAvgOrderValue),
                    positive: calcPositive(avgOrderValue, prev7DaysAvgOrderValue),
                },
                deliveredOrders: {
                    value: deliveredOrders,
                    trend: calcTrend(deliveredOrders, prev7DaysDeliveredOrders),
                    positive: calcPositive(deliveredOrders, prev7DaysDeliveredOrders),
                },
                avgDeliveryTime: {
                    value: avgDeliveryTime,
                    trend: calcTrend(avgDeliveryTime, prev7DaysAvgDeliveryTime),
                    positive: (avgDeliveryTime === 0 && prev7DaysAvgDeliveryTime === 0)
                        ? false
                        : avgDeliveryTime !== 0 && avgDeliveryTime <= prev7DaysAvgDeliveryTime,
                },
                ordersPerHour: {
                    value: ordersPerHour,
                    trend: calcTrend(ordersPerHour, prev7DaysOrdersPerHour),
                    positive: calcPositive(ordersPerHour, prev7DaysOrdersPerHour),
                },
                canceledOrders: {
                    value: canceledOrders,
                    trend: calcTrend(canceledOrders, prev7DaysCanceledOrders),
                    positive: (canceledOrders === 0 && prev7DaysCanceledOrders === 0)
                        ? false
                        : canceledOrders <= prev7DaysCanceledOrders,
                },
                failedDeliveries: {
                    value: failedDeliveries,
                    trend: calcTrend(failedDeliveries, prev7DaysFailedDeliveries),
                    positive: (failedDeliveries === 0 && prev7DaysFailedDeliveries === 0)
                        ? false
                        : failedDeliveries <= prev7DaysFailedDeliveries,
                },
                onTimePercent: {
                    value: onTimePercent,
                    trend: calcTrend(onTimePercent, prev7DaysOnTimePercent),
                    positive: calcPositive(onTimePercent, prev7DaysOnTimePercent),
                },
                repeatCustomers: {
                    value: repeatCustomers,
                    trend: 0,
                    positive: true,
                },
                openTickets: {
                    value: openTicketsCount,
                    trend: 0,
                    positive: openTicketsCount === 0,
                },
                refundsIssued: {
                    value: todayRefunds,
                    trend: calcTrend(todayRefunds, prev7DaysRefunds),
                    positive: (todayRefunds === 0 && prev7DaysRefunds === 0)
                        ? false
                        : todayRefunds <= prev7DaysRefunds,
                },
            },
        })
    } catch (error) {
        console.error('Stats error:', error)
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
}