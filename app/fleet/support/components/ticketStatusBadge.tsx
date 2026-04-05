import { Badge } from "@/components/ui/badge";
import { TicketStatus } from "@/lib/enums/ticketStatus";
import { Ticket } from '@/lib/types/ticket';

export default function TicketStatusBadge({ ticket }: { ticket: Ticket }) {
    const getStatusColor = (status: string) => {
        switch (true) {
            case status.startsWith(TicketStatus.OPEN):
                return "border-[#FF7A21] text-text-1 bg-orange-100"
            case status.startsWith(TicketStatus.WAITING):
                return " border-[#0EA5E9] text-text-1 bg-blue-200"
            case status.startsWith(TicketStatus.IN_PROGRESS):
                return "border-[#EC4899] text-text-1 bg-pink-100"
            case status.startsWith(TicketStatus.CLOSED):
                return "border-[#94A3B8] text-text-1 bg-gray-200"
            case status.startsWith(TicketStatus.RESOLVED):
                return "border-[#0CB236] text-text-1 bg-green-200"
            default:
                return "border-[#FF7A21] text-text-1 bg-orange-100"
        }
    }

    return (
        <Badge variant="outline" className={`text-xs px-3 py-1 uppercase font-medium rounded-md ${getStatusColor(ticket.status)}`}>
            {ticket.status}
        </Badge>
    )
}
