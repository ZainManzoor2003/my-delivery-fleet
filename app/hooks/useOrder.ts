
import { Order } from '@/lib/types/order';
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

interface ApiResponse<T> {
    message: string;
    order?: T;
    success: boolean,
    error?: string
}

// Create order
export function useCreateOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Order) => {
            const response = await fetch('/api/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to create order');
            }

            return { ...result, businessId: data.businessId, orderId: result.order?.id } as { message: string; success: boolean; orderId: string; error: string; businessId: string };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ['orders', data.businessId]
            });
        },
    });
}

interface OrdersResponse {
    orders: Order[];
    pagination: {
        hasMore: boolean;
        totalCount?: number;
    };
}

export function useGetOrders(businessId: string, options?: { limit?: number; minimal?: boolean }) {
    const { limit = 10, minimal = true } = options || {};

    return useInfiniteQuery({
        queryKey: ['orders', businessId, { limit, minimal }],
        queryFn: async ({ pageParam = 0 }: { pageParam: number }) => {
            const params = new URLSearchParams({
                businessId,
                limit: limit.toString(),
                offset: pageParam.toString(),
                minimal: minimal.toString(),
            });

            const response = await fetch(`/api/orders?${params}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch orders');
            }

            return response.json() as Promise<OrdersResponse>;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage: OrdersResponse, allPages) => {
            if (lastPage.pagination?.hasMore) {
                return allPages.length * limit;
            }
            return undefined;
        },
        enabled: !!businessId,
        refetchInterval: 5000,
    });
}
export function useGetAdminOrders(options?: { limit?: number; minimal?: boolean }) {
    const { limit = 10, minimal = true } = options || {};

    return useInfiniteQuery({
        queryKey: ['admin', 'orders', { limit, minimal }],
        queryFn: async ({ pageParam = 0 }: { pageParam: number }) => {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: pageParam.toString(),
                minimal: minimal.toString(),
            });

            const response = await fetch(`/api/admin/orders?${params}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch orders');
            }

            return response.json() as Promise<OrdersResponse>;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage: OrdersResponse, allPages) => {
            if (lastPage.pagination?.hasMore) {
                return allPages.length * limit;
            }
            return undefined;
        },
        refetchInterval: 5000,
    });
}

// Get order by ID
export function useGetOrder(orderId: string | null, options?: { refetchInterval?: number }) {
    return useQuery({
        queryKey: ['orders', 'detail', orderId],
        queryFn: async () => {
            if (!orderId) throw new Error('Order ID is required');

            const response = await fetch(`/api/order/${orderId}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch order');
            }

            return response.json()
        },
        enabled: !!orderId,
        refetchInterval: options?.refetchInterval,
    });
}

export function useGetAllBusinessOrdersForDropdown(businessId: string | null) {
    return useQuery({
        queryKey: ['orders', 'numbers', businessId],
        queryFn: async () => {
            if (!businessId) throw new Error('Business ID is required');

            const response = await fetch(`/api/business-all-orders/${businessId}`);

            if (!response.ok) {
                const error = await response.json();
                if (response.status === 404) {
                    return [];
                }
                throw new Error(error.message || 'Failed to fetch order numbers');
            }

            const result = await response.json();
            return result.orders || [];
        },
        enabled: !!businessId,
        retry: (failureCount, error) => {
            // Don't retry on 404
            if (error.message.includes('No orders found')) return false;
            return failureCount < 3;
        }
    });
}

// Update order
export function useUpdateOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            data
        }: {
            id: string;
            data: Order
        }) => {
            const response = await fetch(`/api/order/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update order');
            }

            const result = await response.json() as ApiResponse<Order>;
            return { ...result, businessId: data.businessId };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ['orders', data.businessId]
            });
            // Also invalidate the specific order detail cache
            queryClient.invalidateQueries({
                queryKey: ['orders', 'detail']
            });
        },
    });
}

// Toggle tracking visibility
export function useToggleTrackingVisibility() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, isClearedFromTracking }: { id: string; isClearedFromTracking: boolean }) => {
            const response = await fetch(`/api/order/${id}/tracking-visibility`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isClearedFromTracking }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update tracking visibility');
            }

            return response.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ['orders', data.order.businessId]
            });
        },
    });
}

// Delete order
export function useDeleteOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
            const response = await fetch(`/api/order/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete order');
            }

            const result = await response.json() as ApiResponse<null>;
            return { ...result, businessId };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ['orders', data.businessId]
            });
        },
    });
}

export function useGetDeliveryQuote() {
    return useMutation({
        mutationFn: async (data: {
            businessId: string;
            deliveryAddress: {
                street: string;
                apartment?: string | null;
                city: string;
                state: string;
                postalCode: string;
                latitude?: number;
                longitude?: number;
            };
            customerSubTotal?: string;
            driverTip?: string;
            handoffType?: string | null;
            deliveryType?: string;
            estimatedPickupTime?: string;
            isCatering?: boolean;
        }) => {
            const response = await fetch('/api/uber/quote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                if (result.validationErrors?.length) {
                    const err = new Error(result.error || result.message || 'Failed to get quote');
                    (err as any).validationErrors = result.validationErrors as string[];
                    throw err;
                }
                throw new Error(result.error || result.message || 'Failed to get quote');
            }

            return result as { success: boolean; quote: { id: string; fee: number; currency: string; expires: string } };
        },
    });
}

export function useCreateOrderDelivery() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ orderId, businessId, quoteId }: { orderId: string; businessId: string; quoteId?: string }) => {
            if (!orderId) {
                throw new Error('Order ID is required to create delivery');
            }

            const response = await fetch(`/api/order/${orderId}/create-delivery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quoteId }),
            });

            if (!response.ok) {
                const error = await response.json();
                if (error.validationErrors && error.validationErrors.length > 0) {
                    const err = new Error(error.error || error.message || 'Failed to create delivery');
                    (err as any).validationErrors = error.validationErrors as string[];
                    throw err;
                }
                throw new Error(error.error || error.message || 'Failed to create delivery');
            }

            const result = await response.json() as ApiResponse<Order>;
            return { ...result, businessId };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ['orders', data.businessId]
            });
            queryClient.invalidateQueries({
                queryKey: ['orders', 'detail']
            });
        },
    });
}
