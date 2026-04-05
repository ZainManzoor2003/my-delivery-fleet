import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/client";

interface BusinessUpdateSchema {
    surchargeBaseQuote?: Decimal;
    surchargeExtendedQuote?: Decimal;
    surchargeCatering?: Decimal;
    surchargeRetail?: Decimal;
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json(
                { error: "Invalid business ID" },
                { status: 400 }
            );
        }

        const body: BusinessUpdateSchema = await req.json();

        const business = await prisma.business.findUnique({
            where: { id },
        });

        if (!business) {
            return NextResponse.json(
                { error: "Business not found" },
                { status: 404 }
            );
        }

        const updatedBusiness = await prisma.business.update({
            where: { id: business.id },
            data: body,
        });

        return NextResponse.json(
            { success: true, business: updatedBusiness },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating business:", error);

        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
