import { Badge } from "@/components/ui/badge";
import { TicketStatus } from "@/lib/enums/ticketStatus";
import { Ticket } from '@/lib/types/ticket';

export default function TicketStatusBadge({ ticket }: { ticket: Ticket }) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case TicketStatus.OPEN:
                return "border-[#FF7A21] text-text-1 bg-orange-100"
            case TicketStatus.WAITING:
                return " border-[#1877F2] text-text-1 bg-blue-200"
            case TicketStatus.IN_PROGRESS:
                return "border-[#EC4899] text-text-1 bg-pink-100"
            case TicketStatus.CLOSED:
                return "border-[#94A3B8] text-text-1 bg-gray-200"
            case TicketStatus.RESOLVED:
                return "border-[#3FC060] text-text-1 bg-green-200"
            default:
                return "border-[#FF7A21] text-text-1 bg-orange-100"
        }
    }

    return (
        <Badge variant="outline" className={`text-xs px-3 py-1 uppercase font-medium rounded-md ${getStatusColor(ticket.status || TicketStatus.OPEN)}`}>
            {ticket.status || TicketStatus.OPEN}
        </Badge>
    )
}
