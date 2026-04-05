import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {

    try {
        const allBusinesses = await prisma.business.findMany({
            where: {
                status: {
                    in: ['APPROVED']
                }
            },
            select: {
                id: true,
                name: true,
                createdAt: true,
            }
        })

        if (allBusinesses.length === 0) {
            return NextResponse.json(
                { message: "No business found" },
                { status: 404 }
            )
        }

        return NextResponse.json(
            { success: true, message: "All businesses fetched successfully", allBusinesses: allBusinesses },
            { status: 200 }
        )
    } catch (error) {
        console.error("Get all businesses error:", error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}
