import { TicketCategory } from "../enums/ticketCategory"
import { TicketPriority } from "../enums/ticketPriority"
import { TicketStatus } from "../enums/ticketStatus"

export interface TicketMessage {
  id?: string
  ticketId: string
  senderId: string
  message: string
  attachment?: string
  createdAt?: Date
  senderName?: string
  senderRole?: string
}

export interface Ticket {
  id?: string
  businessId: string
  ticketNumber?: string
  orderNumber?: string,
  subject: string
  category: TicketCategory,
  description?: string
  status?: TicketStatus
  priority: TicketPriority
  resolvedAt?: Date | null
  createdAt?: Date
  createdBy?: string
  updatedAt?: Date
  messages?: TicketMessage[]
}
