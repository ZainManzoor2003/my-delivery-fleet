'use client'
import {
    CardFooter
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GenericTable, { ColumnDef } from "@/app/components/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Timer, Search, X, ChevronDown } from "lucide-react";
import OrderStatusBadge from "../../components/orderStatusBadge";
import { Loader } from "@/app/components/loader";
import { useMemo, useState } from "react";
import { OrderTab } from "@/lib/enums/orderTab";
import { Order, OrderStatus } from "@/lib/types/order";
import { useGetAdminOrders } from "@/app/hooks/useOrder";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatUTCLocal } from "@/lib/timezone";
import { startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { SearchableBusinessDropdown } from "../../components/searchable-business-dropdown";
import { useGetAllBusinessesForDropdown } from "@/app/hooks/useBusiness";

interface OrdersTableProps {
    dateRange?: DateRange;
}

export default function OrdersTable({ dateRange }: OrdersTableProps) {
    const router = useRouter();
    const [activeBusinessId, setActiveBusinessId] = useState<string | undefined>('');
    const [activeSort, setActiveSort] = useState<string>("");
    const [activeTab, setActiveTab] = useState<OrderTab>(OrderTab.ALL);
    const [search, setSearch] = useState<string>('');
    const { data: allBusinesses } = useGetAllBusinessesForDropdown()

    const limit = 10;
    const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useGetAdminOrders({ limit });

    const sortOptions = [
        "Newest first",
        "Oldest first",
        "ETA (Soonest first)",
        "ETA (Latest first)",
        "Subtotal (High to low)",
        "Subtotal (Low to high)",
    ];

    const date = dateRange;

    const allOrders = useMemo(() => {
        return data?.pages.flatMap(page => page.orders || []) || [];
    }, [data]);

    const orders = useMemo(() => {
        if (allOrders.length === 0) return [];

        const querySearch = search.trim().toLowerCase();
        let filteredOrders = [...allOrders];

        if (querySearch) {
            filteredOrders = filteredOrders.filter((o: Order) => {
                const orderNum = String(o.orderNumber ?? o.id ?? '').toLowerCase();
                const customer = (o.customerName ?? '').toLowerCase();
                return orderNum.includes(querySearch) || customer.includes(querySearch);
            });
        }

        if (activeBusinessId) {
            filteredOrders = filteredOrders.filter(
                (o) => o.businessId === activeBusinessId
            );
        }

        if (date && (date.from || date.to)) {
            const from = startOfDay(date.from!);
            const to = endOfDay(date.to!);
            if (from || to) {
                filteredOrders = filteredOrders.filter((o) => {
                    if (!o.createdAt) return false;
                    const t = new Date(o.createdAt).getTime();
                    return t >= (from?.getTime() ?? -Infinity) &&
                        t <= (to?.getTime() ?? Infinity);
                });
            }
        }

        return filteredOrders;

    }, [allOrders, search, date, activeBusinessId]);

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        let filtered = [...orders];

        if (activeTab !== OrderTab.ALL) {
            switch (activeTab) {
                case OrderTab.ACTIVE:
                    filtered = filtered.filter((o: Order) =>
                        o.status.startsWith(OrderStatus.Delivery) ||
                        o.status.startsWith(OrderStatus.PickUp)
                    );
                    break;
                case OrderTab.UNASSIGNED:
                    filtered = filtered.filter((o: Order) =>
                        o.status.startsWith(OrderStatus.Unassigned) ||
                        o.status.startsWith(OrderStatus.RequestingDriver)
                        || (o.status.startsWith(OrderStatus.Scheduled) && !o.providerDeliveryId)
                    );
                    break;
                case OrderTab.SCHEDULED:
                    filtered = filtered.filter((o: Order) =>
                        o.status.startsWith(OrderStatus.Scheduled)
                    );
                    break;
                case OrderTab.DELIVERED:
                    filtered = filtered.filter((o: Order) =>
                        o.status.startsWith(OrderStatus.Delivered)
                    );
                    break;
            }
        }
        switch (activeSort) {
            case "Newest first":
                filtered = filtered.sort(
                    (a: Order, b: Order) =>
                        new Date(b.createdAt ?? 0).getTime() -
                        new Date(a.createdAt ?? 0).getTime()
                );
                break;

            case "Oldest first":
                filtered = filtered.sort(
                    (a: Order, b: Order) =>
                        new Date(a.createdAt ?? 0).getTime() -
                        new Date(b.createdAt ?? 0).getTime()
                );
                break;

            case "Status (Active first)":
                filtered = filtered.sort((a: Order, b: Order) => {
                    const isActive = (status: OrderStatus) =>
                        status !== OrderStatus.Delivered;
                    return Number(isActive(b.status)) - Number(isActive(a.status));
                });
                break;

            case "ETA (Soonest first)":
                filtered = filtered.sort((a, b) => {
                    const aTime = a.estimatedDeliveryTime
                        ? new Date(a.estimatedDeliveryTime).getTime()
                        : Infinity;

                    const bTime = b.estimatedDeliveryTime
                        ? new Date(b.estimatedDeliveryTime).getTime()
                        : Infinity;

                    return aTime - bTime;
                });
                break;

            case "ETA (Latest first)":
                filtered = filtered.sort(
                    (a: Order, b: Order) =>
                        new Date(b.estimatedDeliveryTime ?? 0).getTime() -
                        new Date(a.estimatedDeliveryTime ?? 0).getTime()
                );
                break;

            case "Subtotal (High to low)":
                filtered = filtered.sort(
                    (a: Order, b: Order) =>
                        Number(b.customerSubTotal ?? 0) - Number(a.customerSubTotal ?? 0)
                );
                break;

            case "Subtotal (Low to high)":
                filtered = filtered.sort(
                    (a: Order, b: Order) =>
                        Number(a.customerSubTotal ?? 0) - Number(b.customerSubTotal ?? 0)
                );
                break;

            default:
                break;
        }

        return filtered;
    }, [orders, activeTab, activeSort]);

    const ordersCount = orders?.length || 0;
    const unassignedCount = orders?.filter((o: Order) => (o.status.startsWith(OrderStatus.Unassigned)) || (o.status.startsWith(OrderStatus.RequestingDriver)) || (o.status.startsWith(OrderStatus.Scheduled) && !o.providerDeliveryId)).length || 0;
    const activeCount = orders?.filter((o: Order) => (o.status.startsWith(OrderStatus.Delivery)) || (o.status.startsWith(OrderStatus.PickUp))).length || 0;
    const deliveredCount = orders?.filter((o: Order) => o.status === OrderStatus.Delivered).length || 0;
    const scheduledCount = orders?.filter((o: Order) => o.status === OrderStatus.Scheduled).length || 0;

    const orderColumns: ColumnDef<Order>[] = [
        {
            key: "businessName",
            label: "Business",
            width: "w-30 min-w-30",
            render: (value) => value && value.length > 25 ? value.slice(0, 25) + '...' : value
        },
        {
            key: 'orderNumber',
            label: 'Order Id',
            width: 'pl-0 w-24 min-w-24',
            render: (value) => `OD:${value}`
        },
        {
            key: 'createdAt',
            label: 'Created',
            width: 'w-40 min-w-40',
            render: (value) => formatUTCLocal(value, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })
        },
        {
            key: 'customerName',
            label: 'Customer Name',
            flex: true,
            render: (value) => value && value.length > 25 ? value.slice(0, 25) + '...' : value
        },
        {
            key: 'deliveryAddress.address',
            label: 'Delivery Address',
            flex: true,
            render: (value) => value && value.length > 30 ? value.slice(0, 30) + '...' : value
        },
        {
            key: 'status',
            label: 'Status',
            width: 'w-35 min-w-35',
            render: (value, row: Order) => <OrderStatusBadge order={row} />
        },
        {
            key: 'estimatedPickupTime',
            label: 'Est. Pickup',
            width: 'w-36 min-w-36',
            render: (value, order: Order) => (
                <div className="flex gap-1 text-sm text-text-1 font-normal">
                    <Timer className="h-4 w-4 text-icon" />
                    {order.status === OrderStatus.Delivery
                        ? 'Picked Up'
                        : order.status === OrderStatus.Delivered
                            ? 'Delivered'
                            : value
                                ? (() => {
                                    const diffMs = new Date(value).getTime() - Date.now()
                                    const absMs = Math.abs(diffMs)
                                    const past = diffMs < 0

                                    const totalMinutes = Math.floor(absMs / 60000)
                                    const totalHours = Math.floor(absMs / 3600000)
                                    const totalDays = Math.floor(absMs / 86400000)

                                    const minutes = totalMinutes % 60
                                    const hours = totalHours % 24
                                    const days = totalDays

                                    let label = ''

                                    if (days > 0) {
                                        label = `${days} d ${hours} h`
                                    } else if (hours > 0) {
                                        label = `${hours} h ${minutes} min`
                                    } else {
                                        label = `${minutes} min`
                                    }

                                    return past ? `-` : `${label}`
                                })()
                                : '-'}
                </div>
            )
        },
        {
            key: 'estimatedDeliveryTime',
            label: 'Est. Delivery',
            width: 'w-36 min-w-36',
            render: (value, order: Order) => (
                <div className="flex gap-1 text-sm text-text-1 font-normal">
                    <Timer className="h-4 w-4 text-icon" />
                    {order.status !== OrderStatus.Delivered
                        ? value
                            ? (() => {
                                const diffMs = Date.now() - new Date(value).getTime()
                                const mins = Math.floor(Math.abs(diffMs) / 60000)

                                return diffMs >= 0
                                    ? `${mins} min ago`
                                    : `${mins} min`
                            })()
                            : '-'
                        : 'Delivered'}
                </div>
            )
        },
        {
            key: 'customerSubTotal',
            label: 'Subtotal',
            width: 'w-20 min-w-20 text-right',
            render: (value) => <span className="text-right block"><span className="mr-0.5">+</span>${Number(value)}</span>
        },
        {
            key: 'customerDeliveryFee',
            label: 'Cst. D Fee',
            width: 'w-20 min-w-20 text-right',
            render: (value) => <span className="text-right block"><span className="mr-0.5">+</span>${Number(value)}</span>
        },
        {
            key: 'customerTip',
            label: 'Cst. Tip',
            width: 'w-20 min-w-20 text-right',
            render: (value) => <span className="text-right block"><span className="mr-0.5">+</span>${Number(value)}</span>
        },
        {
            key: 'action',
            label: 'Action',
            align: 'left',
            width: 'w-24 min-w-24',
            stickyRight: true,
            render: (value, order: Order) => (
                <div className="flex items-center gap-4 justify-center pr-4">
                    {
                        order.status != OrderStatus.Unassigned &&
                        <Button
                            variant='outline'
                            className="min-w-20"
                            onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/fleet/manage-orders/${order.id}`)
                            }}>
                            {order.status.startsWith(OrderStatus.RequestingDriver) || order.status === OrderStatus.Delivered
                                ? 'View'
                                : 'Track'}
                        </Button>
                    }
                </div>
            ),
        },
    ];

    return (
        <div className='px-4 py-4'>
            <div className="border border-border rounded-[20px] bg-background">
                <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as OrderTab)} className="w-full py-0 pt-4 gap-0">
                    <TabsList className="bg-transparent rounded-none w-inherit justify-start h-auto px-6 py-0 gap-4 ">
                        <TabsTrigger value={OrderTab.ALL}
                            className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                            All ({ordersCount})
                        </TabsTrigger>
                        <TabsTrigger value={OrderTab.UNASSIGNED}
                            className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                            Unassigned ({unassignedCount})
                        </TabsTrigger>
                        <TabsTrigger value={OrderTab.SCHEDULED}
                            className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                            data-[state=active]:text-text-1
                            data-[state=active]:border-b-2
                            data-[state=active]:border-b-primary ">
                            Scheduled ({scheduledCount})
                        </TabsTrigger>
                        <TabsTrigger value={OrderTab.ACTIVE}
                            className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                            Active ({activeCount})
                        </TabsTrigger>
                        <TabsTrigger value={OrderTab.DELIVERED}
                            className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                            Delivered ({deliveredCount})
                        </TabsTrigger>
                    </TabsList>
                    <div className="border-t border-border mt-0 flex flex-col lg:flex-row justify-between items-center gap-4 pt-5 py-4 px-6 ">
                        <div className="relative w-full lg:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-3" />
                            <Input
                                placeholder="Search by Order ID or Customer..."
                                value={search}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                className="h-10 pr-10 placeholder:text-text-3 font-normal text-sm pl-10 border-border"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
                                >
                                    <X className="h-6 w-6 text-text-3" />
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto pb-2 lg:pb-0">
                                <SearchableBusinessDropdown
                                    businesses={allBusinesses}
                                    value={activeBusinessId!}
                                    onChange={(_value, id) => {
                                        setActiveBusinessId(id)
                                    }}
                                    placeholder="Search or select business..."
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-auto text-text-sidebar border border-border font-medium text-sm gap-2 justify-between"
                                        >
                                            <span>{activeSort || "Sort By"}</span>
                                            <ChevronDown className="h-4 w-4 shrink-0" />
                                        </Button>
                                    </DropdownMenuTrigger>

                                    <DropdownMenuContent className="w-56 p-1.5" align="end">
                                        <DropdownMenuRadioGroup value={activeSort} onValueChange={setActiveSort}>
                                            {sortOptions.map((option) => (
                                                <DropdownMenuRadioItem
                                                    key={option}
                                                    value={option}
                                                    onClick={() => setActiveSort(option)}
                                                    className={cn(
                                                        "relative flex cursor-pointer select-none items-center rounded-lg h-10 px-3 text-sm outline-none transition-colors",
                                                        "focus:bg-slate-100 focus:text-text-sidebar",
                                                        "data-[state=checked]:bg-slate-100 data-[state=checked]:text-text-sidebar data-[state=checked]:font-medium",
                                                        activeSort !== option && "text-text-2",
                                                        "[&>span]:hidden"
                                                    )}
                                                >
                                                    {option}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                    {(isLoading && !data) ? <Loader
                        fullScreen
                        label="Fetching Orders"
                        description="Please wait while we load orders information..."
                    /> :
                        <GenericTable
                            data={filteredOrders}
                            columns={orderColumns}
                            selectable={true}
                            hoverable={true}
                            onRowClick={(order) => order.status !== OrderStatus.Unassigned ? router.push(`/fleet/manage-orders/${order.id}`) : null}
                            emptyMessage="No orders found"
                        />
                    }
                </Tabs>
                <CardFooter className="justify-center border-t items-center p-4!">
                    <div className="flex flex-col items-center gap-2">
                        {hasNextPage && (
                            <Button
                                variant="outline"
                                className="text-primary font-medium hover:bg-primary/10 border-none"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                            >
                                {isFetchingNextPage ? 'Loading...' : 'View more Orders'}
                            </Button>
                        )}
                        {!hasNextPage && allOrders.length > 0 && (
                            <p className="text-sm text-text-2">
                                All orders loaded ({filteredOrders.length})
                            </p>
                        )}
                    </div>
                </CardFooter>
            </div>
        </div>
    )
}
