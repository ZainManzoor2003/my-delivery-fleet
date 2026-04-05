'use client'
import OrderDetails from '../../components/orderDetails'
import { useGetOrder } from '@/app/hooks/useOrder'
import { Button } from '@/components/ui/button'
import { useParams } from 'next/navigation'
import { Loader } from '@/app/components/loader'

export default function Page() {
    const params = useParams()
    const orderId = params?.id as string
    const { data: orderData, isLoading, error } = useGetOrder(orderId)
    if (isLoading) {
        return (
            <Loader
                fullScreen
                label='Loading order details...'
            />
        );
    }

    if (error || !orderData?.success || !orderData?.order) {
        return (
            <div className="min-h-screen py-5 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">
                        {error?.message || 'Failed to load order details'}
                    </p>
                    <Button onClick={() => window.history.back()} variant="outline">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <OrderDetails order={orderData.order} />
    )
}
