import { Ticket } from '@/lib/types/ticket'
import { useQuery } from '@tanstack/react-query'
import { getUserTimezoneOffset } from '@/lib/timezone'

interface StatItem {
    value: number
    trend: number
    positive: boolean
}

interface StatsResponse {
    success: boolean
    tickets: Ticket[]
    businessStatus: string,
    stats: {
        todayOrders: StatItem
        totalSales: StatItem
        avgOrderValue: StatItem
        ordersPerHour: StatItem
        canceledOrders: StatItem
        deliveredOrders: StatItem
        avgDeliveryTime: StatItem
        onTimePercent: StatItem
        failedDeliveries: StatItem
        repeatCustomers: StatItem
        openTickets: StatItem
        refundsIssued: StatItem
    }
}

export function useStats(businessId: string | null) {
    return useQuery({
        queryKey: ['stats', businessId],
        queryFn: async () => {
            const tzOffset = getUserTimezoneOffset()
            const response = await fetch(`/api/stats/${businessId}?tzOffset=${tzOffset}`)
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to fetch stats')
            }
            return response.json() as Promise<StatsResponse>
        },
        enabled: !!businessId,
    })
}