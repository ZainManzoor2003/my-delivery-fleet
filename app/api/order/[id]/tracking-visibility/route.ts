import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json(
                { message: "Order ID is required" },
                { status: 400 }
            );
        }

        const { isClearedFromTracking }: { isClearedFromTracking: boolean } = await req.json();

        const existingOrder = await prisma.order.findUnique({
            where: { id },
            select: { id: true, businessId: true },
        });

        if (!existingOrder) {
            return NextResponse.json(
                { message: "Order not found" },
                { status: 404 }
            );
        }

        const order = await prisma.order.update({
            where: { id },
            data: { isClearedFromTracking },
            select: {
                id: true,
                businessId: true,
                isClearedFromTracking: true,
            },
        });

        return NextResponse.json(
            { success: true, message: "Tracking visibility updated", order },
            { status: 200 }
        );
    } catch (error) {
        console.error("Tracking visibility update error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
