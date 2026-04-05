"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

interface TanstackQueryProvidersProps {
    children: React.ReactNode;
}

export const TanstackQueryProvider = ({ children }: TanstackQueryProvidersProps) => {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                gcTime: 1000 * 60 * 10, // 10 minutes - keep unused data in cache
                retry: 1, // Retry failed requests once
                refetchOnWindowFocus: false, // Don't refetch on window focus
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

