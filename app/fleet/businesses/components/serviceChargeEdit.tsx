'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import DollarInput from '@/app/fleet/orders/components/dollarInput'
import { Business } from '@/lib/types/business'
import { Loader2, Check, X, Edit2 } from 'lucide-react'
import { Decimal } from '@prisma/client/runtime/client'
import { useUpdateAdminBusiness } from '@/app/hooks/useBusiness'
import { toast } from 'react-toastify'

interface ServiceChargeEditProps {
    business: Business
}

export default function ServiceChargeEdit({ business }: ServiceChargeEditProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [serviceCharge, setServiceCharge] = useState<string>(
        business.serviceChargePerOrder ? Number(business.serviceChargePerOrder).toString() : '2.75'
    )
    const [error, setError] = useState<string>('')

    const updateBusinessMutation = useUpdateAdminBusiness()

    const handleEdit = () => {
        setIsEditing(true)
        setServiceCharge(business.serviceChargePerOrder ? Number(business.serviceChargePerOrder).toString() : '2.75')
        setError('')
    }

    const handleCancel = () => {
        setIsEditing(false)
        setError('')
        setServiceCharge(business.serviceChargePerOrder ? Number(business.serviceChargePerOrder).toString() : '2.75')
    }

    const handleSave = async () => {
        setError('')

        try {
            await updateBusinessMutation.mutateAsync({
                id: business.id,
                data: {
                    serviceChargePerOrder: new Decimal(parseFloat(serviceCharge))
                }
            })
            setIsEditing(false)
            toast.success('Service fee updated successfully')
        } catch (err: any) {
            setError(err.message || 'Failed to update service charge')
            toast.error('Failed to update service fee')
        }
    }

    if (isEditing) {
        return (
            <div className="flex items-start gap-1">
                <div className="flex-1">
                    <DollarInput
                        value={serviceCharge}
                        onChange={(value) => setServiceCharge(value)}
                        error={undefined}
                        touched={false}
                        autoFocus={true}
                    />
                    {error && (
                        <p className="text-xs text-red-500 mt-1">{error}</p>
                    )}
                </div>
                <div className="flex gap-1 mt-1">
                    <Button
                        size="sm"
                        className="h-7 w-7 p-0 text-green-600 bg-gray-200 hover:bg-green-50 border-green-200"
                        onClick={handleSave}
                        disabled={updateBusinessMutation.isPending}
                    >
                        {updateBusinessMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-red-600 bg-gray-200 hover:bg-red-50"
                        onClick={handleCancel}
                        disabled={updateBusinessMutation.isPending}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-right">
                {business.serviceChargePerOrder ? `$${Number(business.serviceChargePerOrder).toFixed(2)}` : '-'}
            </span>
            <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:bg-primary/10 h-7 w-7 p-0"
                onClick={handleEdit}
            >
                <Edit2 className="h-3 w-3" />
            </Button>
        </div>
    )
}
