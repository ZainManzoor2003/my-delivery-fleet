'use client'
import { Order, OrderStatus } from "@/lib/types/order";
import { User2, ArrowLeft, Edit2 } from "lucide-react";
import OrderStatusBadge from "../../components/orderStatusBadge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import OrderTimeline from "../../orders/components/orderTimeline";
import { useUserStore } from "@/app/stores/userStore";
import { useGetOrder, useToggleTrackingVisibility } from "@/app/hooks/useOrder";
import { toast } from "react-toastify";
import { LocationIcon } from "@/components/icons/location";
import { StoreIcon } from "@/components/icons/store";
import { formatUTCLocal, getTimeDifference } from "@/lib/timezone";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface OrderDetailsPanelProps {
    currentOrder: Order;
    setCurrentOrder: (order: Order | null) => void;
}

export default function OrderDetailsPanel({ currentOrder, setCurrentOrder }: OrderDetailsPanelProps) {
    const router = useRouter()
    const { businessAddress } = useUserStore();
    const { mutate: toggleTrackingVisibility } = useToggleTrackingVisibility();
    const isEligibleForClear = currentOrder.status === OrderStatus.Unassigned || (currentOrder.status === OrderStatus.Scheduled && !currentOrder.providerDeliveryId);
    const isTrackingEnabled = currentOrder.status !== OrderStatus.Unassigned && currentOrder.status !== OrderStatus.Canceled && currentOrder.status !== OrderStatus.Delivered;
    const { data: orderData } = useGetOrder(
        currentOrder.id!,
        { refetchInterval: isTrackingEnabled ? 5000 : undefined }
    );
    const order = orderData?.order || currentOrder;

    const getTrackingMessage = () => {
        switch (order.status) {
            case OrderStatus.PickUp:
                return "Driver is heading to the restaurant";
            case OrderStatus.Delivery:
                return "Your order is on its way";
            default:
                return "";
        }
    };

    const getEstimatedTime = () => {
        if (order.status === OrderStatus.PickUp && order.estimatedPickupTime) {
            const timeInfo = getTimeDifference(order.estimatedPickupTime);
            return timeInfo.minutes > 0 ? `${timeInfo.minutes} mins` : "Arriving soon";
        }

        if (order.status === OrderStatus.Delivery && order.estimatedDeliveryTime) {
            const timeInfo = getTimeDifference(order.estimatedDeliveryTime);
            return timeInfo.minutes > 0 ? `${timeInfo.minutes} mins` : "Arriving soon";
        }

        return null;
    };

    const estimatedTime = getEstimatedTime();

    return (
        <>
            <div className="py-5 pt-0 px-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between">
                    <div className="flex items-center">
                        <ArrowLeft className="h-6 w-6 mr-2 cursor-pointer" onClick={() => setCurrentOrder(null)} />
                        <h1 className="text-xl font-medium text-text-1">Order #{currentOrder?.orderNumber}</h1>
                    </div>
                    {isEligibleForClear && (
                        <Button
                            variant="outline"
                            onClick={() =>
                                toggleTrackingVisibility(
                                    { id: currentOrder.id!, isClearedFromTracking: true },
                                    {
                                        onSuccess: () => {
                                            toast.success('Order hidden from live tracking');
                                            setCurrentOrder(null);
                                        },
                                        onError: () => toast.error('Failed to update live tracking visibility'),
                                    }
                                )
                            }
                        >
                            Clear From Tracking
                        </Button>
                    )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <OrderStatusBadge order={order} />
                    <p className="text-sm text-text-1 font-normal"> {formatUTCLocal(currentOrder.createdAt!.toString(), {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    })}</p>
                </div>
            </div>
            <Separator className="bg-border" />
            {(order.status === OrderStatus.PickUp ||
                order.status === OrderStatus.Delivery) &&
                <>
                    <div className="py-5 px-4">
                        {estimatedTime && <h2 className="text-[44px] font-semibold text-text-1">{estimatedTime}</h2>}
                        <p className="text-sm text-text-1 font-medium">{getTrackingMessage()}</p>
                        <div className="flex justify-between items-center mt-5">
                            <div className="flex gap-2 text-primary items-center text-sm font-medium">
                                <div className='flex items-center justify-center w-6 h-6 rounded-full  bg-primary/10' >
                                    <div className='bg-primary w-2 h-2 rounded-full ' />
                                </div>
                                Live Tracking
                            </div>
                        </div>

                    </div>
                    <Separator className="bg-border" />
                </>
            }
            <div className="space-y-5 px-4 py-5">
                <h2 className="text-lg font-medium text-text-1">Customer Info</h2>
                <div className="flex gap-4">
                    <LocationIcon size={24} />
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase text-icon">Delivery Address</p>
                        <p className="text-sm text-text-1 font-normal mt-3">
                            {currentOrder?.deliveryAddress?.address ? currentOrder?.deliveryAddress?.address.length > 40 ?
                                currentOrder?.deliveryAddress?.address.slice(0, 40) + '...' :
                                currentOrder?.deliveryAddress?.address : 'N/A'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <User2 className="h-6 w-6 text-icon" />
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase text-icon">Customer</p>
                        <p className="text-sm font-medium text-text-1 mt-3">{currentOrder?.customerName || 'N/A'}</p>
                        <p className="text-sm text-text-2">{currentOrder?.customerPhone || 'N/A'}</p>
                        <p className="text-sm text-text-2">{currentOrder?.customerEmail || 'N/A'}</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <StoreIcon size={24} />
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase text-icon">Pickup Location</p>
                        <p className="text-sm text-text-1 font-regular mt-3">
                            {businessAddress?.address ||
                                'Business Location'}</p>
                    </div>
                </div>
            </div>
            <Separator className="bg-border" />
            {order.status !== OrderStatus.RequestingDriver &&
                order.status !== OrderStatus.Unassigned && order.courier &&
                <>
                    <div className="space-y-5 px-4 py-5">
                        <p className="text-lg font-medium text-text-1">Driver Info</p>
                        <div className="flex items-start gap-2">
                            <Image src="/uber-icon.svg" alt="uber logo" className="bg-black rounded-[3px]"
                                width={24} height={24} />
                            <div>
                                <p className="text-md font-medium text-text-1">
                                    {order.courier.name}</p>
                                <p className="text-sm text-text-1 font-normal">
                                    {order.courier.phone}</p>
                                <p className="text-md text-text-2">{order.courier.vehicleMake} {order.courier.vehicleModel}</p>
                            </div>
                        </div>
                    </div>
                    <Separator className="bg-border" />
                </>
            }
            <OrderTimeline order={order} />
            <Separator className="bg-border" />
            <div className="space-y-5 py-5">
                <h2 className="px-4 text-lg font-medium text-text-1">Delivery Charge Summary</h2>
                <div className="px-4 space-y-4">
                    <div className="flex justify-between font-regular w-full text-sm text-text-2">
                        <span>Dispatch Fee</span>
                        <span>${Number(order?.deliveryFee) || 0}</span>
                    </div>
                    <div className="flex justify-between items-center font-regular w-full text-sm text-text-2">
                        <span>Driver Tip</span>
                        <div className="flex gap-1">
                            <span
                                className="cursor-pointer"
                            >
                                ${Number(order?.totalTip) || 0}</span>

                        </div>
                    </div>
                    {order.status === OrderStatus.Unassigned &&
                        <div
                            onClick={() => router.push(`/fleet/orders/${order.id}?scrollToTip=true`)}
                            className="flex justify-between text-sm items-center font-medium text-text-2 p-2 rounded-xl cursor-pointer gap-0 
                        border border-[#3FC060] bg-green-100">
                            Add Additional Tip to driver
                            <Edit2
                                className='cursor-pointer'
                                size={16} />
                        </div>
                    }
                </div>
                <Separator className="bg-border" />
                <div className="px-4 flex justify-between w-full font-medium text-text-1">
                    <span className="text-lg font-medium text-text-1">Total</span>
                    <span className="text-lg font-medium text-text-1">
                        ${(Number(order?.totalAmount) || Number(order?.deliveryFee) + Number(order?.totalTip)).toFixed(2)}
                    </span>
                </div>
            </div>
            <Separator className="bg-border" />
            <p className="flex justify-center items-center text-xs mt-2 text-text-1 font-normal text-center gap-0">Powered By
                <Image src="/Uber_Logo.png" alt="uber direact logo" className="-ml-1 cursor-pointer"
                    width={48} height={32} />
            </p>
        </>
    )
}
