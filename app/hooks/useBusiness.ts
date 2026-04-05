// app/hooks/use-business.ts
import { Address } from '@/lib/enums/address';
import { CreateBusinessData, Business, BusinessUpdateData } from '@/lib/types/business';
import { BusinessType } from '@/lib/enums/businessType';
import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

export function useCreateBusiness() {
    return useMutation({
        mutationFn: async (data: CreateBusinessData) => {
            const response = await fetch('/api/business', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create business');
            }

            return response.json();
        },
    });
}


export function useUpdateBusiness() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ businessId, data }: { businessId: string; data: BusinessUpdateData }) => {
            const response = await fetch(`/api/business/${businessId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update business');
            }

            const result = await response.json();
            return result.business as Business | null;
        },
        onSuccess: () => {
            // Invalidate and refetch business queries
            queryClient.invalidateQueries({ queryKey: ['business'] });
        },
    });
}

export interface BusinessMinimal {
    id: string;
    status: string;
    type: BusinessType;
    paymentMethod: { id: string } | null;
    address: Address | null;
}

export function useGetBusinessMinimal(userId: string | null) {
    return useQuery({
        queryKey: ['business', 'minimal', userId],
        queryFn: async () => {
            if (!userId) {
                throw new Error('User ID is required');
            }

            const response = await fetch(`/api/business?user-id=${userId}&fields=minimal`);

            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch business');
            }

            const data = await response.json();
            return data.business as BusinessMinimal | null;
        },
        enabled: !!userId,
    });
}

export function useGetAllBusinessesForDropdown() {
    return useQuery({
        queryKey: ['businesses'],
        queryFn: async () => {

            const response = await fetch(`/api/admin/all-businesses`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch all businesses');
            }

            const result = await response.json();
            return result.allBusinesses || [];
        },
    });
}

export function useGetBusinessByUserId(userId: string | null) {
    return useQuery({
        queryKey: ['business', 'full', userId],
        queryFn: async () => {
            if (!userId) {
                throw new Error('User ID is required');
            }

            const response = await fetch(`/api/business?user-id=${userId}`);

            if (!response.ok) {
                const error = await response.json();
                if (response.status === 404) {
                    return null;
                }

                throw new Error(error.error || 'Failed to fetch business');
            }

            const data = await response.json();
            return data.business as Business | null;
        },
        enabled: !!userId,
    });
}

interface BusinessesResponse {
    businesses: Business[];
    pagination: {
        hasMore: boolean;
        totalCount: number;
        limit: number;
        offset: number;
    };
}

export function useGetBusinessesForAdmin(options?: { limit?: number }) {
    const { limit = 10 } = options || {};

    return useInfiniteQuery({
        queryKey: ['admin', 'businesses', { limit }],
        queryFn: async ({ pageParam = 0 }: { pageParam: number }) => {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: pageParam.toString(),
            });

            const response = await fetch(`/api/admin/businesses?${params}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch businesses');
            }

            return response.json() as Promise<BusinessesResponse>;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage: BusinessesResponse, allPages) => {
            if (lastPage.pagination?.hasMore) {
                return allPages.length * limit;
            }
            return undefined;
        },
    });
}

export function useGetAdminBusinessById(id: string | null) {
    return useQuery({
        queryKey: ['admin', 'business', id],
        queryFn: async () => {
            if (!id) throw new Error('Business ID is required');
            const response = await fetch(`/api/admin/businesses/${id}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch business');
            }
            return response.json() as Promise<{
                success: boolean;
                business: Business & { paymentMethod: any };
                stats: { totalOrders: number; actualAvgOrdersPerDay: number | null };
            }>;
        },
        enabled: !!id,
    });
}

export function useUpdateAdminBusiness() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Business> }) => {
            const response = await fetch(`/api/admin/business/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update business');
            }

            return response.json() as Promise<{ success: boolean; business: Business }>;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'businesses'] });

            queryClient.invalidateQueries({ queryKey: ['admin', 'business', data.business.id], });

            // Also update the specific business in cache if it exists
            queryClient.setQueriesData(
                { queryKey: ['admin', 'businesses'] },
                (oldData: any) => {
                    if (!oldData) return oldData;

                    return {
                        ...oldData,
                        pages: oldData.pages.map((page: any) => ({
                            ...page,
                            businesses: page.businesses.map((business: Business) =>
                                business.id === variables.id ? data.business : business
                            )
                        }))
                    };
                }
            );
        },
    });
}
