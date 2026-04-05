import PhoneNumber from '@/components/phoneNumber'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CustomerInfo {
    orderNumber: string
    customerName: string
    phoneNumber: string
    customerEmail: string
}
interface ValidationErrors {
    orderNumber?: string | boolean
    customerName?: string | boolean
    phoneNumber?: string | boolean
    customerEmail?: string | boolean
}
interface Props {
    values: CustomerInfo
    onChange: (field: string, value: string) => void
    touched: ValidationErrors
    errors: ValidationErrors
    setFieldValue: (field: string, value: string) => void
}

export default function CustomerInfo({ values, touched, errors, onChange, setFieldValue }: Props) {
    return (
        <div className="space-y-7">
            <h2 className="text-lg font-medium text-text-1">Customer Information</h2>
            <div className="space-y-5">
                <div className="space-y-1">
                    <Label className="text-sm font-medium text-text-2">Order #</Label>
                    <Input placeholder="e.g. 1234"
                        name='orderNumber'
                        className={`h-10 placeholder:text-text-3 active:border-primary
                        ${errors.orderNumber && touched.orderNumber ? 'border-red-500' : 'border-border'}`}
                        value={values.orderNumber}
                        onChange={(e) => onChange('orderNumber', e.target.value)} />
                    {touched.orderNumber && errors.orderNumber && <span className='text-red-500 text-xs'>{errors.orderNumber}</span>}
                </div>
                <div className="space-y-1">
                    <Label className="text-sm font-medium text-text-2 gap-0">Customer Name <span className='text-red-500'>*</span></Label>
                    <Input placeholder="e.g. Jane Doe"
                        name='customerName'
                        className={`h-10 placeholder:text-text-3 active:border-primary
                        ${errors.customerName && touched.customerName ? 'border-red-500' : 'border-border'}`}
                        value={values.customerName}
                        onChange={(e) => onChange('customerName', e.target.value)} />
                    {touched.customerName && errors.customerName && <span className='text-red-500 text-xs'>{errors.customerName}</span>}
                </div>
                <div className="space-y-1">
                    <PhoneNumber label='Customer Phone' phoneNumber={values.phoneNumber}
                        onChange={(formattedValue: string) => setFieldValue('phoneNumber', formattedValue)}
                        touched={touched} errors={errors} />
                </div>
                <div className="space-y-1">
                    <Label className="text-sm font-medium text-text-2">Customer Email (optional)</Label>
                    <Input placeholder="you@company.com"
                        name='customerEmail'
                        className={`h-10 placeholder:text-text-3 active:border-primary
                        ${errors.customerEmail && touched.customerEmail ? 'border-red-500' : 'border-border'}`}
                        value={values.customerEmail}
                        onChange={(e) => onChange('customerEmail', e.target.value)} />
                </div>
            </div>
        </div>
    )
}
