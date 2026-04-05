import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { OrderStatus } from "@/lib/types/order";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params

    if (!id) {
        return NextResponse.json(
            { message: "Business ID is required" },
            { status: 400 }
        )
    }
    try {
        const allOrders = await prisma.order.findMany({
            where: {
                businessId: id,
                status: {
                    notIn: [OrderStatus.Unassigned]
                }
            },
            select: {
                id: true,
                orderNumber: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(
            { success: true, message: "Order numbers fetched successfully", orders: allOrders },
            { status: 200 }
        )
    } catch (error) {
        console.error("Get order numbers error:", error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}