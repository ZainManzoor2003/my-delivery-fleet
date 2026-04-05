import { NextRequest, NextResponse } from "next/server"
import prisma from '@/lib/prisma'
import { format, startOfDay, endOfDay } from 'date-fns'
import { Order } from "@/lib/types/order";

function generateCSV(orders: Order[]): string {
    if (orders.length === 0) return '';

    const headers = [
        'Order ID',
        'Customer Name',
        'Customer Phone',
        'Status',
        'Created',
        'Delivery Address',
        'Estimated Delivery',
        'Subtotal',
        'Delivery Fee',
        'Tip Amount',
        'Delivered At',
    ];

    const rows = orders.map(order => [
        `OD: ${order.orderNumber || ''}`,
        order.customerName || '',
        order.customerPhone || '',
        order.status || '',
        format(new Date(order.createdAt!), 'MMM dd, yyyy hh:mm a'),
        order.deliveryAddress?.address || '',
        order.estimatedDeliveryTime ? format(new Date(order.estimatedDeliveryTime), 'MMM dd, yyyy') : '-',
        order.customerSubTotal || '0',
        order.deliveryFee || '0',
        order.customerTip || '0',
        order.deliveredAt ? format(new Date(order.deliveredAt), 'MMM dd, yyyy hh:mm a') : '-',
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
        const orders = await prisma.order.findMany({
            where,
            include: {
                deliveryAddress: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (orders.length === 0) {
            return NextResponse.json(
                { message: "No orders found for the specified criteria" },
                { status: 404 }
            );
        }

        const csvContent = generateCSV(orders as Order[]);
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
