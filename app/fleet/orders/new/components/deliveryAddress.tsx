
import Address from "@/components/address";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HandoffType } from "@/lib/types/order";

interface DeliveryInfo {
    address: string
    street: string
    apartment?: string
    city: string
    state: string
    postalCode: string
    latitude?: number
    longitude?: number
    handoffType: HandoffType | null
    deliveryInstruction: string
}
interface ValidationErrors {
    address?: string | boolean
    street?: string | boolean
    apartment?: string | boolean
    city?: string | boolean
    state?: string | boolean
    postalCode?: string | boolean
    handoffType?: string | boolean
    deliveryInstruction?: string | boolean
}
interface Props {
    values: DeliveryInfo
    onChange: (field: string, value: string) => void
    touched: ValidationErrors
    errors: ValidationErrors
    setFieldValue: (field: string, value: string) => void
    handleLocationSelect: (location: {
        lat: number
        lng: number
        address: string
        street: string
        apartment?: string
        city: string
        state: string
        postalCode: string
    }) => void
}

export default function DeliveryAddress({ values, touched, errors, onChange, setFieldValue, handleLocationSelect }: Props) {
    return (
        <div className="space-y-7">
            <h2 className="text-lg font-medium text-text-1">Delivery Address & Preferences</h2>
            <div className="space-y-5">
                <Address
                    addressInfo={{
                        address: values.address,
                        street: values.street,
                        apartment: values.apartment,
                        city: values.city,
                        state: values.state,
                        postalCode: values.postalCode,
                        latitude: values.latitude,
                        longitude: values.longitude,
                    }}
                    onChange={(field, value) =>
                        setFieldValue(field, value)
                    }
                    enableAddressSearch
                    errors={errors}
                    touched={touched}
                    onLocationSelect={handleLocationSelect}
                />
                <div className="space-y-1">
                    <Label className="text-sm font-medium text-text-2 gap-0">Handoff Type<span className='text-red-500'>*</span></Label>
                    <Select
                        value={values.handoffType ?? undefined}
                        onValueChange={(value) => {
                            setFieldValue('handoffType', value);
                        }}
                    >
                        <SelectTrigger className={`w-full text-text-1 ${errors.handoffType && touched.handoffType ? 'border-red-500' : 'border-border'}`}>
                            <SelectValue placeholder="Select an Options" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={HandoffType.MEET_AT_DOOR}>Meet at door</SelectItem>
                            <SelectItem value={HandoffType.LEAVE_AT_DOOR}>Leave at door</SelectItem>
                        </SelectContent>
                    </Select>
                    {touched.handoffType && errors.handoffType && <span className='text-red-500 text-xs'>{errors.handoffType}</span>}
                </div>
                <div className="space-y-1">
                    <Label className="text-sm font-medium text-text-2">Delivery Instructions (optional)</Label>
                    <Textarea
                        placeholder="e.g. Ring doorbell twice, leave at door"
                        name='deliveryInstruction'
                        className={`h-30 placeholder:text-text-3 active:border-primary
                                                         ${errors.deliveryInstruction && touched.deliveryInstruction ? 'border-red-500' : 'border-border'}`}
                        value={values.deliveryInstruction}
                        onChange={(e) => onChange('deliveryInstruction', e.target.value)} />
                    {touched.deliveryInstruction && errors.deliveryInstruction && <span className='text-red-500 text-xs'>{errors.deliveryInstruction}</span>}
                </div>
            </div>
        </div>
    )
}
