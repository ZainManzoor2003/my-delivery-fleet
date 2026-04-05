import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params

        if (!id) {
            return NextResponse.json({ message: 'Business ID is required' }, { status: 400 })
        }

        // Timezone-aware date setup using client's UTC offset (minutes, positive = behind UTC)
        const tzOffsetParam = req.nextUrl.searchParams.get('tzOffset')
        const tzOffset = tzOffsetParam !== null ? parseInt(tzOffsetParam) : 0

        const now = new Date()
        // Shift now back by tzOffset to get the client's local time expressed in UTC components
        const localNow = new Date(now.getTime() - tzOffset * 60 * 1000)
        // Local midnight as a UTC timestamp (e.g. March 11 00:00 local → stored as March 11 00:00 UTC internally)
        const localMidnightUTC = new Date(Date.UTC(
            localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate()
        ))
        // Actual UTC instant when local day starts/ends
        const startOfToday = new Date(localMidnightUTC.getTime() + tzOffset * 60 * 1000)
        const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1)

        // Last 7 days including today — dayLabels[i] = UTC instant of local midnight for that day
        const dayLabels = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(localMidnightUTC)
            d.setUTCDate(d.getUTCDate() - 6 + i)
            return new Date(d.getTime() + tzOffset * 60 * 1000)
        })

        const startOf7Days = dayLabels[0]

        // dayKey converts a UTC timestamp to a string key based on local date
        const dayKey = (d: Date) => {
            const local = new Date(d.getTime() - tzOffset * 60 * 1000)
            return `${local.getUTCFullYear()}-${local.getUTCMonth()}-${local.getUTCDate()}`
        }
        // Format a dayLabel UTC instant to a display string using local date
        const fmtDay = (d: Date) => {
            const local = new Date(d.getTime() - tzOffset * 60 * 1000)
            return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()))
                .toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
        }

        const [ordersRevenueRaw, deliveryTimeRaw, orderVolumeRaw, partnerRaw] = await Promise.all([
            // Tab 1: Orders & Revenue (last 7 days)
            prisma.order.findMany({
                where: { businessId: id, createdAt: { gte: startOf7Days, lte: endOfToday } },
                select: { createdAt: true, customerSubTotal: true },
            }),
            // Tab 2: Delivery Time Trend (last 7 days)
            prisma.order.findMany({
                where: {
                    businessId: id,
                    status: 'delivered',
                    deliveredAt: { gte: startOf7Days, lte: endOfToday },
                    deliveryStartTime: { not: null },
                },
                select: { deliveredAt: true, deliveryStartTime: true },
            }),
            // Tab 3: Order Volume (last 7 days)
            prisma.order.findMany({
                where: { businessId: id, createdAt: { gte: startOf7Days, lte: endOfToday } },
                select: { createdAt: true },
            }),
            // Tab 4: Partner Performance (last 7 days, delivered orders by provider)
            prisma.order.findMany({
                where: {
                    businessId: id,
                    status: 'delivered',
                    deliveredAt: { gte: startOf7Days, lte: endOfToday },
                },
                select: { deliveredAt: true, provider: true },
            }),
        ])

        // --- Tab 1: Orders & Revenue ---
        const ordersRevenueMap = new Map<string, { orders: number; revenue: number }>()
        dayLabels.forEach(d => ordersRevenueMap.set(dayKey(d), { orders: 0, revenue: 0 }))
        ordersRevenueRaw.forEach(o => {
            const key = dayKey(o.createdAt)
            const entry = ordersRevenueMap.get(key)
            if (entry) {
                entry.orders++
                entry.revenue += Number(o.customerSubTotal ?? 0)
            }
        })
        const ordersRevenue = dayLabels.map(d => {
            const entry = ordersRevenueMap.get(dayKey(d))!
            return {
                date: fmtDay(d),
                orders: entry.orders,
                revenue: Math.round(entry.revenue * 100) / 100,
            }
        })

        // --- Tab 2: Delivery Time Trend ---
        const deliveryTimeMap = new Map<string, { totalMs: number; count: number }>()
        dayLabels.forEach(d => deliveryTimeMap.set(dayKey(d), { totalMs: 0, count: 0 }))
        deliveryTimeRaw.forEach(o => {
            if (!o.deliveredAt || !o.deliveryStartTime) return
            const key = dayKey(o.deliveredAt)
            const entry = deliveryTimeMap.get(key)
            if (entry) {
                entry.totalMs += o.deliveredAt.getTime() - o.deliveryStartTime.getTime()
                entry.count++
            }
        })
        const deliveryTimeTrend = dayLabels.map(d => {
            const entry = deliveryTimeMap.get(dayKey(d))!
            return {
                date: fmtDay(d),
                avgMinutes: entry.count > 0 ? Math.round(entry.totalMs / entry.count / 60000) : 0,
            }
        })

        // --- Tab 3: Order Volume (last 7 days, by day) ---
        const orderVolumeMap = new Map<string, number>()
        dayLabels.forEach(d => orderVolumeMap.set(dayKey(d), 0))
        orderVolumeRaw.forEach(o => {
            const key = dayKey(o.createdAt)
            const current = orderVolumeMap.get(key)
            if (current !== undefined) orderVolumeMap.set(key, current + 1)
        })
        const orderVolume = dayLabels.map(d => ({
            date: fmtDay(d),
            orders: orderVolumeMap.get(dayKey(d)) ?? 0,
        }))

        // --- Tab 4: Partner Performance ---
        const partnerMap = new Map<string, { uber: number; doordash: number; other: number }>()
        dayLabels.forEach(d => partnerMap.set(dayKey(d), { uber: 0, doordash: 0, other: 0 }))
        partnerRaw.forEach(o => {
            if (!o.deliveredAt) return
            const key = dayKey(o.deliveredAt)
            const entry = partnerMap.get(key)
            if (!entry) return
            if (o.provider === 'uber') entry.uber++
            else if (o.provider === 'doordash') entry.doordash++
            else entry.other++
        })
        const partnerPerformance = dayLabels.map(d => {
            const entry = partnerMap.get(dayKey(d))!
            return {
                date: fmtDay(d),
                uber: entry.uber,
                doordash: entry.doordash,
                other: entry.other,
            }
        })

        return NextResponse.json({
            success: true,
            ordersRevenue,
            deliveryTimeTrend,
            orderVolume,
            partnerPerformance,
        })
    } catch (error) {
        console.error('Chart stats error:', error)
        return NextResponse.json({ error: 'Failed to fetch chart stats' }, { status: 500 })
    }
}
