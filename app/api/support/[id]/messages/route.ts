import prisma from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse, NextRequest } from 'next/server'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()

        const { message } = body

        const { userId } = await auth()

        if (!id) {
            return NextResponse.json(
                { message: 'Ticket ID is required' },
                { status: 400 }
            )
        }

        if (!message || !userId) {
            return NextResponse.json(
                { message: 'Message and senderId are required' },
                { status: 400 }
            )
        }
        // Create the message
        await prisma.ticketMessage.create({
            data: {
                ticketId: id,
                senderId: userId,
                message,
            },
            select: {
                id: true,
                ticketId: true,
                senderId: true,
                message: true,
                createdAt: true,
            }
        })

        // Get the updated messages with sender information
        const updatedMessages = await prisma.ticketMessage.findMany({
            where: { ticketId: id },
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
            },
            orderBy: { createdAt: 'asc' },
        })

        // Transform messages to include sender name and role
        const transformedMessages = updatedMessages.map(msg => {
            const { sender } = msg
            const firstName = sender?.firstName || ''
            const lastName = sender?.lastName || ''
            const senderName = `${firstName} ${lastName}`.trim() || 'Unknown'

            return {
                id: msg.id,
                ticketId: msg.ticketId,
                senderId: msg.senderId,
                message: msg.message,
                createdAt: msg.createdAt,
                senderName,
                senderRole: sender?.role || 'unknown'
            }
        })

        return NextResponse.json({
            message: 'Message added successfully',
            messages: transformedMessages,
            success: true,
        }, { status: 201 })
    } catch (error: any) {
        console.error('Add message error:', error)

        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}
