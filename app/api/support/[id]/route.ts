import prisma from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        if (!id) {
            return NextResponse.json(
                { message: 'Ticket ID is required' },
                { status: 400 }
            )
        }

        const ticket = await prisma.ticket.findUnique({
            where: { id },
            select: {
                id: true,
                businessId: true,
                ticketNumber: true,
                subject: true,
                category: true,
                description: true,
                priority: true,
                status: true,
                orderNumber: true,
                resolvedAt: true,
                createdAt: true,
                updatedAt: true,
                business: {
                    select: {
                        name: true,
                        user: {
                            select: {
                                firstName: true,
                            }
                        }
                    }
                },
                attachments: {
                    select: {
                        id: true,
                        fileName: true,
                        fileSize: true,
                        fileUrl: true,
                    }
                },
                messages: {
                    select: {
                        id: true,
                        ticketId: true,
                        senderId: true,
                        message: true,
                        createdAt: true,
                        sender: {
                            select: {
                                firstName: true,
                                lastName: true,
                                role: true,
                            }
                        }
                    }
                }
            },
        })

        if (!ticket) {
            return NextResponse.json(
                { message: 'Ticket not found' },
                { status: 404 }
            )
        }

        // Transform messages to include sender name and role
        const transformedTicket = {
            ...ticket,
            attachments: ticket.attachments.map(att => ({
                ...att,
                fileSize: att.fileSize ? att.fileSize.toString() : null
            })),
            messages: ticket.messages.map(msg => {
                const { sender } = msg
                const firstName = sender?.firstName || ''
                const lastName = sender?.lastName || ''
                const senderName = `${firstName} ${lastName}`.trim() || 'Unknown'

                return {
                    ...msg,
                    senderName,
                    senderRole: sender?.role || 'unknown'
                }
            })
        }

        return NextResponse.json({
            message: 'Ticket fetched successfully',
            ticket: transformedTicket,
            success: true,
        })
    } catch (error: any) {
        console.error('Fetch ticket error:', error)

        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()

        if (!id) {
            return NextResponse.json(
                { message: 'Ticket ID is required' },
                { status: 400 }
            )
        }

        const existingTicket = await prisma.ticket.findUnique({
            where: { id },
        });

        if (!existingTicket) {
            return NextResponse.json(
                { message: "Ticket not found" },
                { status: 404 }
            );
        }

        const { category, priority, status } = body

        const ticket = await prisma.ticket.update({
            where: { id },
            data: {
                ...(category && { category }),
                ...(priority && { priority }),
                ...(status && { status }),
            },
            select: {
                id: true,
                businessId: true,
                ticketNumber: true,
                subject: true,
                category: true,
                description: true,
                priority: true,
                status: true,
                orderNumber: true,
                resolvedAt: true,
                createdAt: true,
                updatedAt: true,
                messages: {
                    select: {
                        id: true,
                        ticketId: true,
                        senderId: true,
                        message: true,
                        createdAt: true,
                        sender: {
                            select: {
                                firstName: true,
                                lastName: true,
                                role: true,
                            }
                        }
                    }
                }
            },
        })

        // Transform messages to include sender name and role
        const transformedTicket = {
            ...ticket,
            messages: ticket.messages.map(msg => {
                const { sender } = msg
                const firstName = sender?.firstName || ''
                const lastName = sender?.lastName || ''
                const senderName = `${firstName} ${lastName}`.trim() || 'Unknown'

                return {
                    ...msg,
                    senderName,
                    senderRole: sender?.role || 'unknown'
                }
            })
        }

        return NextResponse.json({
            message: 'Ticket updated successfully',
            ticket: transformedTicket,
            success: true,
        })
    } catch (error: any) {
        console.error('Update ticket error:', error)

        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        if (!id) {
            return NextResponse.json(
                { message: 'Ticket ID is required' },
                { status: 400 }
            )
        }
        const existingTicket = await prisma.ticket.findUnique({
            where: { id },
        });

        if (!existingTicket) {
            return NextResponse.json(
                { message: "Ticket not found" },
                { status: 404 }
            );
        }

        await prisma.ticket.delete({
            where: { id },
        })

        return NextResponse.json({
            message: 'Ticket deleted successfully',
            success: true,
        })
    } catch (error: any) {
        console.error('Delete ticket error:', error)

        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}
