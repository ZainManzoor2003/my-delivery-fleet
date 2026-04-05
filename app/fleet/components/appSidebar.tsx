import { MoreHorizontal } from "lucide-react"
import { UsersIcon } from "@/components/icons/users"
import Link from "next/link"
import { useState, useRef, useCallback } from "react"
import { useUser } from "@clerk/nextjs"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
    useSidebar,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { HomeIcon } from "@/components/icons/home"
import { SettingIcon } from "@/components/icons/setting"
import { usePathname } from "next/navigation";
import { useSignOut } from "@/hooks/useSignOut"
import { DeliveryIcon } from "@/components/icons/delivery"
import { TrackingIcon } from "@/components/icons/tracking"
import { SupportIcon } from "@/components/icons/support"
import { useUserStore } from "../../stores/userStore"
import { Role } from "@/lib/enums/role"
import { SidebarTrigger } from "@/components/ui/sidebar";
import BusinessIcon from "@/components/icons/business"
import { InvoiceIcon } from "@/components/icons/invoice"

// Business menu items.
const businessItems = [
    {
        title: "Overview",
        url: "/fleet",
        icon: HomeIcon,
    },
    {
        title: "Order History",
        url: "/fleet/orders",
        icon: DeliveryIcon,
    },
    {
        title: "Live Tracking",
        url: "/fleet/live-tracking",
        icon: TrackingIcon,
    },
    {
        title: "Support",
        url: "/fleet/support",
        icon: SupportIcon,
    },
    {
        title: "Settings",
        url: "/fleet/settings",
        icon: SettingIcon,
    },
]

// Admin menu items.
const adminItems = [
    {
        title: "Overview",
        url: "/fleet",
        icon: HomeIcon,
    },
    {
        title: "User Manager",
        url: "/fleet/users",
        icon: UsersIcon,
    },
    {
        title: "Businesses",
        url: "/fleet/businesses",
        icon: BusinessIcon,
    },
    {
        title: "Manage Orders",
        url: "/fleet/manage-orders",
        icon: DeliveryIcon,
    },
    {
        title: "Billing",
        url: "/fleet/billing",
        icon: InvoiceIcon,
    },
    {
        title: "Support",
        url: "/fleet/manage-support",
        icon: SupportIcon,
    },
    {
        title: "Settings",
        url: "/fleet/settings",
        icon: SettingIcon,
    },
]

export default function AppSidebar() {
    const pathname = usePathname();
    const signOut = useSignOut();
    const { state, isMobile, setOpenMobile } = useSidebar();
    const { user } = useUser();
    const { role } = useUserStore();
    const isCollapsed = state === "collapsed";
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const prevStateRef = useRef(state);

    // Get menu items based on user role
    const menuItems = role === Role.ADMIN ? adminItems : businessItems;

    // Handle dropdown open change, closing if sidebar state changed
    const handleDropdownOpenChange = useCallback((open: boolean) => {
        if (prevStateRef.current !== state) {
            prevStateRef.current = state;
            setDropdownOpen(false);
            return;
        }
        prevStateRef.current = state;
        setDropdownOpen(open);
    }, [state]);

    const displayName = user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || "User";
    const avatarUrl = user?.imageUrl || 'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg';
    const initials = user?.firstName && user?.lastName
        ? `${user.firstName[0]}${user.lastName[0]}`
        : user?.firstName?.[0] || "U";

    return (
        <Sidebar collapsible="icon" >
            <SidebarHeader className="py-5 ">
                <div className='px-1 flex justify-between items-center'>
                    <h1
                        className=" group-data-[collapsible=icon]:hidden
                    text-[20px] font-bold text-center uppercase text-text-1 "
                    >
                        Delivery Fleet
                    </h1>
                    <SidebarTrigger className='hidden xl:block' />
                </div>
            </SidebarHeader>
            <SidebarContent className="mt-10 p-2 group-data-[collapsible=icon]:p-1">
                <SidebarGroup >
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item: any) => {
                                const isActive = pathname === item.url || (pathname.startsWith(`${item.url}/`) && item.url !== "/fleet")
                                return (
                                    <SidebarMenuItem key={item.title} className="group-data-[collapsible=icon]:py-1 ">
                                        <SidebarMenuButton asChild
                                            className={`h-10 ${isActive && 'group-data-[collapsible=icon]:bg-transparent bg-[#F1F5F9]'}`}>
                                            <Link
                                                href={item.url}
                                                className={`gap-4 flex items-center text-text-sidebar
                                                    }`}
                                                onClick={() => { if (isMobile) setOpenMobile(false); }}
                                            >
                                                <item.icon stroke={isActive ? "#1877F2" : "#031E42"} isActive={isActive} />
                                                <span className={`text-[1rem] 
                                                    ${isActive ? "font-medium" : "font-normal"}`}>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="px-0 py-2 group-data-[collapsible=icon]:p-1">
                <SidebarGroup className="px-1">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                {isCollapsed ? (
                                    // Collapsed: Avatar is the trigger
                                    <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpenChange}>
                                        <DropdownMenuTrigger asChild>
                                            <div className="flex justify-center cursor-pointer">
                                                <Avatar className="h-8 w-8 rounded-full">
                                                    <AvatarImage
                                                        className="w-full h-full"
                                                        src={avatarUrl}
                                                        alt='user avatar'
                                                    />
                                                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                                                </Avatar>
                                            </div>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="start"
                                            side="right"
                                            sideOffset={8}
                                            className="w-42 p-1.5 border border-border rounded-lg"
                                        >
                                            <DropdownMenuItem
                                                className="px-2 py-2 h-10 text-sm font-normal text-text-2 rounded-lg cursor-pointer hover:bg-[#f1f5f9]"
                                                onClick={signOut}
                                            >
                                                Sign Out
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <SidebarMenuButton className="h-10 hover:bg-transparent cursor-default">
                                        <div className="flex items-center gap-4 w-full">
                                            <Avatar className="h-10 w-10 rounded-full">
                                                <AvatarImage
                                                    className="w-full h-full"
                                                    src={avatarUrl}
                                                    alt='user avatar'
                                                />
                                                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-md text-text-sidebar font-medium truncate max-w-30">
                                                {displayName}
                                            </span>
                                            <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpenChange}>
                                                <DropdownMenuTrigger asChild>
                                                    <div className="ml-auto p-1.5 rounded-md cursor-pointer hover:bg-[#f1f5f9] transition-colors">
                                                        <MoreHorizontal className="h-5 w-5 text-text-sidebar" />
                                                    </div>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    side="top"
                                                    sideOffset={8}
                                                    className="w-42 p-1.5 border border-border rounded-lg"
                                                >
                                                    <DropdownMenuItem
                                                        className="px-2 py-2 h-10 text-sm font-normal text-text-2 rounded-lg cursor-pointer hover:bg-[#f1f5f9]"
                                                        onClick={signOut}
                                                    >
                                                        Sign Out
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </SidebarMenuButton>
                                )}
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarFooter>
        </Sidebar>
    )
}
