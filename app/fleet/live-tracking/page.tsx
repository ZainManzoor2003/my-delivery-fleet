'use client'
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, Search, Timer, MapPin, Calendar, User2, Check, ArrowRight } from "lucide-react";
import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import OrderStatusBadge from "../components/orderStatusBadge";
import { useGetOrders } from "@/app/hooks/useOrder";
import { OrderTab } from "@/lib/enums/orderTab";
import { useUserStore } from "@/app/stores/userStore";
import { Order, OrderStatus } from "@/lib/types/order";
import { Loader } from "@/app/components/loader";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import OrderDetailsPanel from "./components/orderDetailsPanel";
import MultiLocationMap from "@/components/maps/multiLocationMap";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils";
import { AlignBoxIcon } from "@/components/icons/alignBox";
import { MoneyBagIcon } from "@/components/icons/moneyBag";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { formatUTCLocal, getTimeDifference } from "@/lib/timezone";
import AssignDeliveryDialog from "../components/assignDeliveryDialog";

export default function FleetLiveTrackingPage() {

    const { setOpen } = useSidebar()
    const { businessId, businessAddress } = useUserStore()

    useEffect(() => {
        setOpen(false)
        return () => setOpen(true)
    }, [])
    const { data, isLoading } = useGetOrders(businessId as string, { minimal: false });
    const [activeTab, setActiveTab] = useState<OrderTab>(OrderTab.ALL);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState<string>("");
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [selectedOrderForAction, setSelectedOrderForAction] = useState<Order | null>(null);
    const [copiedPhone, setCopiedPhone] = useState(false);
    const [isToastVisible, setIsToastVisible] = useState<boolean>(false);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const sortOptions = [
        "Newest first",
        "Oldest first",
        "ETA (Soonest first)",
        "ETA (Latest first)",
        "Subtotal (High to low)",
        "Subtotal (Low to high)",
    ];
    const [activeSort, setActiveSort] = useState<string>("");

    useEffect(() => {
        if (activeTab === OrderTab.ALL || activeTab === OrderTab.UNASSIGNED) return;
        const timer = setTimeout(() => setActiveTab(OrderTab.ALL), 60000);
        return () => clearTimeout(timer);
    }, [activeTab]);

    const focusOrderId = searchParams?.get('orderId');

    useEffect(() => {
        if (!focusOrderId || isLoading) return;
        const allOrders = data?.pages.flatMap(page => page.orders || []) || [];
        const target = allOrders.find((o: Order) => o.id === focusOrderId);
        if (target) {
            setTimeout(() => {
                setSelectedOrderForAction(target);
                setIsToastVisible(true);
            }, 0);
        }
        // Clear the param from the URL without re-navigating
        const url = new URL(window.location.href);
        url.searchParams.delete('orderId');
        window.history.replaceState({}, '', url.toString());
    }, [focusOrderId, isLoading, data]);

    const orders: Order[] = useMemo(() => {
        const allOrders = data?.pages.flatMap(page => page.orders || []) || [];
        if (!allOrders.length) return [];
        const querySearch = search.trim().toLowerCase();


        return allOrders
            .filter((o: Order) => {
                const orderNum = String(o.orderNumber ?? o.id ?? '').toLowerCase();
                const customer = (o.customerName ?? '').toLowerCase();
                return orderNum.includes(querySearch) || customer.includes(querySearch);
            });
    }, [data, search]);

    const filteredOrders: Order[] = useMemo(() => {
        if (!orders) return [];
        let filtered = orders;
        switch (activeTab) {
            case OrderTab.ALL:
                filtered = [...orders].sort((a, b) => {
                    const aDelivered = a.status === OrderStatus.Delivered
                    const bDelivered = b.status === OrderStatus.Delivered
                    if (aDelivered && !bDelivered) return 1
                    if (!aDelivered && bDelivered) return -1
                    return 0
                })
                break

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
    const activeCount = orders.filter((o: Order) => (o.status.startsWith(OrderStatus.Delivery)) || (o.status.startsWith(OrderStatus.PickUp))).length || 0;
    const scheduledCount = orders?.filter((o: Order) => o.status === OrderStatus.Scheduled).length || 0;
    const deliveredCount = orders?.filter((o: Order) => o.status === OrderStatus.Delivered).length || 0;


    // Memoize business location to prevent map resets
    const memoizedBusinessLocation = useMemo(() =>
        businessAddress ? {
            latitude: businessAddress.latitude,
            longitude: businessAddress.longitude
        } : null
        , [businessAddress])

    const handleOrderClick = (order: Order) => {
        setSelectedOrderForAction(order);
        setIsToastVisible(true)
        setCopiedPhone(false);
    };

    const handleCopyPhoneNumber = async () => {
        if (selectedOrderForAction?.customerPhone) {
            try {
                await navigator.clipboard.writeText(
                    selectedOrderForAction.customerPhone
                );
                setCopiedPhone(true);
                setTimeout(() => setCopiedPhone(false), 3000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        }
    };
    const handleOrderAction = (order: Order) => {
        if (order.status === OrderStatus.Unassigned || order.status === OrderStatus.Scheduled) {
            const addr = order.deliveryAddress;
            if (!addr || !addr.address || !addr.street) {
                router.push(`/fleet/orders/${order.id}?from=live-tracking`);
                return;
            }
            setSelectedOrderForAction(order);
            setAssignDialogOpen(true);
        }
    };

    return (
        <div className="w-full rounded-none">
            <div className='relative w-full h-screen'>
                <SidebarTrigger className='z-10 absolute left-2.5 top-24 bg-white p-5 rounded-none xl:hidden' />
                <div className="absolute inset-0 rounded-none">
                    <MultiLocationMap
                        orders={filteredOrders}
                        businessLocation={memoizedBusinessLocation}
                        className='h-screen'
                        rightPanelWidth={448}
                        selectedOrderId={selectedOrderForAction?.id ?? currentOrder?.id ?? null}
                        onOrderClick={(order) => {
                            setSelectedOrderForAction(order)
                            setIsToastVisible(true)
                        }}
                    />
                </div>
                <div className="w-md absolute bottom-4 rounded-xl top-4 right-4 bg-white flex flex-col overflow-hidden">
                    {!currentOrder ? (
                        <>
                            <div className="px-4 pt-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-3" />
                                    <Input
                                        placeholder="Search"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="h-10 placeholder:text-text-3 font-normal text-sm pl-10 border-border"
                                    />
                                </div>
                            </div>
                            <div className="p-4 flex justify-between flex-wrap gap-2 mt-0">
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
                                <Button className='gap-1 h-10 font-medium text-sm min-w-44'
                                    onClick={() => router.push('orders/new?from=live-tracking')} >
                                    <Plus />
                                    Create Delivery
                                </Button>
                            </div>
                            <div className="px-4 pb-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full text-text-sidebar border border-border font-medium text-sm gap-2 justify-between">
                                            <span>
                                                {activeTab === OrderTab.ALL && `All (${ordersCount})`}
                                                {activeTab === OrderTab.UNASSIGNED && `Unassigned (${unassignedCount})`}
                                                {activeTab === OrderTab.SCHEDULED && `Scheduled (${scheduledCount})`}
                                                {activeTab === OrderTab.ACTIVE && `Active (${activeCount})`}
                                                {activeTab === OrderTab.DELIVERED && `Delivered (${deliveredCount})`}
                                            </span>
                                            <ChevronDown className="h-4 w-4 shrink-0" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) p-1.5" align="start">
                                        <DropdownMenuRadioGroup value={activeTab} onValueChange={(value) => { setActiveTab(value as OrderTab); setSelectedOrderForAction(null); }}>
                                            {[
                                                { value: OrderTab.ALL, label: `All (${ordersCount})` },
                                                { value: OrderTab.UNASSIGNED, label: `Unassigned (${unassignedCount})` },
                                                { value: OrderTab.SCHEDULED, label: `Scheduled (${scheduledCount})` },
                                                { value: OrderTab.ACTIVE, label: `Active (${activeCount})` },
                                                { value: OrderTab.DELIVERED, label: `Delivered (${deliveredCount})` },
                                            ].map(({ value, label }) => (
                                                <DropdownMenuRadioItem
                                                    key={value}
                                                    value={value}
                                                    className={cn(
                                                        "relative flex cursor-pointer select-none items-center rounded-lg h-10 px-3 text-sm outline-none transition-colors",
                                                        "focus:bg-slate-100 focus:text-text-sidebar",
                                                        "data-[state=checked]:bg-slate-100 data-[state=checked]:text-text-sidebar data-[state=checked]:font-medium",
                                                        activeTab !== value && "text-text-2",
                                                        "[&>span]:hidden"
                                                    )}
                                                >
                                                    {label}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="border-t border-border flex flex-col w-full flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-2">
                                {isLoading ? <Loader
                                    label="Fetching Orders"
                                    description="Please wait while we load orders information..."
                                /> :
                                    filteredOrders?.map((order: any, i: number) => (
                                        <Card key={i}
                                            onClick={() => handleOrderClick(order)}
                                            className={cn("cursor-pointer hover:bg-border/50 px-0 rounded-xl border gap-2 py-0 pt-4 shadow-none w-full overflow-hidden shrink-0", selectedOrderForAction?.id === order.id ? "border-border bg-[#F1F5F9]" : "border-border")}>
                                            <CardHeader className="flex items-center justify-between pb-0 px-4">
                                                <OrderStatusBadge order={order} />
                                                <div className="flex items-center gap-2">
                                                    <ArrowRight
                                                        className="h-4 w-4 hover:text-text-sidebar/70 cursor-pointer transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCurrentOrder(order)
                                                            setSelectedOrderForAction(null)
                                                            setIsToastVisible(false)
                                                        }} />
                                                </div>
                                            </CardHeader>
                                            <CardContent className="text-text-1 px-0">
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-4 pb-3 border-b border-border">
                                                    <div className="flex items-center gap-2">
                                                        <AlignBoxIcon size={16} />
                                                        <p className="text-sm font-normal text-text-1">
                                                            #{order.orderNumber}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-icon" />
                                                        <p className="text-sm font-normal text-text-1">
                                                            {formatUTCLocal(order.createdAt, {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                                hour12: true,
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div
                                                        className="flex items-center gap-2"
                                                    >
                                                        <User2 className="h-4 w-4 text-icon" />
                                                        <p className="text-sm font-normal text-text-1">
                                                            {order.customerName &&
                                                                order.customerName.length > 15 ?
                                                                order.customerName.slice(0, 15) + '...'
                                                                : order.customerName}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="h-4 w-4 text-icon mt-0.5" />
                                                        <p className="text-sm font-normal text-text-1">
                                                            {order.deliveryAddress?.address ? order.deliveryAddress.address.length > 15
                                                                ? order.deliveryAddress.address.slice(0, 15) + '...'
                                                                : order.deliveryAddress.address : 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Timer className="h-4 w-4 text-icon" />
                                                        <p className="text-sm font-normal text-text-1">
                                                            {order.status === OrderStatus.Delivered ? 'Delivered' : order.estimatedDeliveryTime
                                                                ? getTimeDifference(order.estimatedDeliveryTime).formatted
                                                                : '—'}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-start gap-2">
                                                        <MoneyBagIcon size={16} />
                                                        <p className="text-sm font-normal text-text-1">
                                                            <span className="mr-0.5">+</span>${order.customerSubTotal || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex w-full px-4">
                                                    <div className='flex-1 border-r border-border'>
                                                        <div className='flex gap-2 items-center py-4'>
                                                            <p className="uppercase text-[10px] font-semibold text-icon">
                                                                CST. D Fee
                                                            </p>
                                                            <p className="text-sm font-normal text-text-1">
                                                                <span className="mr-0.5">+</span>${Number(order.customerDeliveryFee) || 0}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className='flex-1 pl-4 flex gap-2 items-center justify-start'>
                                                        <p className="uppercase text-[10px] font-semibold text-icon">
                                                            CST. Tip
                                                        </p>
                                                        <p className="text-sm font-normal text-text-1">
                                                            <span className="mr-0.5">+</span>${Number(order.customerTip) || 0}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                            </div>
                        </>
                    ) : (
                        <div className="overflow-y-auto flex-1 py-5">
                            <OrderDetailsPanel currentOrder={currentOrder} setCurrentOrder={setCurrentOrder} />
                        </div>
                    )}
                </div>
                {selectedOrderForAction && (
                    <div
                        className={cn(
                            "@container absolute bottom-8 left-5 right-[calc(28rem+2.25rem)] z-50 flex justify-center transition-all duration-300 ease-in-out",
                            isToastVisible
                                ? "opacity-100 translate-y-0 pointer-events-auto"
                                : "opacity-0 translate-y-6 pointer-events-none"
                        )}
                    >
                        <div className="min-h-15 bg-background flex flex-col @sm:flex-row @sm:items-center justify-between gap-2 px-4 py-2 border border-border rounded-[20px] w-full overflow-hidden">
                            <div className="flex flex-col justify-end">
                                <p className="text-xs font-normal text-text-2">
                                    #{selectedOrderForAction.orderNumber}
                                </p>
                                <p className="text-sm font-normal text-text-1">
                                    {selectedOrderForAction.customerName}
                                </p>

                            </div>
                            <div className="flex gap-2">
                                {selectedOrderForAction.customerPhone && (
                                    <Button
                                        onClick={handleCopyPhoneNumber}
                                        variant="outline"
                                    >
                                        {copiedPhone ? (
                                            <>
                                                <Check className="h-4 w-4 text-green-500" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>{selectedOrderForAction.customerPhone}</>
                                        )}
                                    </Button>
                                )}

                                {(selectedOrderForAction.status === OrderStatus.Unassigned || (selectedOrderForAction.status === OrderStatus.Scheduled && !selectedOrderForAction.providerDeliveryId)) && (
                                    <Button
                                        onClick={() => {
                                            handleOrderAction(selectedOrderForAction);
                                        }}>
                                        Assign Driver
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <AssignDeliveryDialog
                order={selectedOrderForAction}
                open={assignDialogOpen}
                onClose={() => {
                    setAssignDialogOpen(false);
                    setSelectedOrderForAction(null);
                }}
            />
        </div>
    )
}
