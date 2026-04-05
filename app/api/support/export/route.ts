import { NextRequest, NextResponse } from "next/server"
import prisma from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'
import { Ticket } from "@/lib/types/ticket";

function generateCSV(tickets: Ticket[]): string {
    if (tickets.length === 0) return '';

    const headers = [
        'Ticket ID',
        'Subject',
        'Category',
        'Order Number',
        'Status',
        'Priority'
    ];

    const rows = tickets.map(ticket => [
        `OD: ${ticket.ticketNumber || ''}`,
        ticket.subject || '',
        ticket.category || '',
        ticket.orderNumber || '',
        ticket.status || '',
        ticket.priority || '0'
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row =>
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        )
    ].join('\n');

    return csvContent;
}

export async function POST(req: NextRequest) {
    try {
        const { businessId, fromDate, toDate } = await req.json();

        if (!businessId) {
            return NextResponse.json(
                { message: "businessId query param is required" },
                { status: 400 }
            );
        }

        const where: any = { businessId };

        if (fromDate && toDate) {
            const from = startOfDay(new Date(fromDate).toISOString());
            const to = endOfDay(new Date(toDate).toISOString());

            where.createdAt = {
                gte: from,
                lte: to,
            };
        }
        const tickets = await prisma.ticket.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (tickets.length === 0) {
            return NextResponse.json(
                { message: "No tickets found for the specified criteria" },
                { status: 404 }
            );
        }

        const csvContent = generateCSV(tickets as Ticket[]);
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv;charset=utf-8',
                'Content-Disposition': 'attachment; filename="orders-export.csv"',
            },
        });
    } catch (error: any) {
        console.error("CSV export error:", error);
        return NextResponse.json(
            { message: "Internal server error", error: error.message },
            { status: 500 }
        );
    }
}
