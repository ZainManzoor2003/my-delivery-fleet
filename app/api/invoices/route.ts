import prisma from "@/lib/prisma"
import { Invoice } from "@/lib/types/invoice"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const businessId = searchParams.get("businessId")
        const limit = parseInt(searchParams.get("limit") || "10")
        const offset = parseInt(searchParams.get("offset") || "0")
        const minimal = searchParams.get("minimal") === "true" ? true : false

        if (!businessId) {
            return NextResponse.json({ message: "businessId query param is required" }, { status: 400 })
        }

        const selectFields = {
            id: true,
            invoiceNumber: true,
            businessId: true,
            weekStart: true,
            weekEnd: true,
            totalOrders: true,
            subscriptionFee: true,
            totalAmount: true,
            totalDeliveryFees: true,
            totalCustomerDeliveryFees:true,
            totalCustomerTips:true,
            totalTips:true,
            totalDriverTips: true,
            cardCharges: true,
            smartMarketingCharges: true,
            status: true,
            pdfUrl: true,
            createdAt: true,
            business: {
                select: {
                    name: true
                }
            },
            ...(!minimal ? {
                transactions: {
                    select: {
                        id: true,
                        amount: true,
                        type: true,
                        status: true,
                        createdAt: true,
                    }
                }
            } : {})
        }

        const whereClause = { businessId }

        const [invoices, totalCount] = await Promise.all([
            prisma.invoice.findMany({
                where: whereClause,
                select: selectFields,
                orderBy: {
                    createdAt: 'desc'
                },
                skip: offset,
                take: limit,
            }),
            prisma.invoice.count({
                where: whereClause
            })
        ])

        const hasMore = offset + limit < totalCount

        const transformedInvoices = invoices.map(invoice => ({
            ...invoice,
            businessName: invoice.business.name
        }))

        return NextResponse.json({
            message: "Invoices fetched",
            invoices: transformedInvoices as Invoice[],
            pagination: {
                limit,
                offset,
                totalCount,
                hasMore
            }
        }, { status: 200 })
    } catch (error: any) {
        console.error("Get invoices error:", error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}
