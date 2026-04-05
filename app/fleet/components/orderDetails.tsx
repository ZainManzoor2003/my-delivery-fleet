'use client'
import { ArrowLeft, User2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { Order, OrderStatus } from "@/lib/types/order";
import { formatUTCLocal } from "@/lib/timezone";
import ItemsTable from "../orders/components/itemsTable";
import OrderStatusBadge from "./orderStatusBadge";
import OrderTimeline from "../orders/components/orderTimeline";
import Image from "next/image";
import LocationMap from "@/components/maps/locationMap";
import { useGetOrder } from "@/app/hooks/useOrder";
import { useUserStore } from "@/app/stores/userStore";
import { useState, useEffect } from "react";
import { StoreIcon } from "@/components/icons/store";
import { LocationIcon } from "@/components/icons/location";
import { Role } from "@/lib/enums/role";

interface Props {
    order: Order
}

export default function OrderDetails({ order }: Props) {
    const router = useRouter()
    const [currentTime, setCurrentTime] = useState(new Date());

    const { businessAddress, role } = useUserStore();

    const isTrackingEnabled = order.status !== OrderStatus.Unassigned &&
        order.status !== OrderStatus.Canceled &&
        order.status !== OrderStatus.Delivered;

    useEffect(() => {
        if (!isTrackingEnabled) return;

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 5000);

        return () => clearInterval(timer);
    }, [isTrackingEnabled]);

    const { data: orderData } = useGetOrder(
        order.id!,
        { refetchInterval: isTrackingEnabled ? 5000 : undefined }
    );

    const currentOrder = orderData?.order || order;
    const courier = currentOrder.courier;

    const getTrackingMessage = () => {
        switch (currentOrder.status) {
            case OrderStatus.PickUp:
                return "Driver is heading to the restaurant";
            case OrderStatus.Delivery:
                return "Your order is on its way";
            default:
                return "";
        }
    };

    const timeSinceLastUpdate = (() => {
        if (!courier?.locationUpdatedAt) return "";

        const lastUpdate = new Date(courier.locationUpdatedAt);
        const diffMs = currentTime.getTime() - lastUpdate.getTime();
        const diffSecs = Math.floor(diffMs / 1000);

        if (diffSecs < 10) return "Just now";
        if (diffSecs < 60) return `${diffSecs} secs ago`;

        const diffMins = Math.floor(diffSecs / 60);
        if (diffMins === 1) return "1 min ago";
        if (diffMins < 60) return `${diffMins} mins ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours === 1) return "1 hour ago";
        if (diffHours < 24) return `${diffHours} hours ago`;

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} days ago`;
    })();

    const estimatedTime = (() => {
        if (currentOrder.status === OrderStatus.PickUp && currentOrder.estimatedPickupTime) {
            const now = new Date();
            const pickupTime = new Date(currentOrder.estimatedPickupTime);
            const diffMs = pickupTime.getTime() - now.getTime();
            const diffMins = Math.ceil(diffMs / (1000 * 60));
            return diffMins > 0 ? `${diffMins} mins` : "Arriving soon";
        }

        if (currentOrder.status === OrderStatus.Delivery && currentOrder.estimatedDeliveryTime) {
            const now = new Date();
            const deliveryTime = new Date(currentOrder.estimatedDeliveryTime);
            const diffMs = deliveryTime.getTime() - now.getTime();
            const diffMins = Math.ceil(diffMs / (1000 * 60));
            return diffMins > 0 ? `${diffMins} mins` : "Arriving soon";
        }

        return null;
    })()
    return (
        <div className="min-h-screen py-5">
            <div className="px-4">
                <button className="flex items-center text-md font-medium text-text-sidebar">
                    <ArrowLeft
                        className="h-6 w-6 mr-2 hover:text-text-sidebar/70 cursor-pointer transition-colors"
                        onClick={() => role === Role.ADMIN ? router.push('/fleet/manage-orders') : router.push('/fleet/orders')}
                    />
                    Back to Orders
                </button>
                <div className="py-10">
                    <h1 className="text-xl font-medium text-text-sidebar">Order #{order.orderNumber}</h1>
                    <div className="flex flex-wrap justify-between gap-2">
                        <div className="flex gap-2 mt-2 items-center">
                            <OrderStatusBadge order={order} />
                            <p className="text-md text-text-2 font-normal">
                                Created at {order.createdAt ? formatUTCLocal(order.createdAt, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : ""}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row px-4 gap-4 ">
                <main className="min-w-0 flex-[1.6] space-y-4 px-4 py-4 bg-background border border-border rounded-[20px]">
                    {(currentOrder.status === OrderStatus.PickUp || currentOrder.status === OrderStatus.Delivery) && (
                        <div className="py-4 px-4 border-b border-border">
                            {estimatedTime && <h2 className="text-[54px] font-semibold text-text-1">{estimatedTime}</h2>}
                            <p className="text-md text-text-1 font-medium">{getTrackingMessage()}</p>
                            <div className="flex justify-between items-center mt-5">
                                <div className="flex gap-2 text-primary text-lg font-medium hover:cursor-pointer" onClick={() => router.push('/fleet/live-tracking')}>
                                    <div className='flex items-center justify-center w-6 h-6 rounded-full bg-primary/10'>
                                        <div className='bg-primary w-2 h-2 rounded-full' />
                                    </div>
                                    Live Tracking
                                </div>
                                <p className="text-text-2 text-sm font-normal">{timeSinceLastUpdate}</p>
                            </div>
                            <div className="h-90 rounded-lg overflow-hidden border border-border mt-5">
                                <LocationMap
                                    order={currentOrder}
                                    businessLocation={businessAddress?.longitude && businessAddress?.latitude ? {
                                        latitude: businessAddress.latitude,
                                        longitude: businessAddress.longitude
                                    } : null}
                                />
                            </div>
                        </div>
                    )}

                    <OrderTimeline order={currentOrder} />

                    <Separator className="bg-border" />

                    <div className="py-0 space-y-0 px-4">
                        <h2 className="text-lg font-medium text-text-1">Items</h2>
                        <ItemsTable items={order.items || []} />
                        <div className="py-4 flex flex-col items-end space-y-3 pr-4">
                            <div className="flex justify-between w-full max-w-70 font-medium text-text-1">
                                <span>Subtotal</span>
                                <span>${(Number(order.customerSubTotal)).toFixed(2) || '0.00'}</span>
                            </div>
                            <Separator className="w-full max-w-70 border-border" />
                            <div className="flex justify-between font-regular w-full max-w-70 text-sm text-text-2">
                                <span>Customer Delivery Fee</span>
                                <span>${(Number(order.customerDeliveryFee)).toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="flex justify-between font-regular w-full max-w-70 text-sm text-text-2">
                                <span>Customer Tip</span>
                                <span>${(Number(order.customerTip)).toFixed(2) || '0.00'}</span>
                            </div>
                        </div>
                    </div>
                </main>

                <div className="min-w-0 h-fit flex-[1.2] flex flex-col space-y-4 bg-background border border-border rounded-[20px] px-4 py-4">
                    <div className="space-y-4 px-4 py-4">
                        <h2 className="text-lg font-medium text-text-1">Customer Info</h2>
                        <div className="flex gap-4">
                            <LocationIcon size={24} />
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase text-icon">Delivery Address</p>
                                <p className="text-md text-text-1 font-normal mt-3">
                                    {order.deliveryAddress?.address || 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <User2 className="h-6 w-6 text-icon" />
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase text-icon">Customer</p>
                                <p className="text-md font-medium text-text-1 mt-3">{order.customerName}</p>
                                <p className="text-sm text-text-2">{order.customerPhone}</p>
                                {order.customerEmail && <p className="text-sm text-text-2">{order.customerEmail}</p>}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <StoreIcon size={24} />
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase text-icon">Pickup Location</p>
                                <p className="text-md text-text-1 font-regular mt-3">
                                    {businessAddress?.address || 'Business Location'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-border" />

                    <div className="space-y-4 px-4 py-4">
                        <p className="text-lg font-medium text-text-1">Driver Info</p>
                        {courier ? (
                            <div className="space-y-4">
                                <div className="flex items-start gap-2">
                                    <Image
                                        src="/uber-icon.svg"
                                        alt="uber logo"
                                        className="bg-black rounded-[3px]"
                                        width={24}
                                        height={24}
                                    />
                                    <div className="flex-1">
                                        <p className="text-md font-medium text-text-1">{courier.name}</p>
                                        <p className="text-md text-text-2">{courier.phone}</p>
                                        <p className="text-md text-text-2">{courier.vehicleMake} {courier.vehicleModel}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-2">
                                <Image
                                    src="/uber-icon.svg"
                                    alt="uber logo"
                                    className="bg-black rounded-[3px]"
                                    width={24}
                                    height={24}
                                />
                                <div>
                                    <p className="text-md font-medium text-text-1">No courier assigned yet</p>
                                    <p className="text-md text-text-1 font-normal">Driver will be assigned shortly</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator className="bg-border" />

                    <div className="space-y-4 px-4 py-4">
                        <h2 className="text-lg font-medium text-text-1">Delivery Charge Summary</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between font-regular w-full text-sm text-text-2">
                                <span>Dispatch Fee</span>
                                <span>${(Number(order?.deliveryFee) || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-regular w-full text-sm text-text-2">
                                <span>Driver Tip</span>
                                <span>${(Number(order.totalTip) || 0).toFixed(2)}</span>
                            </div>
                        </div>
                        <Separator className="bg-border" />
                        <div className="flex justify-between w-full font-medium text-text-1">
                            <span className="text-lg font-medium text-text-1">Total</span>
                            <span className="text-lg font-medium text-text-1">
                                ${(Number(order?.totalAmount) || 0).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <p className="flex justify-center items-center text-xs text-text-1 font-normal text-center gap-0">Powered By
                        <Image src="/Uber_Logo.png" alt="uber direact logo" className="-ml-1 cursor-pointer"
                            width={48} height={32} />
                    </p>
                </div>
            </div>
        </div>
    )
}
