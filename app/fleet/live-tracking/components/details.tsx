'use client'
import { Order, OrderStatus } from "@/lib/types/order";
import { MapPin, User2, Store, ArrowLeft } from "lucide-react";
import OrderStatusBadge from "../../components/orderStatusBadge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import OrderTimeline from "../../orders/components/orderTimeline";

interface Props {
    currentOrder: Order;
    setCurrentOrder: (order: Order | null) => void;
}

export default function Details({ currentOrder, setCurrentOrder }: Props) {
    return (
        <>
            <div className="py-5 pt-0 px-4 space-y-4">
                <div className="flex flex-wrap justify-start">
                    <ArrowLeft className="h-6 w-6 mr-2 cursor-pointer" onClick={() => setCurrentOrder(null)} />
                    <h1 className="text-xl font-medium text-text-1">Order #{currentOrder?.orderNumber}</h1>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                    <OrderStatusBadge status={currentOrder?.status} />
                    <p className="text-sm text-text-1 font-normal"> {new Date(currentOrder?.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    })}</p>
                </div>
            </div>
            <Separator className="bg-border" />
            {currentOrder.status !== OrderStatus.RequestingDriver &&
                currentOrder.status !== OrderStatus.Unassigned &&
                <>
                    <div className="py-5 px-4">

                        <h2 className="text-[44px] font-semibold text-text-1">12 mins</h2>
                        <p className="text-sm text-text-1 font-medium">Driver is heading to the restaurant</p>
                        <div className="flex justify-between items-center mt-5">
                            <div className="flex gap-2 text-primary items-center text-sm font-medium">

                                <div className='flex items-center justify-center
                                                                w-6 h-6 rounded-full  bg-primary/10' >
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
                    <MapPin className="h-6 w-6 text-icon" />
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase text-icon">Delivery Address</p>
                        <p className="text-sm text-text-1 font-normal mt-3">
                            {currentOrder?.deliveryAddress?.address ? currentOrder?.deliveryAddress?.address.length > 30 ?
                                currentOrder?.deliveryAddress?.address.slice(0, 30) + '...' :
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
                    <Store className="h-6 w-6 text-icon" />
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase text-icon">Pickup Location</p>
                        <p className="text-sm text-text-1 font-regular mt-3">  {currentOrder?.deliveryAddress?.address ? currentOrder?.deliveryAddress?.address.length > 30 ?
                            currentOrder?.deliveryAddress?.address.slice(0, 30) + '...' :
                            currentOrder?.deliveryAddress?.address : 'N/A'}</p>
                    </div>
                </div>
            </div>
            <Separator className="bg-border" />
            {currentOrder.status !== OrderStatus.RequestingDriver &&
                currentOrder.status !== OrderStatus.Unassigned &&
                <>
                    <div className="space-y-5 px-4 py-5">
                        <p className="text-lg font-medium text-text-1">Driver Info</p>
                        <div className="flex items-start gap-2">

                            <Image src="/uber-icon.svg" alt="uber logo" className="bg-black rounded-[3px]"
                                width={24} height={24} />
                            <div>

                                <p className="text-md font-medium text-text-1">Esther Howard</p>
                                <p className="text-sm text-text-1 font-normal">(308) 555-0121</p>
                            </div>
                        </div>
                    </div>
                    <Separator className="bg-border" />
                </>
            }
            <OrderTimeline status={currentOrder.status} />
            <Separator className="bg-border" />
            <div className="space-y-5 px-4 py-5">
                <h2 className="text-lg font-medium text-text-1">Delivery Charge Summary</h2>
                <div className="space-y-4">
                    <div className="flex justify-between font-regular w-full text-sm text-text-2">
                        <span>Dispatch Fee</span>
                        <span>${'0.00'}</span>
                    </div>
                    <div className="flex justify-between font-regular w-full text-sm text-text-2">
                        <span>Driver Tip</span>
                        <span>${'0.00'}</span>
                    </div>
                </div>
                <Separator className="bg-border" />
                <div className="flex justify-between w-full font-medium text-text-1">
                    <span className="text-lg font-medium text-text-1">Total</span>
                    <span className="text-lg font-medium text-text-1">
                        ${((currentOrder.items?.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0) || 0) +
                            (Number(currentOrder.deliveryFee) || 0) +
                            (Number(currentOrder.tipAmount) || 0)).toFixed(2)}
                    </span>
                </div>
            </div>
            <Separator className="bg-border" />
            <p className="py-3 flex justify-center items-center text-xs text-text-1 font-normal text-center gap-1">Powered By
                <Image src="/Logo_UberDirect.svg" alt="uber direact logo" className="cursor-pointer"

                    width={64} height={32} />
            </p>
        </>
    )
}
