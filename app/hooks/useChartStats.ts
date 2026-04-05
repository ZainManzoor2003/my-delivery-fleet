import { useQuery } from '@tanstack/react-query'
import { getUserTimezoneOffset } from '@/lib/timezone'

export interface ChartStatsResponse {
    success: boolean
    ordersRevenue: Array<{ date: string; orders: number; revenue: number }>
    deliveryTimeTrend: Array<{ date: string; avgMinutes: number }>
    orderVolume: Array<{ date: string; orders: number }>
    partnerPerformance: Array<{ date: string; uber: number; doordash: number; other: number }>
}

export function useChartStats(businessId: string | null) {
    return useQuery({
        queryKey: ['chartStats', businessId],
        queryFn: async () => {
            const tzOffset = getUserTimezoneOffset()
            const response = await fetch(`/api/stats/${businessId}/charts?tzOffset=${tzOffset}`)
            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to fetch chart stats')
            }
            return response.json() as Promise<ChartStatsResponse>
        },
        enabled: !!businessId,
    })
}
