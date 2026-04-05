import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ActionResponse {
    message: string;
    business: {
        id: string;
        name: string;
        status: string;
        type: string;
    };
    success: boolean;
}

export function useApproveBusiness() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (businessId: string) => {
            const response = await fetch(`/api/admin/business/${businessId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to approve business');
            }

            const result = await response.json() as ActionResponse;
            return { ...result, businessId };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin', 'businesses']
            });
            queryClient.invalidateQueries({
                queryKey: ['users']
            });
            queryClient.invalidateQueries({
                queryKey: ['business']
            });
        },
    });
}

export function useRejectBusiness() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (businessId: string) => {
            const response = await fetch(`/api/admin/business/${businessId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to reject business');
            }

            const result = await response.json() as ActionResponse;
            return { ...result, businessId };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin', 'businesses']
            });
            queryClient.invalidateQueries({
                queryKey: ['users']
            });
            queryClient.invalidateQueries({
                queryKey: ['business']
            });
        },
    });
}
