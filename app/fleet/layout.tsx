'use client'

import { SidebarProvider } from "@/components/ui/sidebar"
import AppSidebar from "./components/appSidebar"
import { useUserStore } from "../stores/userStore"
import { useEffect, useState } from "react";
import { useGetBusinessMinimal } from "../hooks/useBusiness";
import { useUser } from "@clerk/nextjs";
import { Loader } from "../components/loader";
import { checkAndSetUserStatus } from "@/lib/auth/actions"
import { Role } from "@/lib/enums/role";
import { BusinessStatus } from "@/lib/types/business";

export default function Layout({ children }: { children: React.ReactNode }) {

    const { user } = useUser();
    const { role, setUser } = useUserStore();
    const { data: businessData } = useGetBusinessMinimal(user?.id || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserStatus = async () => {
            if (user?.id) {
                const status = await checkAndSetUserStatus(user.id);
                setUser({ role: status.role as Role | null });

                if (status.role === Role.BUSINESS && businessData) {
                    setUser({
                        businessId: businessData.id,
                        businessStatus: status.businessStatus as BusinessStatus | null,
                        businessType: businessData.type,
                        businessName: status.businessName
                    });
                    if (businessData.address) {
                        setUser({ businessAddress: businessData.address });
                    }
                }
                setLoading(false);
            }
        };

        fetchUserStatus();
    }, [user?.id, businessData, setUser]);

    if (loading || (role === Role.BUSINESS && !businessData)) {
        return <Loader label="Loading Details..." fullScreen />;
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full overflow-x-hidden bg-background-2">
                {children}
            </main>
        </SidebarProvider>
    )
}
