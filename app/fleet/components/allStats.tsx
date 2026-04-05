'use client'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import {
    Card,
    CardContent,
    CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useChartStats } from "@/app/hooks/useChartStats"
import { useUserStore } from "@/app/stores/userStore"

const tabTriggerClass = "rounded-none px-1 py-2 text-sm text-text-2 font-medium data-[state=active]:text-text-1 data-[state=active]:border-b-2 data-[state=active]:border-b-primary"

function ChartSkeleton() {
    return <div className="h-96 w-full bg-muted animate-pulse rounded-lg" />
}

function EmptyChart({ message }: { message: string }) {
    return (
        <div className="h-96 w-full flex items-center justify-center text-text-2 text-sm">
            {message}
        </div>
    )
}

export default function AllStats() {
    const { businessId } = useUserStore()
    const { data, isLoading } = useChartStats(businessId!)

    const ordersRevenueConfig = {
        orders: { label: 'Orders', color: '#b3e5fc' },
        revenue: { label: 'Revenue ($)', color: '#0088ff' },
    } satisfies ChartConfig

    const deliveryTimeConfig = {
        avgMinutes: { label: 'Avg Delivery Time (min)', color: '#0088ff' },
    } satisfies ChartConfig

    const orderVolumeConfig = {
        orders: { label: 'Orders', color: '#0088ff' },
    } satisfies ChartConfig

    const partnerConfig = {
        uber: { label: 'Uber', color: '#000000' },
        doordash: { label: 'DoorDash', color: '#ff3008' },
        other: { label: 'Other', color: '#94a3b8' },
    } satisfies ChartConfig

    const hasPartnerOther = data?.partnerPerformance.some(d => d.other > 0)

    return (
        <Card className="min-w-0 flex-2 border-border rounded-[20px] shadow-none py-6">
            <CardContent className="px-0">
                <CardTitle className="text-xl text-text-1 font-medium px-6">Analytics</CardTitle>
                <Tabs defaultValue="orders" className="w-full mt-4 gap-0">
                    <TabsList className="bg-transparent rounded-none w-inherit justify-start h-auto py-0 px-6 gap-4">
                        <TabsTrigger value="orders" className={tabTriggerClass}>
                            Orders & Revenue
                        </TabsTrigger>
                        <TabsTrigger value="delivery" className={tabTriggerClass}>
                            Delivery Time
                        </TabsTrigger>
                        <TabsTrigger value="volume" className={tabTriggerClass}>
                            Order Volume
                        </TabsTrigger>
                        <TabsTrigger value="partner" className={tabTriggerClass}>
                            Partner Performance
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1 — Orders & Revenue */}
                    <TabsContent value="orders" className="w-full border-t border-border mt-0 pt-5 px-0">
                        <div className="w-full border-border">
                            {isLoading ? (
                                <div className="px-6 pb-6"><ChartSkeleton /></div>
                            ) : !data?.ordersRevenue.length ? (
                                <EmptyChart message="No order data available" />
                            ) : (
                                <ChartContainer config={ordersRevenueConfig} className="h-96 w-full pl-0 pr-10 pt-5 pb-0">
                                    <AreaChart data={data.ordersRevenue} accessibilityLayer>
                                        <defs>
                                            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0088ff" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#0088ff" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#b3e5fc" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#b3e5fc" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="date" axisLine={{ stroke: '#E5E7EB' }} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickMargin={8} tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <ChartTooltip cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} content={<ChartTooltipContent indicator="dot" hideLabel className="text-text-2 text-sm border-border min-w-50" />} />
                                        <ChartLegend content={<ChartLegendContent className="text-sm text-text-2" />} verticalAlign="top" />
                                        <Area dataKey="revenue" type="monotone" stroke="#0088ff" strokeWidth={2} fill="url(#gradRevenue)" dot={false} activeDot={{ r: 6 }} />
                                        <Area dataKey="orders" type="monotone" stroke="#b3e5fc" strokeWidth={2} fill="url(#gradOrders)" dot={false} activeDot={{ r: 6 }} />
                                    </AreaChart>
                                </ChartContainer>
                            )}
                        </div>
                    </TabsContent>

                    {/* Tab 2 — Delivery Time Trend */}
                    <TabsContent value="delivery" className="w-full border-t border-border mt-0 pt-5 px-0">
                        <div className="w-full border-border">
                            {isLoading ? (
                                <div className="px-6 pb-6"><ChartSkeleton /></div>
                            ) : !data?.deliveryTimeTrend.some(d => d.avgMinutes > 0) ? (
                                <EmptyChart message="No delivery time data available" />
                            ) : (
                                <ChartContainer config={deliveryTimeConfig} className="h-96 w-full pl-0 pr-10 pt-5 pb-0">
                                    <AreaChart data={data.deliveryTimeTrend} accessibilityLayer>
                                        <defs>
                                            <linearGradient id="gradDelivery" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0088ff" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#0088ff" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="date" axisLine={{ stroke: '#E5E7EB' }} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickMargin={8} tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} unit=" min" />
                                        <ChartTooltip cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} content={<ChartTooltipContent indicator="dot" hideLabel className="text-text-2 text-sm border-border min-w-70" />} />
                                        <ChartLegend content={<ChartLegendContent className="text-sm text-text-2" />} verticalAlign="top" />
                                        <Area dataKey="avgMinutes" type="monotone" stroke="#0088ff" strokeWidth={2} fill="url(#gradDelivery)" dot={false} activeDot={{ r: 6 }} />
                                    </AreaChart>
                                </ChartContainer>
                            )}
                        </div>
                    </TabsContent>

                    {/* Tab 3 — Order Volume (last 7 days, by day) */}
                    <TabsContent value="volume" className="w-full border-t border-border mt-0 pt-5 px-0">
                        <div className="w-full border-border">
                            {isLoading ? (
                                <div className="px-6 pb-6"><ChartSkeleton /></div>
                            ) : !data?.orderVolume.some(d => d.orders > 0) ? (
                                <EmptyChart message="No order volume data available" />
                            ) : (
                                <ChartContainer config={orderVolumeConfig} className="h-96 w-full pl-0 pr-10 pt-5 pb-0">
                                    <AreaChart data={data.orderVolume} accessibilityLayer>
                                        <defs>
                                            <linearGradient id="orderVolumeGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0088ff" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#0088ff" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="date" axisLine={{ stroke: '#E5E7EB' }} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickMargin={8} tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                                        <ChartTooltip cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} content={<ChartTooltipContent indicator="dot" hideLabel className="text-text-2 text-sm border-border min-w-[160px]" />} />
                                        <ChartLegend content={<ChartLegendContent className="text-sm text-text-2" />} verticalAlign="top" />
                                        <Area dataKey="orders" stroke="#0088ff" strokeWidth={2} fill="url(#orderVolumeGradient)" dot={false} activeDot={{ r: 6 }} type="monotone" />
                                    </AreaChart>
                                </ChartContainer>
                            )}
                        </div>
                    </TabsContent>

                    {/* Tab 4 — Partner Performance */}
                    <TabsContent value="partner" className="w-full border-t border-border mt-0 pt-5 px-0">
                        <div className="w-full border-border">
                            {isLoading ? (
                                <div className="px-6 pb-6"><ChartSkeleton /></div>
                            ) : !data?.partnerPerformance.some(d => d.uber > 0 || d.doordash > 0 || d.other > 0) ? (
                                <EmptyChart message="No delivery partner data available" />
                            ) : (
                                <ChartContainer config={partnerConfig} className="h-96 w-full pl-0 pr-10 pt-5 pb-0">
                                    <AreaChart data={data.partnerPerformance} accessibilityLayer>
                                        <defs>
                                            <linearGradient id="gradUber" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#000000" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gradDoordash" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ff3008" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#ff3008" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gradOther" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="date" axisLine={{ stroke: '#E5E7EB' }} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickMargin={8} tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                                        <ChartTooltip cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} content={<ChartTooltipContent indicator="dot" hideLabel className="text-text-2 text-sm border-border min-w-[160px]" />} />
                                        <ChartLegend content={<ChartLegendContent className="text-sm text-text-2" />} verticalAlign="top" />
                                        <Area dataKey="uber" type="monotone" stroke="#000000" strokeWidth={2} fill="url(#gradUber)" dot={false} activeDot={{ r: 6 }} />
                                        <Area dataKey="doordash" type="monotone" stroke="#ff3008" strokeWidth={2} fill="url(#gradDoordash)" dot={false} activeDot={{ r: 6 }} />
                                        {hasPartnerOther && (
                                            <Area dataKey="other" type="monotone" stroke="#94a3b8" strokeWidth={2} fill="url(#gradOther)" dot={false} activeDot={{ r: 6 }} />
                                        )}
                                    </AreaChart>
                                </ChartContainer>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
