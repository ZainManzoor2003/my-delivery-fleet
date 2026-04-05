'use client'
import { Ticket, TicketMessage } from '@/lib/types/ticket'
import { ArrowLeft, ArrowUp, ArrowDown, ChevronsDownUp, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import TicketStatusBadge from './ticketStatusBadge'
import { formatUTCLocal } from '@/lib/timezone'
import { TicketPriority } from '@/lib/enums/ticketPriority'
import { Separator } from '@/components/ui/separator'
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TicketCategory } from '@/lib/enums/ticketCategory'
import { TicketStatus } from '@/lib/enums/ticketStatus'
import { useAddTicketMessage, useDeleteTicket, useUpdateTicket } from '@/app/hooks/useSupport'
import { useEffect, useState } from 'react'
import DeleteConfirmModal from './deleteConfirmModal'
import { toast } from 'react-toastify'
import { useUserStore } from '@/app/stores/userStore'
import { Role } from '@/lib/enums/role'

interface Props {
    ticket: any
}

export default function TicketDetail({ ticket }: Props) {
    const router = useRouter()
    const { userId, businessId, role } = useUserStore()

    const getAvailableStatuses = () => {
        return Object.values(TicketStatus)
    }

    const availableStatuses = getAvailableStatuses()
    const updateTicket = useUpdateTicket()
    const addTicketMessage = useAddTicketMessage()
    const deleteTicket = useDeleteTicket()
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isDeleting, setIsDeleting] = useState<boolean>(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false)
    const [isReplyingMessage, setIsReplyingMessage] = useState<boolean>(false)
    const [messageData, setMessageData] = useState({
        message: '',
        attachment: ''
    })
    const [updatedTicketData, setUpdatedTicketData] = useState({
        status: ticket.status || TicketStatus,
        category: ticket.category || TicketCategory,
        priority: ticket.priority || TicketPriority
    })

    useEffect(() => {
        setUpdatedTicketData({
            status: ticket.status,
            category: ticket.category,
            priority: ticket.priority
        })
    }, [ticket])

    const updateTicketData = async () => {
        try {
            setIsLoading(true)
            if (!ticket || !ticket.id) {
                toast.error('Ticket ID is missing');
                return;
            }
            const body: Partial<Ticket> = {
                status: updatedTicketData.status as TicketStatus,
                priority: updatedTicketData.priority,
                category: updatedTicketData.category
            }
            const result = await updateTicket.mutateAsync({
                id: ticket.id,
                data: body as Ticket
            });
            if (result.success) {
                toast.success('Ticket updated successfully');
                if (role === Role.ADMIN) {
                    router.push('/fleet/manage-support')
                } else {
                    router.push('/fleet/support')
                }
            } else {
                toast.error(result.message || 'Failed to update ticket');
            }
        }
        catch (error) {
            console.error('Update ticket error:', error);
            toast.error('Failed to update ticket');
        }
        finally {
            setIsLoading(false)
        }

    }
    const createTicketMessage = async () => {
        try {
            setIsReplyingMessage(true)
            if (!ticket || !ticket.id) {
                toast.error('Ticket ID is missing');
                return;
            }
            if (messageData.message.length <= 1) {
                toast.error('Message should be at least 1 characters')
                return
            }

            const result = await addTicketMessage.mutateAsync({
                ticketId: ticket.id,
                senderId: userId!,
                message: messageData.message
            });
            if (result.success) {
                toast.success('Message added successfully');
                setMessageData({
                    message: '',
                    attachment: ''
                })
            } else {
                toast.error(result.message || 'Failed to update ticket');
            }
        }
        catch (error) {
            console.error('Faild to reply on ticket ticket error:', error);
            toast.error('Failed to reply on ticket');
        }
        finally {
            setIsReplyingMessage(false)
        }
    }

    const deleteTicketData = async () => {
        try {
            setIsDeleting(true)
            if (!ticket || !ticket.id) {
                toast.error('Ticket ID is missing');
                return;
            }
            const result = await deleteTicket.mutateAsync({
                id: ticket.id,
                businessId: businessId!
            });
            if (result.success) {
                toast.success('Ticket deleted successfully');
                router.push('/fleet/support');
            } else {
                toast.error(result.message || 'Failed to delete ticket');
            }
        }
        catch (error) {
            console.error('Delete ticket error:', error);
            toast.error('Failed to delete ticket');
        }
        finally {
            setIsDeleting(false)
        }
    }
    return (
        <>
            <DeleteConfirmModal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={() => {
                    setDeleteModalOpen(false)
                    deleteTicketData()
                }}
                isLoading={isDeleting}
                description={`Are you sure you want to delete ticket ${ticket.ticketNumber}? This action cannot be undone.`}
            />
            <div className="min-h-screen py-5">
                <div className="px-4">
                    <button
                        className="flex items-center text-md font-medium text-text-sidebar">
                        <ArrowLeft
                            className="h-6 w-6 mr-2 hover:text-text-sidebar/70 cursor-pointer transition-colors"
                            onClick={() => role === Role.ADMIN ? router.push('/fleet/manage-support') : router.push('/fleet/support')}
                        />
                        Back to Support
                    </button>
                    <div className="py-10">
                        <h1 className="text-xl font-medium text-text-sidebar">Ticket {ticket.ticketNumber}</h1>
                        <div className="flex flex-wrap justify-between gap-2">
                            <div className="flex gap-2 mt-2 items-center">
                                <TicketStatusBadge ticket={ticket} />
                                <div className={`flex items-center gap-1 text-sm 
                                ${ticket.priority === TicketPriority.HIGH ? 'text-text-1' : 'text-text-2'} font-normal`}>
                                    {ticket.priority === TicketPriority.HIGH && <ArrowUp className="h-4 w-4 text-[#D71710]" />}
                                    {ticket.priority === TicketPriority.LOW && <ArrowDown className="h-4 w-4 text-[#F46B10]" />}
                                    {ticket.priority === TicketPriority.MEDIUM && <ChevronsDownUp className="h-4 w-4 text-icon" />}
                                    {ticket.priority}
                                </div>
                                <p className='font-normal text-md text-text-2'>{ticket.subject}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col lg:flex-row px-4 gap-6">
                    <div className='min-w-0 flex-[1.6] space-y-4'>
                        <div className=" space-y-4 py-6 bg-background border border-border rounded-[20px]">
                            <div className="relative flex justify-center items-center py-2">
                                <Separator className="absolute w-full" />
                                <span className="relative bg-background px-3 text-xs font-normal text-text-2">
                                    Ticket created by <span className="text-text-1">{ticket.business.user.firstName}</span>
                                </span>
                            </div>
                            <div className="space-y-6 px-4">
                                <div className='h-100 overflow-y-auto space-y-5'>
                                    {ticket.attachments.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-text-1">Attachments ({ticket.attachments.length}):</p>
                                            <div className="space-y-2">
                                                {ticket.attachments.map((file: any) => (
                                                    <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-text-1 truncate">
                                                                {file.fileName}
                                                            </p>
                                                            <p className="text-xs text-text-2">
                                                                {file.fileSize ? `${(Number(file.fileSize) / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            variant='outline'
                                                            onClick={() => {
                                                                const url = file.fileUrl;
                                                                window.open(url, '_blank');
                                                            }}>
                                                            View
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {ticket.messages?.length > 0 ? ticket.messages.map((message: TicketMessage) => (
                                        <div key={message.id} className='space-y-3'>
                                            <div className="space-y-2">
                                                <div>
                                                    <h4 className="font-medium text-sm text-text-1">
                                                        {message.senderName || 'Unknown'} {message.senderRole === Role.ADMIN && '(Admin)'}
                                                    </h4>
                                                    <span className="text-sm text-text-2">{message.createdAt && formatUTCLocal(message.createdAt, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })}</span>
                                                </div>
                                                <p className="text-sm text-text-2 font-normal">
                                                    {message.message}
                                                </p>
                                            </div>
                                            <Separator className="bg-border" />
                                        </div>
                                    ))
                                        :
                                        <p className="text-sm text-center text-text-2 font-normal">No messages yet</p>
                                    }
                                </div>
                                {ticket.status !== TicketStatus.CLOSED &&
                                    <div className="space-y-6 pt-10">
                                        <Textarea
                                            placeholder="Write your message ..."
                                            className="p-4 min-h-36 rounded-2xl border-border"
                                            value={messageData.message}
                                            onChange={(e) => setMessageData(pre => ({ ...pre, message: e.target.value }))}
                                        />
                                        <div className="flex justify-end items-center">
                                            <Button
                                                className="rounded-xl px-8"
                                                disabled={isReplyingMessage}
                                                onClick={() => createTicketMessage()}>
                                                {isReplyingMessage ?
                                                    <>
                                                        <Loader2 className="h-5 w-5 animate-spin" />Replying...
                                                    </>
                                                    :
                                                    'Reply'}
                                            </Button>
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>

                        {ticket.status === TicketStatus.CLOSED && <p className='text-center text-lg text-text-1 font-normal'>
                            This ticket has been closed and is now read-only.</p>}
                    </div>
                    <div className="min-w-0 h-fit flex-[1.2] flex flex-col space-y-4 border border-border rounded-xl text-sm px-6 py-6 bg-background">
                        <h2 className="text-lg font-medium text-text-sidebar">Ticket Summary</h2>

                        <div className="space-y-6 pt-2">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase text-icon">Created Date</p>
                                <p className="text-sm font-normal text-text-sidebar">{ticket.createdAt && formatUTCLocal(ticket.createdAt, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                })}</p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase text-icon">Created By</p>
                                <p className="text-sm font-normal text-text-sidebar">{ticket.business.name || "N/A"}</p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase text-icon">Linked Order</p>
                                <p className="text-sm font-normal text-text-sidebar">ORD-{ticket.orderNumber}</p>
                            </div>
                        </div>
                        {ticket.status !== TicketStatus.CLOSED &&
                            <>
                                <div className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-text-2">Status</p>
                                        <Select value={updatedTicketData.status as string}
                                            disabled={role === Role.BUSINESS}
                                            onValueChange={(value) =>
                                                setUpdatedTicketData(prev => ({
                                                    ...prev,
                                                    status: value as TicketStatus
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="w-full rounded-xl border-border text-text-2 bg-transparent">
                                                <SelectValue placeholder="Select an Options" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableStatuses.map((status) => (
                                                    <SelectItem className='capitalize' key={status} value={status}>
                                                        {status}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-text-2">Priority</p>
                                        <Select value={updatedTicketData.priority}
                                            disabled={role === Role.BUSINESS}
                                            onValueChange={(value) =>
                                                setUpdatedTicketData(prev => ({
                                                    ...prev,
                                                    priority: value as TicketPriority
                                                }))
                                            }>
                                            <SelectTrigger className="w-full rounded-xl border-border text-text-2 bg-transparent">
                                                <SelectValue placeholder="Select an Options" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.values(TicketPriority).map((priority) => (
                                                    <SelectItem key={priority} value={priority}>
                                                        {priority}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-text-2">Category</p>
                                        <Select value={updatedTicketData.category}
                                            disabled={role === Role.BUSINESS}
                                            onValueChange={(value) =>
                                                setUpdatedTicketData(prev => ({
                                                    ...prev,
                                                    category: value as TicketCategory
                                                }))
                                            }>
                                            <SelectTrigger className="w-full rounded-xl border-border text-text-2 bg-transparent">
                                                <SelectValue placeholder="Select an Options" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.values(TicketCategory).map((category) => (
                                                    <SelectItem key={category} value={category}>
                                                        {category}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4">
                                    {role === Role.ADMIN &&
                                        <Button
                                            className="w-full rounded-xl"
                                            disabled={isDeleting || isLoading}
                                            onClick={() => updateTicketData()}>
                                            {isLoading ?
                                                <>
                                                    <Loader2 className="h-5 w-5 animate-spin" />Updating Ticket... </>
                                                : 'Apply Changes'}
                                        </Button>
                                    }
                                    <Button
                                        onClick={() => setDeleteModalOpen(true)}
                                        disabled={isDeleting || isLoading}
                                        variant="outline"
                                        className="w-full border-border text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl">
                                        {isDeleting ?
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />Deleting Ticket... </>
                                            : 'Delete Ticket'}
                                    </Button>
                                </div>
                            </>
                        }
                    </div>
                </div>
            </div >
        </>
    )
}
