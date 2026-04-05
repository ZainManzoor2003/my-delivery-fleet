'use client'
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PaymentType } from "@/lib/enums/paymentType";
import { useUserStore } from "@/app/stores/userStore";
import { setAllOnboardingCookiesAction } from "@/lib/auth/onboarding-actions";
import Address from "@/components/address";
import { loadStripe } from '@stripe/stripe-js';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import {
    setupCardPayment,
    createFinancialConnectionsSession,
    completeFinancialConnections,
} from '@/services/paymentService';
import { toast } from "react-toastify";
import { paymentMethodSchema } from '@/validations/validations'
import { Formik, Form } from 'formik'
import { useRouter } from 'next/navigation'
import { TermsContent } from '@/app/fleet/components/TermsContent';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '14px',
            color: '#1a202c',
            '::placeholder': {
                color: '#a0aec0',
            },
            fontFamily: 'system-ui, -apple-system, sans-serif',
        },
        invalid: {
            color: '#e53e3e',
            iconColor: '#e53e3e',
        },
    },
    hidePostalCode: true,
};
export function PaymentDetails() {
    const router = useRouter();
    const stripe = useStripe();
    const elements = useElements();

    const [paymentMode, setPaymentMode] = useState<PaymentType>(PaymentType.ACH);
    const [paymentPermission, setPaymentPermission] = useState<boolean>(false);
    const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
    const [cardElementError, setCardElementError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false)

    const { businessId } = useUserStore();
    const businessIdFromStorage = typeof window !== 'undefined' ? localStorage.getItem('businessId') : null;
    const currentBusinessId = businessId || businessIdFromStorage;

    const handleLocationSelect = (location: {
        lat: number;
        lng: number;
        address: string;
        street: string;
        apartment?: string;
        city: string;
        state: string;
        postalCode: string;
    }, setValues: (values: any) => void) => {
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

    const handleFinancialConnections = async () => {
        if (!paymentPermission) {
            toast.warn('Please authorize ACH payments first');
            return;
        }


        if (!currentBusinessId) {
            toast.error('Business ID is missing');
            return;
        }

        setLoading(true);

        try {
            const sessionData = await createFinancialConnectionsSession({
                businessId: currentBusinessId,
            });

            if (!sessionData.success || !sessionData.clientSecret) {
                toast.error(sessionData.message || 'Failed to initialize bank connection');
                setLoading(false);
                return;
            }

            const stripeInstance = await stripePromise;

            if (!stripeInstance) {
                toast.error('Failed to load payment processor');
                setLoading(false);
                return;
            }

            const result = await stripeInstance.collectFinancialConnectionsAccounts({
                clientSecret: sessionData.clientSecret,
            });

            if (result.error) {
                toast.error('Bank connection failed: ' + result.error.message);
                setLoading(false);
                return;
            }

            const linkedAccounts = result.financialConnectionsSession?.accounts || [];

            if (linkedAccounts.length === 0) {
                toast.warn('No bank account was linked');
                setLoading(false);
                return;
            }

            const completeData = await completeFinancialConnections({
                businessId: currentBusinessId,
                customerId: sessionData.stripeCustomerId!,
                financialConnectionsAccountId: linkedAccounts[0].id,
                accountHolderName: "",
            });

            if (!completeData.success) {
                toast.error(completeData.message || 'Failed to complete bank setup');
                setLoading(false);
                return;
            }

            await setAllOnboardingCookiesAction({
                profileCompleted: true,
                businessSetup: true,
                paymentMethodSet: true
            });

            toast.success('Bank account verified successfully!');

            router.push('/account-under-review');

        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'message' in error) {
                toast.error('Error: ' + (error.message || 'Failed to connect bank account'));
            }
        } finally {
            setLoading(false);
        }
    };

    const savePaymentDetails = async (values: {
        address: string,
        street: string,
        apartment?: string,
        city: string,
        state: string,
        postalCode: string,
        latitude: number,
        longitude: number,
    },
        formikHelpers: { setSubmitting: (isSubmitting: boolean) => void }) => {
        if (!currentBusinessId) {
            toast.warn('Business ID is missing. Please complete business setup first.');
            formikHelpers.setSubmitting(false);
            return;
        }

        if (paymentMode === PaymentType.ACH) {
            await handleFinancialConnections();
            formikHelpers.setSubmitting(false);
            return;
        }

        setLoading(true);
        setCardElementError('');

        try {
            if (!stripe || !elements) {
                toast.error('Payment processor not ready. Please refresh the page.');
                setLoading(false);
                return;
            }

            const cardElement = elements.getElement(CardElement);

            if (!cardElement) {
                toast.error('Card input not found. Please refresh the page.');
                setLoading(false);
                return;
            }

            const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
                billing_details: {
                    address: {
                        line1: values.street,
                        line2: values.apartment || undefined,
                        city: values.city,
                        state: values.state,
                        postal_code: values.postalCode,
                        country: 'US',
                    },
                },
            });

            if (pmError) {
                setCardElementError(pmError.message || 'Card validation failed');
                setLoading(false);
                return;
            }

            if (!paymentMethod) {
                toast.error('Failed to create payment method');
                setLoading(false);
                return;
            }

            const result = await setupCardPayment({
                businessId: currentBusinessId,
                paymentMethodId: paymentMethod.id,
                billingAddress: {
                    address: values.address,
                    street: values.street,
                    apartment: values.apartment,
                    city: values.city,
                    state: values.state,
                    postalCode: values.postalCode,
                    latitude: values.latitude,
                    longitude: values.longitude,
                },
            });

            if (result.requiresAction && result.clientSecret) {
                const { setupIntent, error } = await stripe.confirmCardSetup(result.clientSecret);

                if (error) {
                    toast.error('Card verification failed: ' + error.message);
                    setLoading(false);
                    return;
                }

                if (setupIntent?.status === 'succeeded') {
                    result.success = true;
                    result.paymentMethodId = setupIntent.payment_method as string;
                }
            }

            if (result.success) {
                await setAllOnboardingCookiesAction({
                    profileCompleted: true,
                    businessSetup: true,
                    paymentMethodSet: true
                });

                toast.success('Card verified successfully!');
                cardElement.clear();

                router.push('/account-under-review');
            } else {
                toast.error('Failed to verify card: ' + result.message);
            }
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'message' in error) {
                toast.error('Error: ' + (error.message || 'Failed to verify card'));
            }
        } finally {
            formikHelpers.setSubmitting(false)
        }
    };

    if (!currentBusinessId) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-text-2">Loading business information...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {showTermsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-lg w-[50vw] h-[90vh] max-h-[90vh] flex flex-col shadow-xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                            <h2 className="text-lg font-semibold text-1">Terms & Conditions</h2>
                            <button
                                onClick={() => setShowTermsModal(false)}
                                className="text-gray-1 hover:text-text-2 transition-colors cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            <TermsContent />
                        </div>
                        <div className="shrink-0 border-t border-border px-5 py-4 bg-background">
                            <p className="text-xs font-semibold text-text-2 uppercase text-center mb-3">BY LOGGING INTO THE WEB APPLICATION OR UTILIZING THE SERVICES, YOU AGREE TO THESE TERMS IN FULL.</p>
                            <div className="flex justify-end">
                                <Button
                                    onClick={() => setShowTermsModal(false)}
                                    className="px-4 py-2 text-sm"
                                >
                                    I Understand
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center bg-background justify-around w-full mb-10 p-4 border-b border-b-border">
                <p className="text-xs font-medium text-text-2">Step 2 of 2</p>
                <div className="flex gap-2">
                    <div className="w-12 h-2 bg-[#3FC060] rounded" />
                    <div className="w-12 h-2 bg-[#3194EB] rounded" />
                </div>
            </div>
            <div className="flex flex-col items-center justify-center min-h-inherit p-4">
                <div className="min-w-xs sm:w-122 px-8 py-10 border-border bg-backgrouond 
                 border rounded-[20px] shadow-[0px_4px_12px_0px_#00000014]">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-text-1">
                            Billing setup
                        </h1>
                        <p className="text-text-2 text-md mt-1.5 font-medium">
                            Add a payment method to enable deliveries
                        </p>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-1 border-b border-b-border pb-5">
                            <Label className="text-sm font-medium text-text-2">
                                Payment method
                            </Label>
                            <div className="grid grid-cols-2 gap-3 mt-1">
                                <div
                                    className={`flex items-center justify-center h-9.5 py-1 px-4 rounded-lg border ${paymentMode === PaymentType.CARD
                                        ? 'border-border text-text-2'
                                        : 'border-[#3194EB] bg-[#F5FAFE] text-text-1'
                                        } dark:bg-muted cursor-pointer text-sm font-medium transition-all`}
                                    onClick={() => {
                                        if (!loading && paymentMode === PaymentType.CARD) {
                                            setPaymentMode(PaymentType.ACH)
                                            setPaymentPermission(false)
                                        }
                                    }}
                                >
                                    ACH Payment
                                </div>

                                <div
                                    className={`flex items-center justify-center h-9.5 py-1 px-4 rounded-lg border ${paymentMode === PaymentType.ACH
                                        ? 'border-border text-text-2'
                                        : 'border-[#3194EB] bg-[#F5FAFE] text-text-1'
                                        } text-sm font-medium transition-all dark:bg-muted cursor-pointer`}
                                    onClick={() => {
                                        if (!loading && paymentMode === PaymentType.ACH) {
                                            setPaymentMode(PaymentType.CARD)
                                            setPaymentPermission(false)
                                        }
                                    }}
                                >
                                    Credit Card
                                </div>
                            </div>
                            {paymentMode === PaymentType.CARD && (
                                <p className="text-xs text-text-2 mt-3">
                                    Credit Card payments are subject to 2.9% + 30¢ fee per billing transaction. Opt for ACH to avoid the additional fees
                                </p>
                            )}
                        </div>

                        <Formik
                            initialValues={{
                                address: '',
                                street: '',
                                apartment: '',
                                city: '',
                                state: '',
                                postalCode: '',
                                latitude: 0,
                                longitude: 0,
                            }}
                            validationSchema={paymentMethodSchema}
                            onSubmit={savePaymentDetails}
                        >
                            {({ values, handleSubmit, errors, touched, isSubmitting, setFieldValue, setValues }) => {
                                return (
                                    <Form onSubmit={handleSubmit} className="space-y-5">
                                        {paymentMode === PaymentType.CARD ? (
                                            <>
                                                <div className="space-y-1">
                                                    <Label className="text-sm font-medium text-text-2 gap-0">
                                                        Card Information<span className='text-red-500'>*</span>
                                                    </Label>
                                                    <div className="w-full px-3 py-2.5 rounded-md border border-border focus-within:ring-2 focus-within:ring-blue-500/20 bg-white">
                                                        <CardElement
                                                            options={CARD_ELEMENT_OPTIONS}
                                                            onChange={(e) => {
                                                                if (e.error) {
                                                                    setCardElementError(e.error.message);
                                                                } else {
                                                                    setCardElementError('');
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    {cardElementError && (
                                                        <p className="text-xs text-red-500 mt-1">{cardElementError}</p>
                                                    )}
                                                    <p className="text-xs text-text-2 mt-1">
                                                        🔒 Your card details are securely processed by Stripe
                                                    </p>
                                                </div>


                                                <div className="space-y-4 pt-2">
                                                    <Address
                                                        label="Billing Address"
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
                                                        onLocationSelect={(location) => handleLocationSelect(location, setValues)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-xs text-text-2">
                                                        Please review our terms and conditions before proceeding with your payment setup.
                                                    </p>
                                                    <div className="flex flex-col gap-3">
                                                        <Label className="flex items-center gap-2 text-sm text-text-2">
                                                            <Input
                                                                type="checkbox"
                                                                checked={paymentPermission}
                                                                onChange={(e) => setPaymentPermission(e.target.checked)}
                                                                className="h-5 w-5 rounded border border-gray-300 cursor-pointer appearance-none checked:bg-primary checked:border-primary checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMC42NjY3IDAuNUw0LjAwMDA0IDcuMTY2NjdMMS4zMzMzNyA0LjUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMS42NjY2NyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=')] checked:bg-center checked:bg-no-repeat"
                                                            />
                                                            <span className="text-sm font-normal">
                                                                I agree to the{' '}
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        setShowTermsModal(true);
                                                                    }}
                                                                    className="text-[#3194EB] hover:text-[#2576c4] underline font-medium transition-colors"
                                                                >
                                                                    User Agreement and Privacy Policy
                                                                </button>
                                                            </span>
                                                        </Label>
                                                    </div>
                                                </div>

                                                <div className="pt-4 flex justify-end">
                                                    <Button
                                                        type="submit"
                                                        disabled={
                                                            loading ||
                                                            isSubmitting ||
                                                            (!paymentPermission) ||
                                                            !currentBusinessId ||
                                                            !stripe
                                                        }
                                                        className="w-48 h-10 disabled:bg-[#E2E8F0] disabled:text-text-3 rounded-md font-medium text-sm transition-colors"
                                                    >
                                                        {isSubmitting ? 'Verifying...' : 'Confirm and Activate'}
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="space-y-2">
                                                    <p className="text-xs text-text-2">
                                                        Please review our terms and conditions before connecting your bank account.
                                                    </p>
                                                    <div className="flex flex-col gap-3">
                                                        <Label className="flex items-center gap-2 text-sm text-text-2">
                                                            <Input
                                                                type="checkbox"
                                                                checked={paymentPermission}
                                                                onChange={(e) => setPaymentPermission(e.target.checked)}
                                                                className="h-5 w-5 rounded border border-gray-300 cursor-pointer appearance-none checked:bg-primary checked:border-primary checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMC42NjY3IDAuNUw0LjAwMDA0IDcuMTY2NjdMMS4zMzMzNyA0LjUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMS42NjY2NyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=')] checked:bg-center checked:bg-no-repeat"
                                                            />
                                                            <span className="text-sm font-normal">
                                                                I agree to the{' '}
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        setShowTermsModal(true);
                                                                    }}
                                                                    className="text-[#3194EB] hover:text-[#2576c4] underline font-medium transition-colors"
                                                                >
                                                                    User Agreement and Privacy Policy
                                                                </button>
                                                            </span>
                                                        </Label>
                                                    </div>
                                                </div>

                                                <div className="pt-4">
                                                    <Button
                                                        onClick={handleFinancialConnections}
                                                        disabled={
                                                            loading ||
                                                            (!paymentPermission) ||
                                                            !currentBusinessId
                                                        }
                                                        className="w-full h-10 disabled:bg-[#E2E8F0] disabled:text-text-3 rounded-md font-medium text-sm transition-colors"
                                                    >
                                                        {loading ? 'Verifying...' : 'Connect Bank Account'}
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </Form>
                                )
                            }}
                        </Formik>
                    </div>
                </div >
            </div >
        </>
    );
}
