'use client'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GenericTable, { ColumnDef } from "@/app/components/table";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { Business } from "@/lib/types/business";
import { BusinessStatus } from "@/lib/types/business";
import { useMemo, useState } from "react";
import { Loader } from "@/app/components/loader";
import { CardFooter } from "@/components/ui/card";
import { useGetBusinessesForAdmin } from "@/app/hooks/useBusiness";
import { BusinessTab } from "@/lib/enums/businessTab";
import SurchargesEdit from "./surchargesEdit";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CheckCircle, XCircle } from "lucide-react";
import { useApproveBusiness, useRejectBusiness } from "@/app/hooks/useBusinessApproval";
import { formatUTCLocal } from "@/lib/timezone";

interface BusinessesTableProps {
    dateRange?: DateRange;
}

export default function BusinessesTable({ dateRange }: BusinessesTableProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<BusinessTab>(BusinessTab.ALL);
    const [search, setSearch] = useState<string>('');

    const limit = 10;
    const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useGetBusinessesForAdmin({ limit });

    const approveMutation = useApproveBusiness();
    const rejectMutation = useRejectBusiness();

    const allBusinesses = useMemo(() => {
        return data?.pages.flatMap((page: any) => page.businesses || []) || [];
    }, [data]);

    const date = dateRange;

    const businesses = useMemo(() => {
        if (allBusinesses.length === 0) return [];

        const querySearch = search.trim().toLowerCase();
        let filteredBusinesses = [...allBusinesses];

        if (querySearch) {
            filteredBusinesses = filteredBusinesses.filter((business: Business) => {
                const name = (business.name ?? '').toLowerCase();
                const phone = (business.phone ?? '').toLowerCase();
                return name.includes(querySearch) || phone.includes(querySearch);
            });
        }

        if (date && (date.from || date.to)) {
            const from = startOfDay(date.from!);
            const to = endOfDay(date.to!);
            if (from || to) {
                filteredBusinesses = filteredBusinesses.filter((business) => {
                    if (!business.createdAt) return false;
                    const t = new Date(business.createdAt).getTime();
                    return t >= (from?.getTime() ?? -Infinity) &&
                        t <= (to?.getTime() ?? Infinity);
                });
            }
        }

        return filteredBusinesses;

    }, [allBusinesses, search, date]);

    const filteredBusinesses = useMemo(() => {
        if (!businesses) return [];
        let filtered = [...businesses];

        if (activeTab !== BusinessTab.ALL) {
            switch (activeTab) {
                case BusinessTab.APPROVED:
                    filtered = filtered.filter(business => business.status === BusinessStatus.APPROVED);
                    break;
                case BusinessTab.PENDING:
                    filtered = filtered.filter(business =>
                        business.status === BusinessStatus.UNDER_REVIEW ||
                        business.status === BusinessStatus.INCOMPLETE
                    );
                    break;
                case BusinessTab.REJECTED:
                    filtered = filtered.filter(business => business.status === BusinessStatus.REJECTED);
                    break;
            }
        }

        return filtered;
    }, [businesses, activeTab]);

    const businessesCount = businesses?.length || 0;
    const approvedCount = businesses?.filter((business: Business) => business.status === BusinessStatus.APPROVED).length || 0;
    const pendingCount = businesses?.filter((business: Business) =>
        business.status === BusinessStatus.UNDER_REVIEW ||
        business.status === BusinessStatus.INCOMPLETE
    ).length || 0;
    const rejectedCount = businesses?.filter((business: Business) => business.status === BusinessStatus.REJECTED).length || 0;

    const businessColumns: ColumnDef<Business>[] = [
        {
            key: "name",
            label: "Business Name",
            width: "w-48 min-w-48",
            render: (value) => value && value.length > 30 ? value.slice(0, 30) + "..." : value,
        },
        {
            key: "phone",
            label: "Phone",
            width: "w-32 min-w-32",
        },
        {
            key: "type",
            label: "Type",
            width: "w-28 min-w-28",
            render: (value) => <span className="capitalize">{value}</span>,
        },
        {
            key: "status",
            label: "Status",
            width: "w-32 min-w-32",
            render: (value) => {
                const getStatusColor = (status: string) => {
                    switch (status) {
                        case BusinessStatus.APPROVED:
                            return "bg-green-100 text-green-800";
                        case BusinessStatus.UNDER_REVIEW:
                            return "bg-yellow-100 text-yellow-800";
                        case BusinessStatus.INCOMPLETE:
                            return "bg-gray-100 text-gray-800";
                        case BusinessStatus.REJECTED:
                            return "bg-red-100 text-red-800";
                        default:
                            return "bg-gray-100 text-gray-800";
                    }
                };
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
                        {value.replace('_', ' ')}
                    </span>
                );
            },
        },
        {
            key: "avgOrdersPerDay",
            label: "Avg Orders/Day",
            width: "w-32 min-w-32 text-left",
            render: (value) => value || '-',
        },
        {
            key: "actualAvgOrdersPerDay",
            label: "Actual Avg/Day",
            width: "w-36 min-w-36 text-left",
            render: (value) => value != null ? `${Math.max(1, Math.round(value))} orders` : '-',
        },
        {
            key: "surchargeBaseQuote",
            label: "Admin Fee",
            width: "w-48 min-w-48",
            render: (value, record) => (
                <SurchargesEdit business={record} />
            ),
        },
        {
            key: "createdAt",
            label: "Created",
            width: "w-36 min-w-36",
            render: (value) => formatUTCLocal(value, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })
        },
        {
            key: "actions",
            label: "",
            width: "w-24 min-w-24",
            render: (value, record) => (
                <div className="flex items-center justify-center">
                    {record.status === BusinessStatus.UNDER_REVIEW && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => approveMutation.mutate(record.id)}
                                    className="text-green-600"
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => rejectMutation.mutate(record.id)}
                                    className="text-red-600"
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className='px-4 py-4'>
            <div className="space-y-4 border border-border rounded-4xl bg-background">
                <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as BusinessTab)} className="w-full py-4 gap-0">
                    <TabsList className="bg-transparent rounded-none w-inherit justify-start h-auto px-6 py-0 gap-4 ">
                        <TabsTrigger value={BusinessTab.ALL}
                            className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                            All ({businessesCount})
                        </TabsTrigger>
                        <TabsTrigger value={BusinessTab.APPROVED}
                            className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                            Approved ({approvedCount})
                        </TabsTrigger>
                        <TabsTrigger value={BusinessTab.PENDING}
                            className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                            Pending ({pendingCount})
                        </TabsTrigger>
                        <TabsTrigger value={BusinessTab.REJECTED}
                            className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                            Rejected ({rejectedCount})
                        </TabsTrigger>
                    </TabsList>
                    <div className="border-t border-border mt-0 flex flex-col lg:flex-row justify-between items-center gap-4 pt-5 py-4 px-6 ">
                        <div className="relative w-full lg:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-3" />
                            <Input
                                placeholder="Search by business name, email, or phone..."
                                value={search}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                className="h-10 pr-10 placeholder:text-text-3 font-normal text-sm pl-10 border-border"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 cursor-pointer"
                                >
                                    <X className="h-6 w-6 text-text-3" />
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
                        </div>
                    </div>
                    {(isLoading && !data) ? <Loader
                        fullScreen
                        label="Fetching Businesses"
                        description="Please wait while we load businesses information..."
                    /> :
                        <GenericTable
                            data={filteredBusinesses}
                            columns={businessColumns}
                            hoverable={true}
                            onRowClick={(business) => router.push(`/fleet/businesses/${business.id}`)}
                            className="px-6"
                            emptyMessage="No businesses found"
                        />
                    }
                </Tabs>
                <CardFooter className="justify-center border-t items-center p-4!">
                    <div className="flex flex-col items-center gap-2">
                        {hasNextPage && (
                            <Button
                                variant="outline"
                                className="text-primary font-medium hover:bg-primary/10 border-none"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                            >
                                {isFetchingNextPage ? 'Loading...' : 'View more Businesses'}
                            </Button>
                        )}
                        {!hasNextPage && allBusinesses.length > 0 && (
                            <p className="text-sm text-text-2">
                                All businesses loaded ({filteredBusinesses.length})
                            </p>
                        )}
                    </div>
                </CardFooter>
            </div>
        </div>
    )
}
