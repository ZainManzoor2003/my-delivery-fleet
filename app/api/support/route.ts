import prisma from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'
import crypto from 'crypto'
import { TicketStatus } from '@/lib/enums/ticketStatus'
import { Ticket } from '@/lib/types/ticket'

function generateTicketNumber(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    const randomBytes = crypto.randomBytes(5)
    for (let i = 0; i < 5; i++) {
        result += chars[randomBytes[i] % chars.length]
    }
    return '#' + result
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()

        const {
            businessId,
            subject,
            category,
            description,
            priority,
            orderId,
            attachments,
        } = body

        if (
            !businessId ||
            !orderId ||
            !subject ||
            !category ||
            !priority ||
            !description
        ) {
            return NextResponse.json(
                { message: 'Missing required fields: businessId, orderId, subject, description, category, priority' },
                { status: 400 }
            )
        }

        const ticketNumber = generateTicketNumber()

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                orderNumber: true,
            }
        })

        if (!order) {
            return NextResponse.json(
                { message: "No order exists with the provided ID" },
                { status: 404 }
            )
        }

        const ticket = await prisma.ticket.create({
            data: {
                businessId,
                ticketNumber,
                subject,
                category,
                description: description || '',
                priority,
                status: TicketStatus.OPEN,
                orderId: order.id,
                orderNumber: order.orderNumber,
                messages: {
                    create: []
                },
                attachments: attachments && attachments.length > 0 ? {
                    create: attachments.map((attachment: any) => ({
                        fileName: attachment.fileName,
                        fileSize: attachment.fileSize ? BigInt(attachment.fileSize) : null,
                        fileUrl: attachment.fileUrl,
                        type: attachment.type
                    }))
                } : undefined
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
                orderId: true,
                orderNumber: true,
                resolvedAt: true,
                createdAt: true,
                updatedAt: true,
            },
        })

        return NextResponse.json(
            { success: true, message: 'Ticket created successfully', ticket: ticket as Ticket },
            { status: 201 }
        )
    } catch (error: any) {
        console.error('Create ticket error:', error)

        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const businessId = searchParams.get('businessId')
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = parseInt(searchParams.get('offset') || '0')

        if (!businessId) {
            return NextResponse.json(
                { message: 'businessId query param is required' },
                { status: 400 }
            )
        }

        const whereClause: any = {
            businessId,
        }

        const [tickets, totalCount] = await Promise.all([
            prisma.ticket.findMany({
                where: whereClause,
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
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: offset,
                take: limit,
            }),
            prisma.ticket.count({
                where: whereClause,
            }),
        ])

        const hasMore = offset + limit < totalCount

        return NextResponse.json({
            message: 'Tickets fetched successfully',
            tickets: tickets as Ticket[],
            pagination: {
                limit,
                offset,
                totalCount,
                hasMore,
            },
            success: true,
        })
    } catch (error: any) {
        console.error('Fetch tickets error:', error)

        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}
