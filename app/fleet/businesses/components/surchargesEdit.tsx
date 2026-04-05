'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import DollarInput from '@/app/fleet/orders/components/dollarInput'
import { Business } from '@/lib/types/business'
import { Loader2, Settings2 } from 'lucide-react'
import { Decimal } from '@prisma/client/runtime/client'
import { useUpdateAdminBusiness } from '@/app/hooks/useBusiness'
import { toast } from 'react-toastify'
import { BusinessType } from '@/lib/enums/businessType'

interface SurchargesEditProps {
    business: Business
    hideSummary?: boolean
}

interface SurchargeField {
    key: keyof Business
    label: string
    description: string
}

function getSurchargeFields(businessType: string): SurchargeField[] {
    if (businessType === BusinessType.RESTAURANT) {
        return [
            { key: 'surchargeBaseQuote', label: 'Base Quote', description: 'Applied when Uber fee ≤ $5.25' },
            { key: 'surchargeExtendedQuote', label: 'Extended Quote', description: 'Applied when Uber fee > $5.25' },
            { key: 'surchargeCatering', label: 'Catering', description: 'Applied to all catering orders' },
        ]
    }
    if (businessType === BusinessType.RETAIL) {
        return [
            { key: 'surchargeRetail', label: 'Retail', description: 'Applied to all retail orders' },
        ]
    }
    return []
}

// Summary shown in the table cell
function SurchargeSummary({ business }: { business: Business }) {
    if (business.type === BusinessType.RETAIL) {
        return (
            <span className="text-xs text-text-2">
                Retail: <span className="text-text-1 font-medium">${Number(business.surchargeRetail ?? 0).toFixed(2)}</span>
            </span>
        )
    }
    if (business.type === BusinessType.RESTAURANT) {
        return (
            <div className="space-y-0.5">
                <div className="text-xs text-text-2">
                    Base: <span className="text-text-1 font-medium">${Number(business.surchargeBaseQuote ?? 0).toFixed(2)}</span>
                    <span className="mx-1.5 text-text-3">·</span>
                    Ext: <span className="text-text-1 font-medium">${Number(business.surchargeExtendedQuote ?? 0).toFixed(2)}</span>
                </div>
                <div className="text-xs text-text-2">
                    Catering: <span className="text-text-1 font-medium">${Number(business.surchargeCatering ?? 0).toFixed(2)}</span>
                </div>
            </div>
        )
    }
    return <span className="text-text-3 text-xs">—</span>
}

export default function SurchargesEdit({ business, hideSummary = false }: SurchargesEditProps) {
    const fields = getSurchargeFields(business.type)
    const [isOpen, setIsOpen] = useState(false)
    const [values, setValues] = useState<Record<string, string>>(() =>
        Object.fromEntries(fields.map(f => [f.key, Number(business[f.key] ?? 0).toFixed(2)]))
    )

    const updateMutation = useUpdateAdminBusiness()

    const handleSave = async () => {
        try {
            const data = Object.fromEntries(
                fields.map(f => [f.key, new Decimal(parseFloat(values[f.key] || '0'))])
            )
            await updateMutation.mutateAsync({ id: business.id, data })
            setIsOpen(false)
            toast.success('Surcharges updated')
        } catch (err: any) {
            toast.error(err.message || 'Failed to update surcharges')
        }
    }

    const handleClose = () => {
        setValues(Object.fromEntries(fields.map(f => [f.key, Number(business[f.key] ?? 0).toFixed(2)])))
        setIsOpen(false)
    }

    return (
        <>
            <div className="flex items-center gap-2">
                {!hideSummary && <SurchargeSummary business={business} />}
                {fields.length > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:bg-primary/10 h-7 w-7 p-0 shrink-0"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setIsOpen(true)
                        }}
                    >
                        <Settings2 className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>

            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-sm rounded-2xl p-0" onClick={(e) => e.stopPropagation()}>
                    <VisuallyHidden>
                        <DialogTitle>Edit Surcharges</DialogTitle>
                    </VisuallyHidden>

                    <div className="p-6 space-y-5">
                        {/* Header */}
                        <div>
                            <h2 className="text-base font-semibold text-text-1">Surcharge Settings</h2>
                            <p className="text-xs text-text-2 mt-0.5">{business.name}</p>
                        </div>

                        {/* Fields */}
                        <div className="space-y-4">
                            {fields.map(f => (
                                <div key={f.key as string}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div>
                                            <p className="text-sm font-medium text-text-1">{f.label}</p>
                                            <p className="text-xs text-text-3">{f.description}</p>
                                        </div>
                                    </div>
                                    <DollarInput
                                        value={values[f.key as string]}
                                        onChange={(val) => setValues(prev => ({ ...prev, [f.key as string]: val }))}
                                        error={undefined}
                                        touched={false}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={(e)=>{
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleClose()
                                }}
                                disabled={updateMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={(e)=>{
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleSave()
                                }}
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending
                                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
                                    : 'Save Changes'
                                }
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
