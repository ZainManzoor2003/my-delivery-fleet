'use client';

import { signUpSchema } from '@/validations/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, Formik } from 'formik';
import { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'react-toastify';
import PhoneNumber from '@/components/phoneNumber';

export default function PersonalInformationTab() {
    const { user } = useUser();
    const [isSaving, setIsSaving] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [showLoadError, setShowLoadError] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (!user) {
                setShowLoadError(true);
            }
        }, 5000); // 5 seconds timeout

        return () => clearTimeout(timeout);
    }, [user]);

    if (!user) {
        if (showLoadError) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                        <p className="text-text-2 text-sm">Failed to load information, please refresh the page</p>
                        <Button
                            onClick={() => window.location.reload()}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh Page
                        </Button>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="text-text-2 text-sm">Loading personal information...</p>
                </div>
            </div>
        );
    }

    const initialValues = {
        firstName: user.firstName || user.unsafeMetadata?.firstName?.toString() || '',
        lastName: user.lastName || user.unsafeMetadata?.lastName?.toString() || '',
        email: user.emailAddresses?.[0]?.emailAddress.toString() || '',
        phoneNumber: user.phoneNumbers?.[0]?.phoneNumber.toString() || user.unsafeMetadata?.phoneNumber?.toString() || '',
    };

    const handleSubmit = async (values: typeof initialValues) => {
        setIsSaving(true);
        try {
            await user?.update({
                firstName: values.firstName,
                lastName: values.lastName,
                unsafeMetadata: {
                    phoneNumber: values.phoneNumber
                }
            })
                .then(() => {
                    toast.success('Personal information updated successfully!');
                    setTouched({});
                })
                .catch((err) => {
                    console.error('error', err.errors?.[0]?.longMessage || err.message);
                    const errorMessage = err.errors?.[0]?.longMessage || err.message || 'Failed to update personal information';
                    toast.error(errorMessage);
                });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <Formik
                initialValues={initialValues}
                validationSchema={signUpSchema.omit(['email'])}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ values, errors, setFieldValue, isValid }) => (
                    <Form className="space-y-6">
                        <div className="bg-background py-6 px-4 border-t border-border space-y-4">

                            <div className="grid grid-cols-1 gap-4 w-2/3">
                                {/* First Name */}
                                <div className="space-y-1">
                                    <Label htmlFor="firstName" className="text-sm font-medium text-text-2 gap-0">
                                        First Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="firstName"
                                        type="text"
                                        placeholder="John"
                                        value={values.firstName}
                                        onChange={(e) => {
                                            setFieldValue('firstName', e.target.value);
                                            setTouched({ ...touched, firstName: true });
                                        }}
                                        className={errors.firstName && touched.firstName ? 'border-red-500' : ''}
                                    />
                                    {touched.firstName && errors.firstName && (
                                        <span className="text-red-500 text-xs">{errors.firstName}</span>
                                    )}
                                </div>

                                {/* Last Name */}
                                <div className="space-y-1">
                                    <Label htmlFor="lastName" className="text-sm font-medium text-text-2 gap-0">
                                        Last Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="lastName"
                                        type="text"
                                        placeholder="Doe"
                                        value={values.lastName}
                                        onChange={(e) => {
                                            setFieldValue('lastName', e.target.value);
                                            setTouched({ ...touched, lastName: true });
                                        }}
                                        className={errors.lastName && touched.lastName ? 'border-red-500' : ''}
                                    />
                                    {touched.lastName && errors.lastName && (
                                        <span className="text-red-500 text-xs">{errors.lastName}</span>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-1">
                                    <Label htmlFor="email" className="text-sm font-medium text-text-2 gap-0">
                                        Email <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        disabled={true}
                                        placeholder="john@example.com"
                                        value={values.email}
                                        className="bg-muted cursor-not-allowed"
                                    />
                                </div>

                                {/* Phone Number */}
                                <div className="space-y-1">
                                    <PhoneNumber label='Phone Number' phoneNumber={values.phoneNumber}
                                        onChange={(formattedValue: string) => setFieldValue('phoneNumber', formattedValue)}
                                        touched={touched} errors={errors} />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
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
