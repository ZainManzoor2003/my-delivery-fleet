'use client'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GenericTable, { ColumnDef } from "@/app/components/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Search, X, ArrowUp, ArrowDown, ChevronsDownUp, ChevronDown, MoreHorizontal, Trash } from "lucide-react";
import { TicketTab } from "@/lib/enums/ticketTab";
import { useUserStore } from "@/app/stores/userStore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { startOfDay, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { Ticket } from "@/lib/types/ticket";
import { useMemo, useState } from "react";
import { TicketPriority } from "@/lib/enums/ticketPriority";
import { TicketStatus } from "@/lib/enums/ticketStatus";
import TicketStatusBadge from "../../components/ticketStatusBadge";
import { TicketCategory } from "@/lib/enums/ticketCategory";
import { Separator } from "@/components/ui/separator";
import { useDeleteTicket, useGetAdminTickets, useUpdateTicket } from "@/app/hooks/useSupport";
import { Loader } from "@/app/components/loader";
import { CardFooter } from "@/components/ui/card";
import { toast } from "react-toastify";
import DeleteConfirmModal from "../../components/deleteConfirmModal";
import { useGetAllBusinessesForDropdown } from "@/app/hooks/useBusiness";
import { SearchableBusinessDropdown } from "../../components/searchable-business-dropdown";
import { formatTimeAgo } from "@/lib/utils/dateUtils";

interface TicketsTableProps {
    dateRange?: DateRange;
}

