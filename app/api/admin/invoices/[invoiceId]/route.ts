import prisma from '@/lib/prisma'
import { OrderStatus } from '@/lib/types/order'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ invoiceId: string }> }
) {
    try {
        const { invoiceId } = await params

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                business: {
                    select: { name: true },
                },
            },
        })

        if (!invoice) {
            return NextResponse.json({ message: 'Invoice not found' }, { status: 404 })
        }

        const orders = await prisma.order.findMany({
            where: {
                businessId: invoice.businessId,
                status: OrderStatus.Delivered,
                deliveredAt: {
                    gte: invoice.weekStart,
                    lte: invoice.weekEnd,
                    not: null,
                },
                totalAmount: { not: null },
                paidAt: { not: null },
            },
            select: {
                id: true,
                orderNumber: true,
                customerSubTotal: true,
                customerTip: true,
                driverTip: true,
                totalTip: true,
                deliveryFee: true,
                customerDeliveryFee: true,
                serviceFee: true,
                providerQuote: true,
                totalAmount: true,
                status: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        })

        return NextResponse.json({
            invoice: {
                ...invoice,
                businessName: invoice.business?.name || 'N/A',
            },
            orders,
            success: true,
        })
    } catch (error: any) {
        console.error('Fetch invoice details error:', error)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}
