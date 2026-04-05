import { useQuery } from '@tanstack/react-query';

interface User {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
    business?: {
        id: string;
        name: string;
        status: string;
        type: string;
    } | null;
}

interface UsersResponse {
    users: User[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        limit: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export function useUsers(options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = options || {};
    
    return useQuery({
        queryKey: ['users', { page, limit }],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            
            const response = await fetch(`/api/admin/users?${params}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch users');
            }

            const data = await response.json() as unknown;
            return data as UsersResponse;
        },
    });
}
