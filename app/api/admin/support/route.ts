import prisma from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = parseInt(searchParams.get('offset') || '0')

        const [tickets, totalCount] = await Promise.all([
            prisma.ticket.findMany({
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
            prisma.ticket.count(),
        ])

        const hasMore = offset + limit < totalCount

        return NextResponse.json({
            message: 'Tickets fetched successfully for all businesses',
            tickets,
            pagination: {
                limit,
                offset,
                totalCount,
                hasMore,
            },
            success: true,
        })
    } catch (error: any) {
        console.error('Fetch tickets for all businesses error:', error)

        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}