export default function AdminTicketsTable({ dateRange }: TicketsTableProps) {
    const router = useRouter();
    const { businessId } = useUserStore();
    const [activeCategory, setActiveCategory] = useState<string | undefined>('');
    const [activePriority, setActivePriority] = useState<string | undefined>('');
    const [activeBusinessId, setActiveBusinessId] = useState<string | undefined>('');
    const [activeTab, setActiveTab] = useState<TicketTab>(TicketTab.ALL);
    const [search, setSearch] = useState<string>('');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
    const updateTicket = useUpdateTicket()
    const deleteTicket = useDeleteTicket()
    const { data: allBusinesses } = useGetAllBusinessesForDropdown()

    const limit = 10;
    const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useGetAdminTickets({ limit });

    const allTickets = useMemo(() => {
        return data?.pages.flatMap(page => page.tickets || []) || [];
    }, [data]);

    const date = dateRange;

    const tickets = useMemo(() => {
        if (allTickets.length === 0) return [];

        const querySearch = search.trim().toLowerCase();
        let filteredTickets = [...allTickets];

        if (querySearch) {
            filteredTickets = filteredTickets.filter((o: Ticket) => {
                const orderNum = String(o.orderNumber ?? o.id ?? '').toLowerCase();
                const ticketNum = String(o.ticketNumber ?? o.id ?? '').toLowerCase();
                return orderNum.includes(querySearch) || ticketNum.includes(querySearch);
            });
        }
        switch (activePriority) {
            case TicketPriority.LOW:
                filteredTickets = filteredTickets.filter(
                    (t) => t.priority === TicketPriority.LOW
                );
                break;

            case TicketPriority.MEDIUM:
                filteredTickets = filteredTickets.filter(
                    (t) => t.priority === TicketPriority.MEDIUM
                );
                break;

            case TicketPriority.HIGH:
                filteredTickets = filteredTickets.filter(
                    (t) => t.priority === TicketPriority.HIGH
                );
                break;

            default:
                break;
        }
        switch (activeCategory) {
            case TicketCategory.ACCOUNT:
                filteredTickets = filteredTickets.filter(
                    (t) => t.category === TicketCategory.ACCOUNT
                );
                break;

            case TicketCategory.BILLING:
                filteredTickets = filteredTickets.filter(
                    (t) => t.category === TicketCategory.BILLING
                );
                break;

            case TicketCategory.DISPATCH:
                filteredTickets = filteredTickets.filter(
                    (t) => t.category === TicketCategory.DISPATCH
                );
                break;

            case TicketCategory.ORDERS:
                filteredTickets = filteredTickets.filter(
                    (t) => t.category === TicketCategory.ORDERS
                );
                break;

            default:
                break;
        }
        if (activeBusinessId) {
            filteredTickets = filteredTickets.filter(
                (t) => t.businessId === activeBusinessId
            );
        }

        if (date && (date.from || date.to)) {
            const from = startOfDay(date.from!);
            const to = endOfDay(date.to!);
            if (from || to) {
                filteredTickets = filteredTickets.filter((o) => {
                    if (!o.createdAt) return false;
                    const t = new Date(o.createdAt).getTime();
                    return t >= (from?.getTime() ?? -Infinity) &&
                        t <= (to?.getTime() ?? Infinity);
                });
            }
        }

        return filteredTickets;

    }, [allTickets, search, date, activePriority, activeCategory, activeBusinessId]);

    const filteredTickets = useMemo(() => {
        if (!tickets) return [];
        let filtered = [...tickets];

        if (activeTab !== TicketTab.ALL) {
            switch (activeTab) {
                case TicketTab.OPEN:
                    filtered = filtered.filter(o => o.status === TicketStatus.OPEN)
                    break;
                case TicketTab.WAITING:
                    filtered = filtered.filter(o => o.status === TicketStatus.WAITING)
                    break;

                case TicketTab.IN_PROGRESS:
                    filtered = filtered.filter(o => o.status === TicketStatus.IN_PROGRESS)
                    break;

                case TicketTab.RESOLVED:
                    filtered = filtered.filter(o => o.status === TicketStatus.RESOLVED)
                    break;

                case TicketTab.CLOSED:
                    filtered = filtered.filter(o => o.status === TicketStatus.CLOSED)
                    break;
            }
        }

        return filtered;
    }, [tickets, activeTab]);

    const ticketsCount = tickets?.length || 0;
    const openCount = tickets?.filter((o: Ticket) => o.status && (o.status === TicketStatus.OPEN)).length || 0;
    const waitingCount = tickets?.filter((o: Ticket) => o.status && (o.status === TicketStatus.WAITING)).length || 0;
    const inProgressCount = tickets?.filter((o: Ticket) => o.status && (o.status === TicketStatus.IN_PROGRESS)).length || 0;
    const closedCount = tickets?.filter((o: Ticket) => o.status && (o.status === TicketStatus.CLOSED)).length || 0;
    const resolvedCount = tickets?.filter((o: Ticket) => o.status && (o.status === TicketStatus.RESOLVED)).length || 0;

    const updateTicketData = async (ticketId: string, status: string | null, priority: string | null) => {
        try {
            if (!ticketId) {
                toast.error('Ticket ID is missing');
                return;
            }
            const body: Partial<Ticket> = { businessId: businessId! };

            if (status !== null) {
                body.status = status as TicketStatus;
            }

            if (priority !== null) {
                body.priority = priority as TicketPriority;
            }

            const result = await updateTicket.mutateAsync({
                id: ticketId,
                data: body as Ticket
            });
            if (result.success) {
                toast.success('Ticket updated successfully');
            } else {
                toast.error(result.message || 'Failed to update ticket');
            }
        }
        catch (error) {
            console.error('Update ticket error:', error);
            toast.error('Failed to update ticket');
        }

    }
    const deleteTicketData = async (ticketId: string) => {
        try {
            if (!ticketId) {
                toast.error('Ticket ID is missing');
                return;
            }
            const result = await deleteTicket.mutateAsync({
                id: ticketId,
                businessId: businessId!
            });
            if (result.success) {
                toast.success('Ticket deleted successfully');
            } else {
                toast.error(result.message || 'Failed to delete ticket');
            }
        }
        catch (error) {
            console.error('Delete ticket error:', error);
            toast.error('Failed to delete ticket');
        }
    }

    const supportColumns: ColumnDef<Ticket>[] = [
        {
            key: "ticketNumber",
            label: "Ticket ID",
            width: "pl-0 w-25 min-w-25",
            render: (value) => value,
        },
        {
            key: "subject",
            label: "Subject",
            width: "w-90 min-w-90",
            render: (value) =>
                value && value.length > 40 ? value.slice(0, 40) + "..." : value,
        },
        {
            key: "category",
            label: "Category",
            width: "w-35 min-w-35",
            render: (value) => <span className="capitalize">{value}</span>,
        },
        {
            key: "orderNumber",
            label: "Order",
            width: "w-35 min-w-35",
            render: (value) => 'OD:' + value,
        },
        {
            key: "status",
            label: "Status",
            width: "w-35 min-w-35",
            render: (_value, row: Ticket) => (
                <TicketStatusBadge ticket={row} />
            ),
        },
        {
            key: "priority",
            label: "Priority",
            width: "w-35 min-w-35",
            render: (value, ticket: Ticket) => <div className={`capitalize flex items-center gap-1 text-sm 
            ${ticket.priority === TicketPriority.HIGH ? 'text-text-1' : 'text-text-2'} font-normal`}>
                {ticket.priority === TicketPriority.HIGH && <ArrowUp className="h-4 w-4 text-[#D71710]" />}
                {ticket.priority === TicketPriority.LOW && <ArrowDown className="h-4 w-4 text-[#F46B10]" />}
                {ticket.priority === TicketPriority.MEDIUM && <ChevronsDownUp className="h-4 w-4 text-icon" />}
                {value}
            </div>
        },
        {
            key: "updatedAt",
            label: "Updated",
            width: "w-35 min-w-35",
            render: (value: Date) => formatTimeAgo(value),
        },
        {
            key: "action",
            label: "Action",
            align: "left",
            stickyRight: true,
            width: "w-35 min-w-35",
            render: (_value, ticket: Ticket) => (
                <div className="flex gap-4 items-center justify-start">
                    <Button
                        onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/fleet/manage-support/${ticket.id}`)
                        }}
                        className="min-w-20 bg-white border border-border text-text-sidebar hover:bg-white/50"
                    >
                        View
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center justify-center p-1 rounded-md transition-colors outline-none">
                                <MoreHorizontal className="h-6 w-6 text-[#1e293b] cursor-pointer hover:opacity-70 transition-opacity" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-45 p-1.5 border border-border rounded-lg">
                            {Object.values(TicketStatus)
                                .filter(status => ticket.status !== status)
                                .map(status => (
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            updateTicketData(ticket.id!, status, null)
                                        }}
                                        key={status}
                                        className="px-2 py-2 h-10 hover:font-medium hover:text-text-1 text-text-2 text-sm font-normal hover:bg-[#f1f5f9] rounded-lg cursor-pointer">
                                        Mark as {status}
                                    </DropdownMenuItem>
                                ))}
                            <Separator className='bg-border' />
                            {Object.values(TicketPriority)
                                .filter(priority => ticket.priority !== priority)
                                .map(priority => (
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            updateTicketData(ticket.id!, null, priority)
                                        }}
                                        key={priority}
                                        className="px-2 py-2 h-10 hover:font-medium hover:text-text-1 text-text-2 text-sm font-normal hover:bg-[#f1f5f9]
                                     rounded-lg cursor-pointer capitalize flex items-center gap-1">
                                        {priority === TicketPriority.HIGH && <ArrowUp className="h-4 w-4 text-[#D71710]" />}
                                        {priority === TicketPriority.LOW && <ArrowDown className="h-4 w-4 text-[#F46B10]" />}
                                        {priority === TicketPriority.MEDIUM && <ChevronsDownUp className="h-4 w-4 text-icon" />}
                                        {priority} Priority
                                    </DropdownMenuItem>
                                ))}
                            <Separator className='bg-border' />
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setTicketToDelete(ticket)
                                    setDeleteModalOpen(true)
                                }}
                                className="px-2 py-2 h-10 hover:font-medium text-[#EA332D] text-sm font-normal rounded-lg cursor-pointer">
                                <Trash className="text-[#EA332D]" width={24} height={24} /> Delete Ticket
                            </DropdownMenuItem>

                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

            ),
        },
    ]


    return (
        <>
        <DeleteConfirmModal
            open={deleteModalOpen}
            onClose={() => {
                setDeleteModalOpen(false);
                setTicketToDelete(null);
            }}
            onConfirm={() => {
                if (ticketToDelete?.id) deleteTicketData(ticketToDelete.id)
                setDeleteModalOpen(false);
                setTicketToDelete(null);
            }}
            description={`Are you sure you want to delete ticket ${ticketToDelete?.ticketNumber ?? ticketToDelete?.id}? This action cannot be undone.`}
        />
        <div className='px-4 py-4'>
            <div className="space-y-4 border border-border rounded-[20px] bg-background">
                <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as TicketTab)} className="w-full py-4 gap-0">
                    <TabsList className="bg-transparent rounded-none w-inherit justify-start h-auto px-6 py-0 gap-4 ">
                        <TabsTrigger value={TicketTab.ALL}
                            className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                            All ({ticketsCount})
                        </TabsTrigger>
                        <TabsTrigger value={TicketTab.OPEN}
                            className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                            Open ({openCount})
                        </TabsTrigger>
                        <TabsTrigger value={TicketTab.WAITING}
                            className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                            Waiting ({waitingCount})
                        </TabsTrigger>
                        <TabsTrigger value={TicketTab.IN_PROGRESS}
                            className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                            In Progress ({inProgressCount})
                        </TabsTrigger>
                        <TabsTrigger value={TicketTab.RESOLVED}
                            className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                            Resolved ({resolvedCount})
                        </TabsTrigger>
                        <TabsTrigger value={TicketTab.CLOSED}
                            className="rounded-none  px-1 py-2 text-sm text-text-2 font-medium
                                     data-[state=active]:text-text-1
                                    data-[state=active]:border-b-2
                                     data-[state=active]:border-b-primary ">
                            Closed ({closedCount})
                        </TabsTrigger>
                    </TabsList>
                    <div className="border-t border-border mt-0 flex flex-col lg:flex-row justify-between items-center gap-4 pt-5 py-4 px-6 ">
                        <div className="relative w-full lg:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-3" />
                            <Input
                                placeholder="Search Tickets..."
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
                                onChange={(value, id) => {
                                    console.log('Selected business:', { value, id });
                                    setActiveBusinessId(id)
                                }}
                                placeholder="Search or select business..."
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-30 text-text-sidebar border border-border font-medium text-sm gap-2 justify-between"
                                    >
                                        <span>{activeCategory || 'Category'}</span>
                                        <ChevronDown className="h-4 w-4 shrink-0" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 p-1.5" align="end">
                                    <DropdownMenuRadioGroup value={activeCategory} onValueChange={setActiveCategory}>
                                        {["All", ...Object.values(TicketCategory)].map((option) => (
                                            <DropdownMenuRadioItem
                                                key={option}
                                                value={option}
                                                className={cn(
                                                    "relative flex cursor-pointer select-none items-center rounded-lg h-10 px-3 text-sm outline-none transition-colors",
                                                    "focus:bg-slate-100 focus:text-text-sidebar",
                                                    "data-[state=checked]:bg-slate-100 data-[state=checked]:text-text-sidebar data-[state=checked]:font-medium",
                                                    activeCategory !== option && "text-text-2",
                                                    "[&>span]:hidden"
                                                )}
                                            >
                                                {option}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-30 text-text-sidebar border border-border font-medium text-sm gap-2 justify-between"
                                    >
                                        <span>{activePriority || 'Priority'}</span>
                                        <ChevronDown className="h-4 w-4 shrink-0" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 p-1.5" align="end">
                                    <DropdownMenuRadioGroup value={activePriority} onValueChange={setActivePriority}>
                                        {["All", ...Object.values(TicketPriority)].map((option) => (
                                            <DropdownMenuRadioItem
                                                key={option}
                                                value={option}
                                                className={cn(
                                                    "relative flex cursor-pointer select-none items-center rounded-lg h-10 px-3 text-sm outline-none transition-colors",
                                                    "focus:bg-slate-100 focus:text-text-sidebar",
                                                    "data-[state=checked]:bg-slate-100 data-[state=checked]:text-text-sidebar data-[state=checked]:font-medium",
                                                    activePriority !== option && "text-text-2",
                                                    "[&>span]:hidden"
                                                )}
                                            >
                                                {option}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    {(isLoading && !data) ? <Loader
                        fullScreen
                        label="Fetching Tickets"
                        description="Please wait while we load tickets information..."
                    /> :
                        <GenericTable
                            data={filteredTickets}
                            columns={supportColumns}
                            selectable={true}
                            hoverable={true}
                            emptyMessage="No tickets found"
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
                                {isFetchingNextPage ? 'Loading...' : 'View more Tickets'}
                            </Button>
                        )}
                        {!hasNextPage && allTickets.length > 0 && (
                            <p className="text-sm text-text-2">
                                All tickets loaded ({filteredTickets.length})
                            </p>
                        )}
                    </div>
                </CardFooter>
            </div>
        </div>
        </>
    )
}
