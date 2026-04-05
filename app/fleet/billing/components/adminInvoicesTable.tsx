'use client'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GenericTable, { ColumnDef } from "@/app/components/table";
import { Search, X } from "lucide-react";
import { InvoiceStatus } from "@/lib/types/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { Invoice } from "@/lib/types/invoice";
import { useMemo, useState } from "react";
import InvoiceStatusBadge from "../../settings/components/invoiceStatusBadge";
import { formatTimeAgo } from "@/lib/utils/dateUtils";
import { formatUTCLocalDate } from "@/lib/timezone";
import { useGetAdminInvoices } from "@/app/hooks/useInvoice";
import { Loader } from "@/app/components/loader";
import { CardFooter } from "@/components/ui/card";
import { useGetAllBusinessesForDropdown } from "@/app/hooks/useBusiness";
import { SearchableBusinessDropdown } from "../../components/searchable-business-dropdown";
import InvoiceDetailModal from "../../components/InvoiceDetailModal";
import { useRouter } from "next/navigation";

interface InvoicesTableProps {
    dateRange?: DateRange;
}

export default function AdminInvoicesTable({ dateRange }: InvoicesTableProps) {
    const router = useRouter();
    const [activeBusinessId, setActiveBusinessId] = useState<string | undefined>('');
    const [activeTab, setActiveTab] = useState<string>('all');
    const [search, setSearch] = useState<string>('');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data: allBusinesses } = useGetAllBusinessesForDropdown()

    const limit = 10;
    const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useGetAdminInvoices({ limit });

    const allInvoices = useMemo(() => {
        return data?.pages.flatMap(page => page.invoices || []) || [];
    }, [data]);

    const date = dateRange;

    const invoices = useMemo(() => {
        if (allInvoices.length === 0) return [];

        const querySearch = search.trim().toLowerCase();
        let filteredInvoices = [...allInvoices];

        if (querySearch) {
            filteredInvoices = filteredInvoices.filter((o: Invoice) => {
                const invoiceNum = String(o.invoiceNumber ?? '').toLowerCase();
                return invoiceNum.includes(querySearch);
            });
        }

        if (activeBusinessId) {
            filteredInvoices = filteredInvoices.filter(
                (t) => t.businessId === activeBusinessId
            );
        }

        if (date && (date.from || date.to)) {
            const from = startOfDay(date.from!);
            const to = endOfDay(date.to!);
            if (from || to) {
                filteredInvoices = filteredInvoices.filter((o) => {
                    if (!o.createdAt) return false;
                    const t = new Date(o.createdAt).getTime();
                    return t >= (from?.getTime() ?? -Infinity) &&
                        t <= (to?.getTime() ?? Infinity);
                });
            }
        }

        return filteredInvoices;

    }, [allInvoices, search, date, activeBusinessId]);

    const filteredInvoices = useMemo(() => {
        if (!invoices) return [];
        let filtered = [...invoices];

        if (activeTab !== 'all') {
            filtered = filtered.filter(o => o.status === activeTab);
        }

        return filtered;
    }, [invoices, activeTab]);

    const invoicesCount = invoices?.length || 0;
    const pendingCount = invoices?.filter((o: Invoice) => o.status === InvoiceStatus.Pending).length || 0;
    const paidCount = invoices?.filter((o: Invoice) => o.status === InvoiceStatus.Paid).length || 0;
    const failedCount = invoices?.filter((o: Invoice) => o.status === InvoiceStatus.Failed).length || 0;
    const processedCount = invoices?.filter((o: Invoice) => o.status === InvoiceStatus.Processed).length || 0;

    const handleViewInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedInvoice(null);
    };

    const invoiceColumns: ColumnDef<Invoice>[] = [
        {
            key: "invoiceNumber",
            label: "Invoice ID",
            width: "pl-0 w-25 min-w-25",
            render: (value) => value || 'N/A',
        },
        {
            key: "businessName",
            label: "Business",
            width: "w-40 min-w-40",
            render: (value) => value || 'N/A',
        },
        {
            key: "weekStart",
            label: "Billing Period",
            width: "w-35 min-w-35",
            render: (_value: any, row?: Invoice) => {
                if (!row?.weekStart || !row?.weekEnd) return 'N/A';
                const start = formatUTCLocalDate(row.weekStart, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
                const end = formatUTCLocalDate(row.weekEnd, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
                return `${start} - ${end}`;
            },
        },
        {
            key: "totalOrders",
            label: "Orders",
            width: "w-20 min-w-20 text-center",
            render: (value) => value || 0,
        },
        {
            key: "totalAmount",
            label: "Total Amount",
            width: "w-30 min-w-30 text-right",
            render: (value: any) => {
                const amount = Number(value) || 0;
                return `$${amount.toFixed(2)}`;
            },
        },
        {
            key: "status",
            label: "Status",
            width: "w-25 min-w-25 text-center",
            render: (value) => <InvoiceStatusBadge status={value} />,
        },
        {
            key: "createdAt",
            label: "Created",
            width: "w-35 min-w-35",
            render: (value: string) => formatTimeAgo(new Date(value)),
        },
        {
            key: "action",
            label: "Action",
            align: "left",
            width: "w-35 min-w-35",
            stickyRight: true,
            render: (_value, invoice: Invoice) => (
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleViewInvoice(invoice);
                    }}
                    className="min-w-20 bg-white border border-border text-text-sidebar hover:bg-white/50"
                >
                    View
                </Button>
            ),
        },
    ]

    return (
        <div className='px-4 py-4'>
            <div className="space-y-4 border border-border rounded-4xl bg-background">
                <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value)} className="w-full py-4 gap-0">
                    <TabsList className="bg-transparent rounded-none w-inherit justify-start h-auto px-6 py-0 gap-4 ">
                        <TabsTrigger value="all"
                            className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                            All ({invoicesCount})
                        </TabsTrigger>
                        <TabsTrigger value={InvoiceStatus.Pending}
                            className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                            Pending ({pendingCount})
                        </TabsTrigger>
                        <TabsTrigger value={InvoiceStatus.Paid}
                            className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                            Paid ({paidCount})
                        </TabsTrigger>
                        <TabsTrigger value={InvoiceStatus.Failed}
                            className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                            Failed ({failedCount})
                        </TabsTrigger>
                        <TabsTrigger value={InvoiceStatus.Processed}
                            className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                            Processed ({processedCount})
                        </TabsTrigger>
                    </TabsList>
                    <div className="border-t border-border mt-0 flex flex-col lg:flex-row justify-between items-center gap-4 pt-5 py-4 px-6 ">
                        <div className="relative w-full lg:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-3" />
                            <Input
                                placeholder="Search Invoices by ID..."
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
                        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto pb-2 lg:pb-0">
                            <SearchableBusinessDropdown
                                businesses={allBusinesses}
                                value={activeBusinessId!}
                                onChange={(_value, id) => {
                                    setActiveBusinessId(id)
                                }}
                                placeholder="Search or select business..."
                            />
                        </div>
                    </div>
                    {(isLoading && !data) ? <Loader
                        fullScreen
                        label="Fetching Invoices"
                        description="Please wait while we load invoices information..."
                    /> :
                        <GenericTable
                            data={filteredInvoices}
                            columns={invoiceColumns}
                            selectable={true}
                            hoverable={true}
                            emptyMessage="No invoices found"
                            onRowClick={(invoice: Invoice) => invoice.status !== InvoiceStatus.Failed && router.push(`/fleet/billing/${invoice.id}`)}
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
                                {isFetchingNextPage ? 'Loading...' : 'View more Invoices'}
                            </Button>
                        )}
                        {!hasNextPage && allInvoices.length > 0 && (
                            <p className="text-sm text-text-2">
                                All invoices loaded ({filteredInvoices.length})
                            </p>
                        )}
                    </div>
                </CardFooter>
            </div>

            {/* Invoice Detail Modal */}
            <InvoiceDetailModal
                invoice={selectedInvoice}
                isOpen={isModalOpen}
                onClose={closeModal}
            />
        </div>
    )
}
