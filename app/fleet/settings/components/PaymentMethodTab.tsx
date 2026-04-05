'use client'
import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGetBusinessByUserId } from '@/app/hooks/useBusiness';
import type { PaymentMethodDetails } from '@/lib/types/paymentMethod';
import { UpdatePaymentMethodForm } from './UpdatePaymentMethodForm';
import { PaymentType } from '@/lib/enums/paymentType';
import { useQueryClient } from '@tanstack/react-query';
import { useGetPaymentMethod } from '@/app/hooks/usePaymentMethod';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CurrentPaymentMethodCard({ paymentMethod }: { paymentMethod: PaymentMethodDetails }) {
    const isCard = paymentMethod.paymentType === PaymentType.CARD;

    const title = isCard
        ? `Card ending in ${paymentMethod.cardLast4 ?? '••••'}`
        : `${paymentMethod.achBankName ?? 'Bank account'} ending in ${paymentMethod.achAccountLast4 ?? '••••'}`;

    const subtitle = isCard
        ? paymentMethod.cardExpMonth && paymentMethod.cardExpYear
            ? `Expires ${String(paymentMethod.cardExpMonth).padStart(2, '0')}/${paymentMethod.cardExpYear}`
            : null
        : paymentMethod.achAccountType
            ? `${paymentMethod.achAccountType.charAt(0).toUpperCase() + paymentMethod.achAccountType.slice(1)} account`
            : null;

    return (
        <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3.5">
            <div className="space-y-0.5">
                <p className="text-sm font-semibold text-text-1">{title}</p>
                {subtitle && <p className="text-xs text-text-2">{subtitle}</p>}
            </div>
            <span className="text-xs font-medium text-[#3194EB] border border-[#3194EB] rounded-full px-2.5 py-0.5">
                ACTIVE
            </span>
        </div>
    );
}

export default function PaymentMethodTab() {
    const { userId } = useAuth();
    const queryClient = useQueryClient();
    const [showUpdateForm, setShowUpdateForm] = useState(false);

    const { data: business, isLoading: businessLoading } = useGetBusinessByUserId(userId ?? null);
    const businessId = business?.id ?? null;

    const {
        data: paymentMethod,
        isLoading: pmLoading,
        refetch: refetchPaymentMethod,
    } = useGetPaymentMethod(businessId);

    const isLoading = businessLoading || pmLoading;

    const handleSuccess = () => {
        setShowUpdateForm(false);
        refetchPaymentMethod();
        queryClient.invalidateQueries({ queryKey: ['paymentMethod', businessId] });
    };

    if (isLoading) {
        return (
            <div className="px-4 pt-6 flex items-center gap-2 text-text-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading payment method...</span>
            </div>
        );
    }

    return (
        <div className="px-4 pt-5 pb-6 space-y-4 max-w-lg">
            <p className="text-base font-semibold text-text-1">Payment Method</p>

            {paymentMethod ? (
                <CurrentPaymentMethodCard paymentMethod={paymentMethod} />
            ) : (
                <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
                    <p className="text-sm text-text-2">No payment method on file.</p>
                </div>
            )}

            {!showUpdateForm && (
                <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => setShowUpdateForm(true)}>
                        Update Payment Method
                    </Button>
                </div>
            )}

            {showUpdateForm && businessId && (
                <div className="rounded-xl border border-border p-4 space-y-1">
                    <p className="text-sm font-medium text-text-1">
                        {paymentMethod ? 'Update Payment Method' : 'Add Payment Method'}
                    </p>
                    <p className="text-xs text-text-2">Your new payment method will replace the existing one.</p>
                    <Elements stripe={stripePromise}>
                        <UpdatePaymentMethodForm
                            businessId={businessId}
                            existingBillingAddress={paymentMethod?.paymentType === PaymentType.CARD ? paymentMethod?.billingAddress ?? null : null}
                            onSuccess={handleSuccess}
                            onCancel={() => setShowUpdateForm(false)}
                        />
                    </Elements>
                </div>
            )}
        </div>
    );
}
