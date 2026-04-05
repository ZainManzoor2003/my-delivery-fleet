import prisma from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'
import { Invoice } from '@/lib/types/invoice'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get('limit') || '10')
        const offset = parseInt(searchParams.get('offset') || '0')

        const [invoices, totalCount] = await Promise.all([
            prisma.invoice.findMany({
                select: {
                    id: true,
                    invoiceNumber: true,
                    businessId: true,
                    weekStart: true,
                    weekEnd: true,
                    totalOrders: true,
                    totalDeliveryFees: true,
                    totalDriverTips: true,
                    totalCustomerDeliveryFees: true,
                    totalCustomerTips: true,
                    totalTips: true,
                    totalServiceCharges: true,
                    totalUberQuote: true,
                    cardCharges: true,
                    subscriptionFee: true,
                    smartMarketingCharges: true,
                    totalAmount: true,
                    status: true,
                    pdfUrl: true,
                    createdAt: true,
                    business: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: offset,
                take: limit,
            }),
            prisma.invoice.count(),
        ])

        const hasMore = offset + limit < totalCount

        // Transform the data to include businessName
        const transformedInvoices = invoices.map((invoice: any) => ({
            ...invoice,
            businessName: invoice.business?.name || 'N/A',
        }))
        return NextResponse.json({
            message: 'Invoices fetched successfully',
            invoices: transformedInvoices as Invoice[],
            pagination: {
                limit,
                offset,
                totalCount,
                hasMore,
            },
            success: true,
        })
    } catch (error: any) {
        console.error('Fetch invoices error:', error)

        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}
