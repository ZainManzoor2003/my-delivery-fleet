'use client'
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Invoice } from '@/lib/types/invoice';

interface UseGetInvoicesParams {
    limit?: number;
    minimal?: boolean;
}

interface InvoicesResponse {
    invoices: Invoice[];
    pagination: {
        hasMore: boolean;
        totalCount?: number;
    };
}

export function useGetInvoices(businessId: string, options?: UseGetInvoicesParams) {
    const { limit = 10, minimal = true } = options || {};

    return useInfiniteQuery({
        queryKey: ['invoices', businessId, { limit, minimal }],
        queryFn: async ({ pageParam = 0 }: { pageParam: number }) => {
            const params = new URLSearchParams({
                businessId,
                limit: limit.toString(),
                offset: pageParam.toString(),
                minimal: minimal.toString(),
            });

            const response = await fetch(`/api/invoices?${params}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch invoices');
            }

            return response.json() as Promise<InvoicesResponse>;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage: InvoicesResponse, allPages) => {
            if (lastPage.pagination?.hasMore) {
                return allPages.length * limit;
            }
            return undefined;
        },
        enabled: !!businessId,
        refetchInterval: 5000,
    });
}

export function useRetryInvoice() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (invoiceId: string) => {
            const response = await fetch('/api/invoices/retry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoiceId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to retry invoice');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        },
    });
}

export function useGetAdminInvoiceDetails(invoiceId: string) {
    return useQuery({
        queryKey: ['admin', 'invoices', invoiceId],
        queryFn: async () => {
            const response = await fetch(`/api/admin/invoices/${invoiceId}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch invoice details');
            }
            return response.json();
        },
        enabled: !!invoiceId,
    });
}

export function useGetAdminInvoices(options?: { limit?: number }) {
    const { limit = 10 } = options || {};

    return useInfiniteQuery({
        queryKey: ['admin', 'invoices', { limit }],
        queryFn: async ({ pageParam = 0 }: { pageParam: number }) => {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: pageParam.toString(),
            });

            const response = await fetch(`/api/admin/invoices?${params}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch invoices');
            }

            return response.json() as Promise<InvoicesResponse>;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage: InvoicesResponse, allPages) => {
            if (lastPage.pagination?.hasMore) {
                return allPages.length * limit;
            }
            return undefined;
        },
    });
}
