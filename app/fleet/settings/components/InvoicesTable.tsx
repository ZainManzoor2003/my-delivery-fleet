'use client'
import { CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GenericTable, { ColumnDef } from "@/app/components/table";
import { Search, X } from "lucide-react";
import InvoiceStatusBadge from "./invoiceStatusBadge";
import InvoiceDetailModal from "../../components/InvoiceDetailModal";
import { Loader } from "@/app/components/loader";
import { useMemo, useState } from "react";
import { InvoiceTab } from "@/lib/enums/invoiceTab";
import { Invoice } from "@/lib/types/invoice";
import { useUserStore } from "@/app/stores/userStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { formatTimeAgo } from "@/lib/utils/dateUtils";
import { useGetInvoices, useRetryInvoice } from "@/app/hooks/useInvoice";
import { InvoiceStatus } from "@/lib/types/invoice";
import { toast } from "react-toastify";

interface InvoicesPageProps {
    dateRange?: DateRange;
}

export default function InvoicesTable({ dateRange }: InvoicesPageProps) {
    const { businessId } = useUserStore();
    const [activeTab, setActiveTab] = useState<InvoiceTab>(InvoiceTab.ALL);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [search, setSearch] = useState<string>('');

    const limit = 10;
    const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useGetInvoices(businessId as string, { limit });
    const { mutate: retryInvoice, isPending: isRetrying, variables: retryingInvoiceId } = useRetryInvoice();

    const date = dateRange;

    const allInvoices = useMemo(() => {
        // Use real data from API
        return data?.pages.flatMap(page => page.invoices || []) || [];
    }, [data]);

    const invoices = useMemo(() => {
        if (allInvoices.length === 0) return [];

        const querySearch = search.trim().toLowerCase();
        let filteredInvoices = [...allInvoices];

        if (querySearch) {
            filteredInvoices = filteredInvoices.filter((i: Invoice) => {
                const invoiceNum = String(i.invoiceNumber ?? i.id ?? '').toLowerCase();
                return invoiceNum.includes(querySearch);
            });
        }

        if (date && (date.from || date.to)) {
            const from = startOfDay(date.from!);
            const to = endOfDay(date.to!);
            if (from || to) {
                filteredInvoices = filteredInvoices.filter((i) => {
                    if (!i.createdAt) return false;
                    const t = new Date(i.createdAt).getTime();
                    return t >= (from?.getTime() ?? -Infinity) &&
                        t <= (to?.getTime() ?? Infinity);
                });
            }
        }

        return filteredInvoices;

    }, [allInvoices, search, date]);

    const filteredInvoices = useMemo(() => {
        if (!invoices) return [];
        let filtered = [...invoices];

        if (activeTab !== InvoiceTab.ALL) {
            switch (activeTab) {
                case InvoiceTab.PAID:
                    filtered = filtered.filter((i: Invoice) =>
                        i.status === InvoiceStatus.Paid
                    );
                    break;
                case InvoiceTab.PENDING:
                    filtered = filtered.filter((i: Invoice) =>
                        i.status === InvoiceStatus.Pending
                    );
                    break;
                case InvoiceTab.FAILED:
                    filtered = filtered.filter((i: Invoice) =>
                        i.status === InvoiceStatus.Failed
                    );
                    break;
                case InvoiceTab.PROCESSED:
                    filtered = filtered.filter((i: Invoice) =>
                        i.status === InvoiceStatus.Processed
                    );
                    break;
            }
        }

        return filtered;
    }, [invoices, activeTab]);

    const invoicesCount = invoices?.length || 0;
    const paidCount = invoices?.filter((i: Invoice) => i.status === InvoiceStatus.Paid).length || 0;
    const pendingCount = invoices?.filter((i: Invoice) => i.status === InvoiceStatus.Pending).length || 0;
    const failedCount = invoices?.filter((i: Invoice) => i.status === InvoiceStatus.Failed).length || 0;
    const processedCount = invoices?.filter((i: Invoice) => i.status === InvoiceStatus.Processed).length || 0;


    const invoiceColumns: ColumnDef<Invoice>[] = [
        {
            key: 'invoiceNumber',
            label: 'Invoice #',
            width: 'w-24 min-w-24',
            render: (value) => value
        },
        {
            key: 'status',
            label: 'Status',
            width: 'w-20 min-w-20',
            render: (value, row: Invoice) => <div className="flex justify-start"><InvoiceStatusBadge status={row.status} /></div>
        },
        {
            key: 'totalAmount',
            label: 'Total',
            width: 'w-24 min-w-24 text-left font-semibold',
            render: (value) => <span className="text-left block font-semibold">${Number(value).toFixed(2)}</span>
        },
        {
            key: 'createdAt',
            label: 'Created',
            width: 'w-20 min-w-20',
            render: (value) => formatTimeAgo(new Date(value)),
        },

        {
            key: "action",
            label: "Action",
            align: "left",
            stickyRight: true,
            width: "w-25 min-w-25",
            render: (_value, invoice: Invoice) => (
                <>
                    {
                        invoice.status === InvoiceStatus.Failed ?
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    retryInvoice(invoice.id, {
                                        onSuccess: () => toast.success('Invoice paid successfully'),
                                        onError: (err) => toast.error(err.message || 'Failed to retry invoice'),
                                    });
                                }}
                                disabled={isRetrying && retryingInvoiceId === invoice.id}
                                className="min-w-20 bg-white border border-border text-text-sidebar hover:bg-white/50"
                            >
                                {isRetrying && retryingInvoiceId === invoice.id ? 'Retrying...' : 'Retry'}
                            </Button>
                            :
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedInvoice(invoice);
                                }}
                                className="min-w-20 bg-white border border-border text-text-sidebar hover:bg-white/50"
                            >
                                View
                            </Button>
                    }

                </>
            ),
        },

    ];

    return (
        <div>
            <div className='px-4 pb-4'>
                <div className="border border-border rounded-4xl bg-background">
                    <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as InvoiceTab)} className="w-full py-0 pt-4 gap-0">
                        <TabsList className="bg-transparent rounded-none w-inherit justify-start h-auto px-6 py-0 gap-4 ">
                            <TabsTrigger value={InvoiceTab.ALL}
                                className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                                All ({invoicesCount})
                            </TabsTrigger>
                            <TabsTrigger value={InvoiceTab.PENDING}
                                className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                                Pending ({pendingCount})
                            </TabsTrigger>
                            <TabsTrigger value={InvoiceTab.PAID}
                                className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                                Paid ({paidCount})
                            </TabsTrigger>
                            <TabsTrigger value={InvoiceTab.FAILED}
                                className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                                Failed ({failedCount})
                            </TabsTrigger>
                            <TabsTrigger value={InvoiceTab.PROCESSED}
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
                                    placeholder="Search by Invoice # or Customer..."
                                    value={search}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                    className="h-10 placeholder:text-text-3 font-normal text-sm pr-10 pl-10 border-border"
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
                        </div>
                        {(isLoading && !data) ? <Loader
                            className="py-10"
                            label="Fetching Invoices"
                            description="Please wait while we load invoices information..."
                        /> :
                            <div className="px-2 pb-4 overflow-x-auto">
                                <GenericTable
                                    data={filteredInvoices}
                                    columns={invoiceColumns}
                                    selectable={false}
                                    hoverable={true}
                                    onRowClick={() => { }}
                                    emptyMessage="No invoices found"
                                />
                            </div>
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
            </div>

            <InvoiceDetailModal
                invoice={selectedInvoice}
                isOpen={selectedInvoice != null}
                onClose={() => {
                    setSelectedInvoice(null);
                }}
            />
        </div>
    )
}
