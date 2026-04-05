'use client'
import { useCreateBusiness } from "@/app/hooks/useBusiness"
import { useUserStore } from "@/app/stores/userStore"
import Address from "@/components/address"
import PhoneNumber from "@/components/phoneNumber"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { setBusinessSetupAction } from "@/lib/auth/onboarding-actions"
import { BusinessType } from "@/lib/enums/businessType"
import { S3Folder, s3Service } from "@/services/s3Service"
import { useAuth } from "@clerk/nextjs"
import { Loader2, Trash, Upload } from "lucide-react"
import { useState, ChangeEvent, useRef } from "react"
import { businessInformationSchema } from '@/validations/validations'
import { Formik, Form } from 'formik'
import Image from "next/image"
import { toast } from "react-toastify";

interface BusinessInformation {
    businessName: string;
    pickupInstructions?: string;
    phone: string;
    avgOrdersPerDay: string;
    deliveryRadius: string;
    businessType: string;
    address: string;
    street: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
}
interface BusinessInformationProps {
    onSuccess: () => void;
}

export function BusinessInformation({ onSuccess }: BusinessInformationProps) {
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [logoKey, setLogoKey] = useState<string>('')
    const [uploadingLogo, setUploadingLogo] = useState<boolean>(false)
    const [deletingLogo, setDeletingLogo] = useState<boolean>(false)

    const { setUser } = useUserStore();
    const createBusiness = useCreateBusiness();
    const { userId } = useAuth();

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleLocationSelect = (location: {
        lat: number;
        lng: number;
        address: string;
        street: string;
        apartment?: string;
        city: string;
        state: string;
        postalCode: string;
    },
        setValues: (values: any) => void) => {
        setValues((prev: any) => ({
            ...prev,
            address: location.address,
            street: location.street,
            apartment: location.apartment || '',
            city: location.city,
            state: location.state,
            postalCode: location.postalCode,
            latitude: location.lat,
            longitude: location.lng,
        }));
    };
    const handleImageChange = async (e: ChangeEvent<HTMLInputElement>,
        businessName: string,
        setFieldValue: (field: string, value: string) => void) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 1024 * 1024) {
            toast.warn('File size must not exceed 1MB')
            return
        }

        if (!file.type.startsWith('image/')) {
            toast.warn('Please upload an image file')
            return
        }

        setLogoPreview(URL.createObjectURL(file))

        setUploadingLogo(true)
        try {
            const uploadResult = await s3Service.upload({
                file: file,
                folder: S3Folder.BUSINESS_LOGOS,
                metadata: {
                    businessName: businessName || 'pending',
                    uploadedBy: userId || 'unknown',
                },
            });

            if (uploadResult.success && uploadResult.url && uploadResult.key) {
                setFieldValue('logoUrl', uploadResult.url)
                setLogoKey(uploadResult.key)
            } else {
                toast.error('Failed to upload logo. Please try again.')
                setLogoPreview(null)
            }
        } catch (error) {
            console.error('Error uploading logo:', error)
            toast.error('Failed to upload logo. Please try again.')
            setLogoPreview(null)
        } finally {
            setUploadingLogo(false)
        }
    }

    const handleRemoveImage = async (logoUrl: string, setFieldValue: (field: string, value: string) => void) => {
        if (logoUrl || logoKey) {
            setDeletingLogo(true)
            try {
                const deleteResult = await s3Service.delete({
                    key: logoKey,
                    url: logoUrl,
                });

                if (!deleteResult.success) {
                    console.error('Failed to delete logo:', deleteResult.error)
                    toast.error('Faild to remove logo. Please try again.')
                }
            } catch (error) {
                console.error('Error deleting logo:', error)
                toast.error('Failed to remove logo. Please try again.')
            } finally {
                setDeletingLogo(false)
            }
        }

        setLogoPreview(null)
        setFieldValue('logoUrl', '')
        setLogoKey('')

        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleContinue = async (
        values: {
            businessName: string,
            businessType: string,
            address: string,
            street: string,
            apartment?: string,
            city: string,
            state: string,
            postalCode: string,
            phoneNumber: string,
            pickupInstructions: string,
            avgOrdersPerDay: string,
            deliveryRadius: string
            latitude: number,
            longitude: number,
            logoUrl: string
        },
        formikHelpers: { setSubmitting: (isSubmitting: boolean) => void }
    ) => {
        if (!userId) {
            toast.error('User ID not found. Please sign in again.')
            return
        }
        try {
            const result = await createBusiness.mutateAsync({
                userId: userId,
                name: values.businessName,
                pickupInstructions: values.pickupInstructions,
                phone: values.phoneNumber,
                address: {
                    address: values.address,
                    street: values.street,
                    apartment: values.apartment,
                    city: values.city,
                    state: values.state,
                    postalCode: values.postalCode,
                    latitude: values.latitude,
                    longitude: values.longitude,
                },
                type: values.businessType,
                avgOrdersPerDay: parseInt(values.avgOrdersPerDay),
                deliveryRadius: parseFloat(values.deliveryRadius),
                logo: values.logoUrl,
            });

            if (result.success) {
                setUser({ businessId: result.business.id });
                localStorage.setItem('businessId', result.business.id);
                await setBusinessSetupAction(true);
                onSuccess();
            } else {
                toast.error('Failed to create business: ' + result.error)
            }
        } catch (error) {
            console.error('Error creating business:', error);
            toast.error('Faild to create the business. Please try again.');
        } finally {
            formikHelpers.setSubmitting(false)
        }
    }

    return (
        <>
            <div className="flex items-center bg-background justify-around w-full mb-10 p-4 border-b border-b-border">
                <p className="text-xs font-medium text-text-2 ">Step 1 of 2</p>
                <div className="flex gap-2">
                    <div className="w-12 h-2 bg-[#3194EB] rounded" />
                    <div className="w-12 h-2 bg-slate-100 rounded" />
                </div>
            </div>

            <div className="flex flex-col items-center justify-center min-h-inherit p-4">
                <div className="min-w-xs sm:w-122 px-8 py-10 border-border bg-backgrouond 
                 border rounded-[20px] shadow-[0px_4px_12px_0px_#00000014]">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-text-1 ">
                            Business information
                        </h1>
                        <p className="text-text-2 text-md mt-1.5">
                            Confirm where couriers will pick up orders
                        </p>
                    </div>
                    <Formik
                        initialValues={{
                            businessName: '',
                            pickupInstructions: '',
                            phoneNumber: '',
                            avgOrdersPerDay: '',
                            deliveryRadius: '',
                            businessType: '',
                            address: '',
                            street: '',
                            apartment: '',
                            city: '',
                            state: '',
                            postalCode: '',
                            latitude: 0,
                            longitude: 0,
                            logoUrl: '',
                        }}
                        validationSchema={businessInformationSchema}
                        onSubmit={handleContinue}
                    >
                        {({ values, handleChange, handleSubmit, errors, touched, isSubmitting, setFieldValue, setValues }) => (
                            <Form
                                onSubmit={handleSubmit}
                                onKeyDown={(e: React.KeyboardEvent) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }
                                }}
                                className="space-y-5">
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-text-2 gap-0">
                                        Business Name
                                        <span className='text-red-500'>*</span>
                                    </Label>
                                    <Input
                                        type="text"
                                        name="businessName"
                                        placeholder="Your business name"
                                        className={`h-10 placeholder:text-text-3 ${errors.businessName && touched.businessName ? 'border-red-500' : 'border-border'}`}
                                        value={values.businessName}
                                        onChange={handleChange}
                                    />
                                </div>

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
                                    errors={errors}
                                    touched={touched}
                                    addressLabel="Pickup Address"
                                    enableAddressSearch
                                    onLocationSelect={(location) => handleLocationSelect(location, setValues)}
                                />

                                <div className="space-y-1">
                                    <PhoneNumber label='Store Phone Number' phoneNumber={values.phoneNumber}
                                        onChange={(formattedValue: string) => setFieldValue('phoneNumber', formattedValue)}
                                        touched={touched} errors={errors} />
                                </div>

                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    <Label className="text-sm font-medium text-text-2 gap-0">Avg Delivery Orders Per Day<span className='text-red-500'>*</span></Label>
                                    <Label className="block text-sm font-medium text-text-2 gap-0">Typical Delivery Radius (Miles)<span className='text-red-500'>*</span></Label>
                                    <Input
                                        type="number"
                                        name="avgOrdersPerDay"
                                        placeholder="e.g. 25"
                                        className={`w-full h-10 placeholder:text-text-3 ${errors.avgOrdersPerDay && touched.avgOrdersPerDay ? 'border-red-500' : 'border-border'}`}
                                        value={values.avgOrdersPerDay}
                                        onChange={(e) => {
                                            const raw = e.target.value;
                                            if (raw.includes('.') || raw.includes('-')) return;
                                            if (raw === '' || Number(raw) <= 999) {
                                                handleChange(e);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === '-' || e.key === '.') e.preventDefault();
                                        }}
                                        min="0"
                                        max={999}
                                    />
                                    <Input
                                        type="number"
                                        name="deliveryRadius"
                                        placeholder="e.g. 5.5"
                                        className={`w-full h-10 placeholder:text-text-3 ${errors.deliveryRadius && touched.deliveryRadius ? 'border-red-500' : 'border-border'}`}
                                        value={values.deliveryRadius}
                                        onChange={(e) => {
                                            const raw = e.target.value;
                                            if (raw.includes('-')) return;

                                            if (raw.includes('.')) {
                                                const decimals = raw.split('.')[1];
                                                if (decimals && decimals.length > 1) return;
                                            }

                                            if (raw === '' || Number(raw) <= 999.99) {
                                                handleChange(e);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === '-') e.preventDefault();
                                        }}
                                        min="0"
                                        max={999.99}
                                        step={0.1}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-text-2 gap-0">Business Type<span className='text-red-500'>*</span></Label>
                                    <Select
                                        value={values.businessType}
                                        onValueChange={(value) => {
                                            setFieldValue('businessType', value);
                                        }}
                                    >
                                        <SelectTrigger className={`w-full text-text-1 ${errors.businessType && touched.businessType ? 'border-red-500' : 'border-border'}`}>
                                            <SelectValue placeholder="Select an Options" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={BusinessType.RESTAURANT}>Restaurant</SelectItem>
                                            <SelectItem value={BusinessType.RETAIL}>Retail</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-text-2">Pickup Instructions (optional)</Label>
                                    <Textarea
                                        name='pickupInstructions'
                                        placeholder="e.g. Go to the 'Delivery Orders' rack on the left side of the main counter and show your order code."
                                        className={`h-20 placeholder:text-text-3 ${errors.pickupInstructions && touched.pickupInstructions ? 'border-red-500' : 'border-border'}`}
                                        value={values.pickupInstructions}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-sm font-medium text-text-2">
                                        Business Logo (optional)
                                    </Label>
                                    <div className="border-2 border-dashed border-border rounded-lg p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-16 h-16">
                                                <Label className={`bg-[#F1F5F9] rounded-md w-full h-full flex items-center justify-center ${uploadingLogo || logoPreview ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => handleImageChange(e, values.businessName, setFieldValue)}
                                                        disabled={uploadingLogo || deletingLogo || !!logoPreview}
                                                    />

                                                    {uploadingLogo ? (
                                                        <Loader2 className="h-5 w-5 text-text-2 animate-spin" />
                                                    ) : logoPreview ? (
                                                        <Image
                                                            src={logoPreview}
                                                            alt="Logo preview"
                                                            className="w-full h-full object-cover rounded-md"
                                                            fill
                                                        />
                                                    ) : (
                                                        <Upload className="h-5 w-5 text-text-2" />
                                                    )}
                                                </Label>
                                            </div>
                                            <div className="flex flex-col justify-end">
                                                <p className="text-sm font-medium text-text-1">
                                                    {uploadingLogo ? 'Uploading...' : deletingLogo ? 'Deleting...' : 'Drag image or browse'}
                                                </p>
                                                <ul className="list-disc ml-4">
                                                    <li className="text-xs text-text-2">160 x 160 (1:1) recommended.</li>
                                                    <li className="text-xs text-text-2">1MB max file size.</li>
                                                </ul>
                                            </div>
                                        </div>

                                        {logoPreview && !uploadingLogo && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(values.logoUrl, setFieldValue)}
                                                disabled={deletingLogo}
                                                className="cursor-pointer w-8 h-8 flex justify-center items-center bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                            >
                                                {deletingLogo ? (
                                                    <Loader2 className="text-[#EA332D] animate-spin" width={16} height={16} />
                                                ) : (
                                                    <Trash className="text-[#EA332D]" width={16} height={16} />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        className="w-36 h-10 bg-muted text-text-2 hover:bg-muted font-medium border-none"
                                        disabled={isSubmitting || uploadingLogo || deletingLogo}
                                    >
                                        Save and Exit
                                    </Button>
                                    <Button
                                        disabled={isSubmitting || uploadingLogo || deletingLogo}
                                        type="submit"
                                        className="w-36 h-10 disabled:bg-[#E2E8F0] disabled:text-text-3 font-medium"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            'Continue'
                                        )}
                                    </Button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>
        </>
    );
}
