import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Timer } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { formatUTCLocal } from '@/lib/timezone'
import OrderStatusBadge from './orderStatusBadge'
import { Order, OrderStatus } from '@/lib/types/order'

export default function OrderCard({ order, i, onOrderAction }: { order: Order, i: number, onOrderAction: () => void }) {
    const router = useRouter()
    const [timeDisplay, setTimeDisplay] = useState<string>('-')

    useEffect(() => {
        const updateTime = () => {
            if (order.estimatedDeliveryTime) {
                const diffMs = Date.now() - new Date(order.estimatedDeliveryTime).getTime()
                const mins = Math.floor(Math.abs(diffMs) / 60000)

                setTimeDisplay(
                    diffMs >= 0
                        ? `${mins} min ago`
                        : `${mins} min`
                )
            } else {
                setTimeDisplay('-')
            }
        }

        updateTime()
    }, [order.estimatedDeliveryTime])

    return (
        <Card key={i} className="border-border overflow-hidden gap-2 space-y-1 cursor-pointer" onClick={() => router.push(`/fleet/orders/${order.id}?from=orders`)}>
            <CardHeader className="px-4">
                <div className="flex justify-start">
                    <OrderStatusBadge order={order} />
                </div>
            </CardHeader>
            <CardContent className="space-y-5 text-text-1 px-4">
                <div className="grid grid-cols-2 gap-4">

                    <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase text-icon">Order ID</p>
                        <p className="text-sm font-normal text-text-1 ">
                            #{order.orderNumber && order.orderNumber.length > 15 ? order.orderNumber.slice(0, 15) + '...' : order.orderNumber}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase text-icon">Customer Name</p>
                        <p className="text-sm font-normal text-text-1 ">
                            {order.customerName && order.customerName.length > 15 ? order.customerName.slice(0, 15) + '...' : order.customerName}
                        </p>
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-semibold uppercase text-icon tracking-wider">Delivery Address</p>
                    <p className="text-sm font-normal text-text-1 h-7">
                        {order.deliveryAddress?.address && order.deliveryAddress.address.length > 50
                            ? order.deliveryAddress.address.slice(0, 50) + '...' : order.deliveryAddress?.address}
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase text-icon tracking-wider">Created</p>
                        <p className="text-sm font-normal text-text-1">{order.createdAt && formatUTCLocal(order.createdAt, {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        })}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase text-icon tracking-wider">Est. Delivery</p>
                        <div className="flex items-center gap-1.5 text-sm font-normal text-text-1">
                            <Timer className="h-4 w-4 text-icon" />
                            <span>{order.status !== OrderStatus.Delivered ? timeDisplay : 'Delivered'}</span>
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-semibold uppercase text-icon">Subtotal</p>
                        <p className="text-text-1 font-normal text-sm"><span className="mr-0.5">+</span>${order.customerSubTotal?.toString()}</p>
                    </div>
                </div>
            </CardContent>
            <hr className="border-border" />
            <div className='px-4 space-y-5'>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase text-icon">Cst. D Fee</p>
                        <p className="text-text-1 font-normal text-sm"><span className="mr-0.5">+</span>${order.customerDeliveryFee?.toString()}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase text-icon">Cst. Tip</p>
                        <p className="text-text-1 font-normal text-sm"><span className="mr-0.5">+</span>${order.customerTip?.toString()}</p>
                    </div>
                </div>
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        onOrderAction();
                    }}
                    className={`w-full font-medium 
                    ${order.status === OrderStatus.Unassigned || (order.status === OrderStatus.Scheduled && !order.providerDeliveryId) ? "bg-primary" : "bg-white border border-border text-text-sidebar hover:bg-white/50"}`}>
                    {order.status === OrderStatus.Unassigned || (order.status === OrderStatus.Scheduled && !order.providerDeliveryId) ? "Assign" :
                        order.status.startsWith(OrderStatus.RequestingDriver)
                            || order.status === OrderStatus.Delivered || order.status === OrderStatus.Scheduled ? "View Order" :
                            "Track Order"}
                </Button>
            </div>
        </Card>
    )
}

