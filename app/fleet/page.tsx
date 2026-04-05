'use client'
import { Button } from '@/components/ui/button'
import { ChevronDown, Plus, MoreHorizontal, ArrowUp, Minus, ChevronRight } from 'lucide-react'
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from 'react'
import AllStats from './components/allStats'
import OrdersTable from './components/ordersTable'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useRouter } from 'next/navigation'
import { useUserStore } from '../stores/userStore'
import { Role } from '@/lib/enums/role'
import { useStats } from '../hooks/useStats'
import TicketStatusBadge from './components/ticketStatusBadge'
import { BusinessStatus } from '@/lib/types/business'

const DEFAULT_METRICS = ['Total Orders', 'Total Sales', 'Completed Deliveries', 'Average Delivery Time']

export default function Page() {
    const { role, businessId } = useUserStore()
    const [openSection, setOpenSection] = useState<string | null>('sales')
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(DEFAULT_METRICS)
    const { data: statsData, isLoading: statsLoading } = useStats(businessId!)

    const toggleSection = (section: string | null) => {
        setOpenSection(openSection === section ? null : section)
    }

    const selectMetric = (cardIndex: number, metric: string) => {
        setSelectedMetrics(prev => {
            const next = [...prev]
            next[cardIndex] = metric
            return next
        })
    }

    const RadioItem = ({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) => (
        <DropdownMenuItem
            onClick={onClick}
            className={`h-10 flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-[#f1f5f9] text-text-1' : 'text-text-2'}`}
        >
            <div className="h-4 w-4 rounded-full border-2 flex items-center justify-center border-border">
                {isActive && <div className="h-2.5 w-2.5 rounded-full bg-[#3b82f6]" />}
            </div>
            <span className="font-normal">{label}</span>
        </DropdownMenuItem>
    )

    const getStatData = (metric: string) => {
        if (!statsData?.stats) return { value: '-', trend: '', positive: true, suffix: '' }
        const s = statsData.stats
        switch (metric) {
            case 'Total Orders':
                return { value: s.todayOrders.value.toString(), trend: `${Math.abs(s.todayOrders.trend)}%`, positive: s.todayOrders.positive, suffix: '' }
            case 'Total Sales':
                return { value: `$${s.totalSales.value.toFixed(2)}`, trend: `${Math.abs(s.totalSales.trend)}%`, positive: s.totalSales.positive, suffix: '' }
            case 'Average Order Value':
                return { value: `$${s.avgOrderValue.value.toFixed(2)}`, trend: `${Math.abs(s.avgOrderValue.trend)}%`, positive: s.avgOrderValue.positive, suffix: '' }
            case 'Orders per Hour':
                return { value: s.ordersPerHour.value.toFixed(1), trend: `${Math.abs(s.ordersPerHour.trend)}%`, positive: s.ordersPerHour.positive, suffix: '/hr' }
            case 'Cancelled Orders':
                return { value: s.canceledOrders.value.toString(), trend: `${Math.abs(s.canceledOrders.trend)}%`, positive: s.canceledOrders.positive, suffix: '' }
            case 'Completed Deliveries':
                return { value: s.deliveredOrders.value.toString(), trend: `${Math.abs(s.deliveredOrders.trend)}%`, positive: s.deliveredOrders.positive, suffix: '' }
            case 'Average Delivery Time':
                return { value: s.avgDeliveryTime.value.toString(), trend: `${Math.abs(s.avgDeliveryTime.trend)}%`, positive: s.avgDeliveryTime.positive, suffix: ' min' }
            case 'On-Time Delivery %':
                return { value: s.onTimePercent.value.toString(), trend: `${Math.abs(s.onTimePercent.trend)}%`, positive: s.onTimePercent.positive, suffix: '%' }
            case 'Failed Deliveries':
                return { value: s.failedDeliveries.value.toString(), trend: `${Math.abs(s.failedDeliveries.trend)}%`, positive: s.failedDeliveries.positive, suffix: '' }
            case 'Repeat Customers':
                return { value: s.repeatCustomers.value.toString(), trend: '', positive: true, suffix: '' }
            case 'Support Tickets Open':
                return { value: s.openTickets.value.toString(), trend: '', positive: s.openTickets.positive, suffix: '' }
            case 'Refunds Issued':
                return { value: s.refundsIssued.value.toString(), trend: `${Math.abs(s.refundsIssued.trend)}%`, positive: s.refundsIssued.positive, suffix: '' }
            default:
                return { value: '-', trend: '', positive: true, suffix: '' }
        }
    }

    const router = useRouter()

    if (role === Role.ADMIN) {
        return (
            <div className="h-full">
                <div className="flex items-center gap-2 px-4 py-5">
                    <SidebarTrigger className="xl:hidden" />
                </div>
                <div className="flex items-center justify-center h-full">
                    <h1>Admin Dashboard</h1>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex flex-wrap gap-2 items-center justify-between px-4 py-5">
                <div className="flex flex-wrap items-center gap-2">
                    <SidebarTrigger className="xl:hidden" />
                    <span className="font-medium text-md text-text-sidebar">Overview</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        className="gap-1 h-10 font-medium text-sm min-w-44"
                        onClick={() => router.push('fleet/orders/new?from=overview')}
                    >
                        <Plus />
                        Create Delivery
                    </Button>
                </div>
            </div>

            <div className="px-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 overflow-hidden divide-x divide-y md:divide-y-0">
                {selectedMetrics.map((metric, index) => {
                    const statData = getStatData(metric)
                    const takenByOthers = new Set(selectedMetrics.filter((_, i) => i !== index))
                    const available = (items: string[]) => items.filter(item => !takenByOthers.has(item))
                    return (
                        <Card key={index} className="rounded-[20px] border border-border shadow-none gap-2">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-sm font-medium text-text-1">{metric}</CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <MoreHorizontal className="text-text-1 h-6 w-6 cursor-pointer hover:opacity-70 transition-opacity" />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-58 p-2" align="end">
                                        <div
                                            onClick={() => toggleSection('sales')}
                                            className="flex items-center justify-between px-2 py-2 text-sm font-medium text-text-1 cursor-pointer hover:bg-slate-50 rounded-lg"
                                        >
                                            Sales & Orders
                                            {openSection === 'sales' ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-text-1" />
                                            )}
                                        </div>
                                        {openSection === 'sales' && (
                                            <DropdownMenuGroup className="space-y-0 ml-0">
                                                {available(['Total Orders', 'Total Sales', 'Average Order Value', 'Orders per Hour', 'Cancelled Orders']).map(item => (
                                                    <RadioItem key={item} label={item} isActive={metric === item} onClick={() => selectMetric(index, item)} />
                                                ))}
                                            </DropdownMenuGroup>
                                        )}
                                        <div
                                            onClick={() => toggleSection('delivery')}
                                            className="flex items-center justify-between px-2 py-2 text-sm font-medium text-text-1 cursor-pointer hover:bg-slate-50 rounded-lg"
                                        >
                                            Delivery Performance
                                            {openSection === 'delivery' ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-text-1" />
                                            )}
                                        </div>
                                        {openSection === 'delivery' && (
                                            <DropdownMenuGroup className="space-y-0 ml-0">
                                                {available(['Completed Deliveries', 'Average Delivery Time', 'On-Time Delivery %', 'Failed Deliveries']).map(item => (
                                                    <RadioItem key={item} label={item} isActive={metric === item} onClick={() => selectMetric(index, item)} />
                                                ))}
                                            </DropdownMenuGroup>
                                        )}
                                        <div
                                            onClick={() => toggleSection('customer')}
                                            className="flex items-center justify-between px-2 py-2 text-sm font-medium text-text-1 cursor-pointer hover:bg-slate-50 rounded-lg"
                                        >
                                            Customer & Operations
                                            {openSection === 'customer' ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-text-1" />
                                            )}
                                        </div>
                                        {openSection === 'customer' && (
                                            <DropdownMenuGroup className="space-y-0 ml-0">
                                                {available(['Repeat Customers', 'Support Tickets Open', 'Refunds Issued']).map(item => (
                                                    <RadioItem key={item} label={item} isActive={metric === item} onClick={() => selectMetric(index, item)} />
                                                ))}
                                            </DropdownMenuGroup>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>

                            <CardContent>
                                <div className="text-[2rem] font-medium text-text-1">
                                    {statsLoading ? (
                                        <div className="h-9 w-16 bg-muted animate-pulse rounded-md" />
                                    ) : (
                                        <>
                                            {statData.value}
                                            {statData.suffix && statData.value !== '-' && (
                                                <span className="text-lg font-normal text-text-2 ml-1">{statData.suffix}</span>
                                            )}
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 mt-2">
                                    {statsLoading ? (
                                        <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
                                    ) : statData.trend ? (
                                        <>
                                            <span className={`flex items-center text-sm font-semibold text-[#3FC060]`}>
                                                {statData.positive ? (
                                                    <ArrowUp className="mr-0.5 h-4 w-4" />
                                                ) : (
                                                    <Minus className="mr-0.5 h-4 w-4" />
                                                )}
                                                {statData.positive ? statData.trend : ''}
                                            </span>
                                            <span className="text-sm font-normal text-text-2">vs last week</span>
                                        </>
                                    ) : null}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
            {statsData?.businessStatus === BusinessStatus.SUSPENDED &&
                <div className='px-4 pt-4'>
                    <Alert className=" bg-[#F4C542]/10 border-[#F4C542] rounded-[20px] p-4">
                        <AlertTitle className="font-medium text-sm text-text-1">Please Note</AlertTitle>
                        <AlertDescription className="font-normal  text-sm text-text-1">
                            Your account is suspended due to the payment failure. Please update payment method and retry billing the invoice.
                        </AlertDescription>
                    </Alert>
                </div>
            }
            <div className="px-4 pt-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <AllStats />
                    <Card className="flex-1 min-w-0 px-0 border-border shadow-none rounded-[20px]">
                        <CardContent className="px-0">
                            <CardTitle className="text-xl px-6 text-text-1 font-medium">Support & Alerts</CardTitle>
                            <Tabs defaultValue="tickets" className="w-full mt-4 py-0 gap-0">
                                <TabsList className="bg-transparent px-6 rounded-none w-inherit justify-start h-auto py-0">
                                    <TabsTrigger
                                        value="tickets"
                                        className="rounded-none px-1 py-2 text-sm text-text-2 font-medium data-[state=active]:text-text-1 data-[state=active]:border-b-2 data-[state=active]:border-b-primary"
                                    >
                                        Open Support Tickets
                                    </TabsTrigger>
                                </TabsList>
                                <TabsContent value="tickets" className="space-y-6 pt-4 border-t border-border">
                                    {statsLoading ? (
                                        Array(3)
                                            .fill(0)
                                            .map((_, idx) => (
                                                <div key={idx} className="px-6 py-4 space-y-2 border-b border-border animate-pulse">
                                                    <div className="h-4 w-24 bg-muted rounded-md"></div>
                                                    <div className="h-4 w-32 bg-muted rounded-md"></div>
                                                    <div className="h-5 w-full bg-muted rounded-md mt-1"></div>
                                                </div>
                                            ))
                                    ) : (statsData?.tickets?.length ?? 0) > 0 ? (
                                        statsData?.tickets.map((ticket: any) => (
                                            <div key={ticket.id} className="space-y-6 hover:bg-slate-50/50" onClick={() => router.push(`/fleet/support/${ticket.id}`)}>
                                                <div className="px-6 space-y-2 group cursor-pointer">
                                                    <div className="flex flex-wrap items-center justify-between">
                                                        <p className="text-sm text-text-2 font-normal uppercase">
                                                            SUP-{ticket.ticketNumber}
                                                        </p>
                                                        <TicketStatusBadge ticket={ticket} />
                                                    </div>
                                                    <h4 className="text-sm font-normal text-text-1">
                                                        {ticket.business.user.firstName} {ticket.business.user.lastName}
                                                    </h4>
                                                    <h4 className="text-md font-medium text-text-1">{ticket.subject}</h4>
                                                </div>
                                                <hr className="border-border" />
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-text-2 text-center font-medium text-sm">
                                            No tickets found
                                        </p>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                        <CardFooter className="justify-center mt-auto">
                            <button className="text-primary text-sm font-medium hover:underline cursor-pointer"
                                onClick={() => router.push('/fleet/support')}>
                                View All Support Tickets
                            </button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
            <OrdersTable />
        </div>
    )
}