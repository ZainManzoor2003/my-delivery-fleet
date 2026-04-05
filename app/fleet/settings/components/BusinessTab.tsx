'use client'

import { useGetBusinessByUserId, useUpdateBusiness } from '@/app/hooks/useBusiness';
import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import { Formik, Form } from 'formik';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Address from '@/components/address';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { businessUpdateSchema } from '@/validations/validations';
import { BusinessType } from '@/lib/enums/businessType';
import { useUserStore } from '@/app/stores/userStore';

interface BusinessFormValues {
    businessName: string;
    phone: string;
    pickupInstructions: string;
    address: string;
    street: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
    businessType: string;
    phoneNumber?: string;
}

export default function BusinessTab() {
    const { userId } = useAuth();
    const { setUser } = useUserStore();
    const { data: business, isLoading, error, refetch } = useGetBusinessByUserId(userId || null);
    const updateBusiness = useUpdateBusiness();
    const [isSaving, setIsSaving] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const initialValues: BusinessFormValues = {
        businessName: business?.name || '',
        phone: business?.phone || '',
        phoneNumber: business?.phone || '',
        pickupInstructions: business?.pickupInstructions || '',
        address: business?.address?.address || '',
        street: business?.address?.street || '',
        apartment: business?.address?.apartment || '',
        city: business?.address?.city || '',
        state: business?.address?.state || '',
        postalCode: business?.address?.postalCode || '',
        latitude: business?.address?.latitude ? Number(business.address.latitude) : undefined,
        longitude: business?.address?.longitude ? Number(business.address.longitude) : undefined,
        businessType: business?.type || BusinessType.RESTAURANT,
    };



    const handleLocationSelect = (location: any, setValues: any) => {
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

    const handleSubmit = async (values: BusinessFormValues) => {
        if (!business?.id) {
            toast.error('Business information not found');
            return;
        }

        try {
            setIsSaving(true);
            const updatedBusiness = await updateBusiness.mutateAsync({
                businessId: business.id,
                data: {
                    name: values.businessName,
                    phone: values.phone,
                    pickupInstructions: values.pickupInstructions,
                    type: values.businessType,
                    address: {
                        address: values.address,
                        street: values.street,
                        apartment: values.apartment || null,
                        city: values.city,
                        state: values.state,
                        postalCode: values.postalCode,
                        latitude: values.latitude ? parseFloat(values.latitude.toString()) : null,
                        longitude: values.longitude ? parseFloat(values.longitude.toString()) : null,
                    },
                },
            });

            toast.success('Business information updated successfully');
            refetch();
            if (updatedBusiness?.address) {
                setUser({ businessAddress: updatedBusiness.address, businessName: updatedBusiness.name });
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
            toast.error(errorMessage);
            console.error('Error updating business:', err);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-2 px-4 pt-4">
                <h1 className="font-medium text-text-1 text-xl">Business Settings</h1>
                <p className="text-text-2 text-sm">Loading business information...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-2 px-4 pt-4">
                <h1 className="font-medium text-text-1 text-xl">Business</h1>
                <p className="text-red-500 text-sm">
                    Failed to load business information. Please try again later.
                </p>
            </div>
        );
    }

    if (!business) {
        return (
            <div className="space-y-2 px-4 pt-4">
                <h1 className="font-medium text-text-1 text-xl">Business</h1>
                <p className="text-text-2 text-sm">No business information found</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-2 px-4 pt-4">
                <h1 className="font-medium text-text-1 text-xl">Business</h1>
                <p className="text-text-2 font-normal text-lg">Update your business and delivery information</p>
            </div>

            <Formik
                initialValues={initialValues}
                validationSchema={businessUpdateSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ values, errors, setFieldValue, isValid, setValues }) => (
                    <Form
                        className="space-y-6"
                        onKeyDown={(e: React.KeyboardEvent) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        }}
                    >
                        {/* Business Information */}
                        <div className="bg-background px-4 space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="businessName" className="text-sm font-medium text-text-2 gap-0">
                                        Business Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="businessName"
                                        type="text"
                                        placeholder="Your restaurant name"
                                        value={values.businessName}
                                        onChange={(e) => {
                                            setFieldValue('businessName', e.target.value);
                                            setTouched({ ...touched, businessName: true });
                                        }}
                                        className={errors.businessName && touched.businessName ? 'border-red-500' : ''}
                                    />
                                    {touched.businessName && errors.businessName && (
                                        <span className="text-red-500 text-xs">{errors.businessName}</span>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="phone" className="text-sm font-medium text-text-2 gap-0">
                                        Phone Number <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="(555) 000-0000"
                                        value={values.phone}
                                        onChange={(e) => {
                                            setFieldValue('phone', e.target.value);
                                            setFieldValue('phoneNumber', e.target.value);
                                            setTouched({ ...touched, phoneNumber: true });
                                        }}
                                        className={errors.phoneNumber && touched.phoneNumber ? 'border-red-500' : ''}
                                    />
                                    {touched.phone && errors.phoneNumber && (
                                        <span className="text-red-500 text-xs">{errors.phoneNumber}</span>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="businessType" className="text-sm font-medium text-text-2 gap-0">
                                        Business Type <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        disabled={true}
                                        value={values.businessType}
                                        onValueChange={(val) => {
                                            setFieldValue('businessType', val);
                                            setTouched({ ...touched, businessType: true });
                                        }}
                                    >
                                        <SelectTrigger
                                            id="type"
                                            className={`w-full ${errors.businessType && touched.businessType ? 'border-red-500' : ''}`}
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={BusinessType.RESTAURANT}>Restaurant</SelectItem>
                                            <SelectItem value={BusinessType.RETAIL}>Retail</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {touched.businessType && errors.businessType && (
                                        <span className="text-red-500 text-xs">{errors.businessType}</span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="pickupInstructions" className="text-sm font-medium text-text-2 gap-0">
                                    Pickup Instructions (optional)
                                </Label>
                                <Textarea
                                    id="pickupInstructions"
                                    placeholder="e.g., Please ring the bell and wait at the door..."
                                    value={values.pickupInstructions}
                                    onChange={(e) => {
                                        setFieldValue('pickupInstructions', e.target.value);
                                        setTouched({ ...touched, pickupInstructions: true });
                                    }}
                                    className="min-h-24"
                                />
                                {touched.pickupInstructions && errors.pickupInstructions && (
                                    <span className="text-red-500 text-xs">{errors.pickupInstructions}</span>
                                )}
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
                                onChange={(field, value) => {
                                    setFieldValue(field, value);
                                    setTouched({ ...touched, [field]: true });
                                }}
                                errors={errors}
                                touched={touched}
                                addressLabel="Pickup Address"
                                enableAddressSearch={true}
                                onLocationSelect={(location) => handleLocationSelect(location, setValues)}
                            />

                        </div>
                        <div className="flex p-6 justify-end gap-3 border-t border-border pt-6">
                            <Button
                                type="submit"
                                disabled={isSaving || !isValid}
                                className="flex items-center gap-2"
                            >
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    );
}
