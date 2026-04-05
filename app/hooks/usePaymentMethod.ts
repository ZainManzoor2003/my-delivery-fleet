import type { PaymentMethodApiResponse } from '@/lib/types/paymentMethod';
import { useQuery } from '@tanstack/react-query';

export function useGetPaymentMethod(businessId: string | null) {
    return useQuery({
        queryKey: ['paymentMethod', businessId],
        queryFn: async () => {
            if (!businessId) {
                console.error('No business ID provided');
                return null;
            }
            const response = await fetch(`/api/payment-method?businessId=${businessId}`);
            const data: PaymentMethodApiResponse = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch payment method');
            }
            return data.paymentMethod;
        },
        enabled: !!businessId,
    });
}
