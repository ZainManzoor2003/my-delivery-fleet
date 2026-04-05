'use client'
import { Button } from "@/components/ui/button";
import {
    Calendar as CalendarIcon,
    ChevronDown,
    Plus,
} from "lucide-react";
import { DateRange } from "react-day-picker";
import {
    subDays,
    startOfWeek,
    endOfWeek,
    subWeeks,
    startOfMonth,
    endOfMonth,
    subMonths,
    startOfYear,
    endOfYear,
    subYears,
    format
} from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DownloadIcon } from "@/components/icons/download";
import { cn } from "@/lib/utils";
import TicketsTable from "./components/ticketsTable";
import { useUserStore } from "@/app/stores/userStore";
import { useExportTickets } from "@/app/hooks/useExportTickets";

export default function FleetSupportPage() {
    const router = useRouter()
    const { businessId } = useUserStore()
    const { exportTickets } = useExportTickets();
    const [isExporting, setIsExporting] = useState(false);
    const [activePreset, setActivePreset] = useState<string>("All time");

    const [date, setDate] = useState<DateRange | undefined>({
        from: undefined,
        to: undefined,
    });
    const [tempDate, setTempDate] = useState<DateRange | undefined>({
        from: undefined,
        to: undefined,
    });
    const calendarPresets = [
        "Today", "Yesterday", "This week", "Last week",
        "This month", "Last month", "This year", "Last year", "All time"
    ];
    const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
    const getButtonLabel = () => {
        if (date?.from) {
            if (date.to) {
                return `${format(date.from, "MMM dd")} - ${format(date.to, "MMM dd")}`;
            }
            return format(date.from, "MMM dd, yyyy");
        }
        return "All Time";
    };
    const handlePresetClick = (preset: string) => {
        setActivePreset(preset);

        const today = new Date();
        let range: DateRange | undefined;

        switch (preset) {
            case "Today":
                range = { from: today, to: today };
                break;
            case "Yesterday":
                range = { from: subDays(today, 1), to: subDays(today, 1) };
                break;
            case "This week":
                range = { from: startOfWeek(today), to: endOfWeek(today) };
                break;
            case "Last week":
                const lastWeek = subWeeks(today, 1);
                range = { from: startOfWeek(lastWeek), to: endOfWeek(lastWeek) };
                break;
            case "This month":
                range = { from: startOfMonth(today), to: endOfMonth(today) };
                break;
            case "Last month":
                const lastMonth = subMonths(today, 1);
                range = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
                break;
            case "This year":
                range = { from: startOfYear(today), to: endOfYear(today) };
                break;
            case "Last year":
                const lastYear = subYears(today, 1);
                range = { from: startOfYear(lastYear), to: endOfYear(lastYear) };
                break;
            case "All time":
                range = { from: undefined, to: undefined };
                break;
        }

        if (range) {
            setTempDate(range);
            setDate(range);
            setIsCalendarOpen(false);
        }
    };

    return (
        <div>
            <div className='flex flex-wrap  items-center justify-between px-4 py-5 gap-2'>
                <div className='flex items-center gap-2'>
                    <SidebarTrigger className='xl:hidden' />
                    <span className='font-medium text-md text-text-sidebar'>Support</span>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="flex h-10 items-center gap-2 border-border w-auto min-w-40 justify-between"
                            >
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="text-text-sidebar h-4 w-4" />
                                    <span className="font-medium text-text-sidebar text-sm">
                                        {getButtonLabel()}
                                    </span>
                                </div>
                                <ChevronDown className="text-text-sidebar h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 flex" align="end">
                            <div className="flex flex-col w-35 border-r gap-[0.5] p-2 bg-slate-50/50">
                                {calendarPresets.map((preset) => {
                                    const isActive = activePreset === preset;
                                    return (
                                        <Button
                                            key={preset}
                                            variant="ghost"
                                            onClick={() => {
                                                handlePresetClick(preset);
                                                setIsCalendarOpen(false);
                                            }}
                                            className={cn(
                                                "justify-start font-normal text-sm rounded-lg px-3 transition-colors",
                                                !isActive && "text-text-2 hover:bg-slate-50",
                                                isActive && "bg-slate-100 font-medium text-text-sidebar hover:bg-slate-100"
                                            )}
                                        >
                                            {preset}
                                        </Button>
                                    );
                                })}
                            </div>

                            <div className="flex flex-col">
                                <Calendar
                                    mode="range"
                                    defaultMonth={tempDate?.from || date?.from}
                                    selected={tempDate || date}
                                    onSelect={setTempDate}
                                    numberOfMonths={2}
                                    className="p-5"
                                />
                                <div className="flex items-center justify-end gap-2 p-3 border-t">
                                    <Button
                                        variant="outline"
                                        className="px-6 text-sm font-medium"
                                        onClick={() => {
                                            setTempDate(date);
                                            setIsCalendarOpen(false);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="px-6 text-sm font-medium"
                                        onClick={() => {
                                            setDate(tempDate);
                                            setIsCalendarOpen(false);
                                        }}
                                    >
                                        Apply
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Button
                        variant="outline"
                        className="flex h-10 items-center gap-2 font-normal border-border min-w-26"
                        onClick={async () => {
                            setIsExporting(true);
                            try {
                                await exportTickets({
                                    businessId: businessId as string,
                                    dateRange: (date?.from || date?.to) ? date : undefined
                                });
                            } finally {
                                setIsExporting(false);
                            }
                        }}
                        disabled={isExporting}
                    >
                        <DownloadIcon size={16} stroke='#031E42' />
                        <span className='font-medium text-text-sidebar text-sm'>
                            {isExporting ? 'Exporting...' : 'Export'}
                        </span>
                    </Button>
                    <Button className='gap-1 h-10 font-medium text-sm min-w-44'
                        onClick={() => router.push('support/new')} >
                        <Plus />
                        Create Ticket
                    </Button>
                </div>
            </div>
            <TicketsTable dateRange={date} />
        </div>
    )
}
