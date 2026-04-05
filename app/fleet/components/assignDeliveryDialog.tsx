'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Loader2, User2, MapPin } from 'lucide-react'
import { Order } from '@/lib/types/order'
import { useGetDeliveryQuote, useCreateOrderDelivery } from '@/app/hooks/useOrder'
import { useUserStore } from '@/app/stores/userStore'
import { toast } from 'react-toastify'
import Image from 'next/image'

interface Props {
    order: Order | null
    open: boolean
    onClose: () => void
}

export default function AssignDeliveryDialog({ order, open, onClose }: Props) {
    const { businessId } = useUserStore()
    const { mutateAsync: getQuote, isPending: isFetchingQuote } = useGetDeliveryQuote()
    const { mutateAsync: createDelivery, isPending: isCreating } = useCreateOrderDelivery()
    const [quote, setQuote] = useState<{ id: string; fee: number } | null>(null)
    const quoteFetchedRef = useRef(false)

    useEffect(() => {
        if (!open || quoteFetchedRef.current || !order || !businessId) return

        const addr = order.deliveryAddress
        if (!addr?.street || !addr?.city || !addr?.state || !addr?.postalCode) return

        quoteFetchedRef.current = true

        getQuote({
            businessId,
            deliveryAddress: {
                street: addr.street,
                apartment: addr.apartment ?? null,
                city: addr.city,
                state: addr.state,
                postalCode: addr.postalCode,
                latitude: addr.latitude ? Number(addr.latitude) : undefined,
                longitude: addr.longitude ? Number(addr.longitude) : undefined,
            },
            customerSubTotal: order.customerSubTotal?.toString(),
            driverTip: order.driverTip?.toString(),
            handoffType: order.handoffType,
            deliveryType: order.deliveryType,
        })
            .then((result) => setQuote({ id: result.quote.id, fee: result.quote.fee }))
            .catch((result) => {
                toast.error(result.message || 'Failed to fetch quote')
                setQuote(null)
            })
    }, [open, order, businessId, getQuote])

    const handleCreateDelivery = async () => {
        if (!order?.id || !businessId) return
        try {
            await createDelivery({ orderId: order.id, businessId, quoteId: quote?.id })
            toast.success('Delivery created successfully')
            onClose()
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to create delivery'
            toast.error(msg)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => {
            if (!v) {
                setQuote(null)
                quoteFetchedRef.current = false
                onClose()
            }
        }}>
            <DialogContent className="md:min-w-lg max-h-[95vh] overflow-y-auto rounded-3xl p-0">
                <VisuallyHidden>
                    <DialogTitle>Assign Delivery</DialogTitle>
                </VisuallyHidden>
                <div className="p-6 space-y-5">
                    <div>
                        <h2 className="text-lg font-medium text-text-sidebar">Assign Delivery</h2>
                        {order?.orderNumber && (
                            <p className="text-sm text-text-2 mt-0.5">Order #{order.orderNumber}</p>
                        )}
                    </div>
                    <div className="border border-border rounded-4xl p-5 space-y-4 bg-background">
                        <div className="flex gap-3">
                            <User2 className="h-5 w-5 text-icon mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs font-semibold uppercase text-icon tracking-wide">Customer</p>
                                <p className="text-sm font-medium text-text-1 mt-1">{order?.customerName || '—'}</p>
                                <p className="text-sm text-text-2">{order?.customerPhone || '—'}</p>
                                {order?.customerEmail && (
                                    <p className="text-sm text-text-2">{order.customerEmail}</p>
                                )}
                            </div>
                        </div>

                        <Separator className="bg-border" />

                        <div className="flex gap-3">
                            <MapPin className="h-5 w-5 text-icon mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs font-semibold uppercase text-icon tracking-wide">Delivery Address</p>
                                <p className="text-sm text-text-1 mt-1">{order?.deliveryAddress?.address || '—'}</p>
                                {order?.deliveryInstruction && (
                                    <p className="text-sm text-text-2 mt-1">
                                        <span className="font-medium">Note: </span>
                                        {order.deliveryInstruction}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-text-1">Delivery Charge Summary</h3>
                            {isFetchingQuote && (
                                <span className="flex items-center gap-1.5 text-xs text-text-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Fetching quote…
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 px-3 py-3 items-center">
                            <span className="text-sm text-text-2">Dispatch Fee</span>
                            <span className="text-sm text-text-2 text-right">
                                {isFetchingQuote
                                    ? <Loader2 className="w-4 h-4 animate-spin inline" />
                                    : quote ? `$${quote.fee.toFixed(2)}` : '—'}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 px-3 py-3 items-center">
                            <span className="text-sm text-text-2">Driver Tip</span>
                            <span className="text-sm text-text-2 text-right">
                                ${(Number(order?.totalTip) || 0).toFixed(2)}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 p-3 bg-[#F1F5F9] rounded-xl items-center">
                            <span className="text-sm font-medium text-text-1">Total</span>
                            <span className="text-sm font-medium text-text-1 text-right">
                                {isFetchingQuote
                                    ? <Loader2 className="w-4 h-4 animate-spin inline" />
                                    : `$${((quote?.fee || 0) + (Number(order?.totalTip) || 0)).toFixed(2)}`}
                            </span>
                        </div>
                    </div>
                    <p className="flex justify-center items-center text-xs text-text-1 font-normal text-center gap-0">Powered By
                        <Image src="/Uber_Logo.png" alt="uber direact logo" className="-ml-1 cursor-pointer"
                            width={48} height={32} />
                    </p>
                    <div className="flex justify-end items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isCreating}
                            className="h-10"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateDelivery}
                            disabled={isCreating || isFetchingQuote || !quote?.fee}
                            className="h-10"
                        >
                            {isCreating ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Delivery…</>
                            ) : 'Create Delivery'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
