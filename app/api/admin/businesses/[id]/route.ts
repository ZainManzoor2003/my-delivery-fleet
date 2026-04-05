import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
        }

        const business = await prisma.business.findUnique({
            where: { id },
            include: {
                address: true,
                paymentMethod: true,
            },
        });

        if (!business) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const [totalOrdersRaw, oldestOrder] = await Promise.all([
            prisma.order.count({ where: { businessId: id } }),
            prisma.order.findFirst({
                where: { businessId: id },
                orderBy: { createdAt: 'asc' },
                select: { createdAt: true },
            }),
        ]);

        const totalOrders = Number(totalOrdersRaw);

        let actualAvgOrdersPerDay: number | null = null;
        if (oldestOrder) {
            const msPerDay = 1000 * 60 * 60 * 24;
            const daysSinceFirst = Math.max(
                1,
                Math.ceil((Date.now() - new Date(oldestOrder.createdAt).getTime()) / msPerDay)
            );
            actualAvgOrdersPerDay = Math.round((totalOrders / daysSinceFirst) * 10) / 10;
        }

        // Serialize Decimal and BigInt fields to primitives for JSON
        const serialized = JSON.parse(
            JSON.stringify(business, (_, v) =>
                typeof v === 'bigint' ? Number(v) : v
            )
        );

        return NextResponse.json({
            success: true,
            business: serialized,
            stats: {
                totalOrders,
                actualAvgOrdersPerDay,
            },
        });
    } catch (error) {
        console.error("Error fetching business:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
