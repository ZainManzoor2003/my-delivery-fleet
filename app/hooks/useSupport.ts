import { Ticket } from '@/lib/types/ticket';
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

interface ApiResponse<T> {
    message: string;
    ticket?: T;
    success: boolean;
    error?: string;
}

// Create ticket
export function useCreateTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Ticket) => {
            const response = await fetch('/api/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    messages: []
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to create ticket');
            }

            return { ...result, businessId: data.businessId, ticketId: result.ticket?.id } as { message: string; success: boolean; ticketId: string; error: string; businessId: string };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ['tickets', data.businessId]
            });
        },
    });
}

interface TicketsResponse {
    tickets: Ticket[];
    pagination: {
        hasMore: boolean;
        totalCount?: number;
    };
}

// Get all tickets for a business
export function useGetTickets(businessId: string, options?: { limit?: number }) {
    const { limit = 10 } = options || {};

    return useInfiniteQuery({
        queryKey: ['tickets', businessId, { limit }],
        queryFn: async ({ pageParam = 0 }: { pageParam: number }) => {
            const params = new URLSearchParams({
                businessId,
                limit: limit.toString(),
                offset: pageParam.toString(),
            });

            const response = await fetch(`/api/support?${params}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch tickets');
            }

            return response.json() as Promise<TicketsResponse>;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage: TicketsResponse, allPages) => {
            if (lastPage.pagination?.hasMore) {
                return allPages.length * limit;
            }
            return undefined;
        },
        enabled: !!businessId,
    });
}

export function useGetAdminTickets(options?: { limit?: number }) {
    const { limit = 10 } = options || {};

    return useInfiniteQuery({
        queryKey: ['tickets', 'admin', { limit }],
        queryFn: async ({ pageParam = 0 }: { pageParam: number }) => {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: pageParam.toString(),
            });

            const response = await fetch(`/api/admin/support/?${params}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch tickets for admin');
            }

            return response.json() as Promise<TicketsResponse>;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage: TicketsResponse, allPages) => {
            if (lastPage.pagination?.hasMore) {
                return allPages.length * limit;
            }
            return undefined;
        },
    });
}

// Get ticket by ID
export function useGetTicket(ticketId: string | null) {
    return useQuery({
        queryKey: ['tickets', 'detail', ticketId],
        queryFn: async () => {
            if (!ticketId) throw new Error('Ticket ID is required');

            const response = await fetch(`/api/support/${ticketId}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch ticket');
            }

            return response.json();
        },
        enabled: !!ticketId,
    });
}

// Update ticket
export function useUpdateTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            data
        }: {
            id: string;
            data: Partial<Ticket>
        }) => {
            const response = await fetch(`/api/support/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update ticket');
            }

            const result = await response.json() as ApiResponse<Ticket>;
            return { ...result, businessId: data.businessId };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ['tickets', data.businessId]
            });
            // Also invalidate the specific ticket detail cache
            queryClient.invalidateQueries({
                queryKey: ['tickets', 'detail']
            });

            queryClient.invalidateQueries({
                queryKey: ['tickets', 'admin']
            });

        },
    });
}

// Delete ticket
export function useDeleteTicket() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, businessId }: { id: string; businessId: string }) => {
            const response = await fetch(`/api/support/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete ticket');
            }

            const result = await response.json() as ApiResponse<null>;
            return { ...result, businessId };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ['tickets', data.businessId]
            });
            queryClient.invalidateQueries({
                queryKey: ['tickets', 'admin']
            });
        },
    });
}

// Add message to ticket
export function useAddTicketMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ticketId, message, senderId }: { ticketId: string; message: string; senderId: string }) => {
            if (!ticketId || !message) {
                throw new Error('Ticket ID and message are required');
            }

            const response = await fetch(`/api/support/${ticketId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, senderId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add message');
            }

            const result = await response.json();
            return result;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['tickets', 'detail', variables.ticketId]
            });
        },
    });
}