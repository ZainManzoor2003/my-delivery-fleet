import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/client";
import { BusinessUpdateData } from "@/lib/types/business";

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

        const body: BusinessUpdateData = await req.json();

        // Ensure business exists
        const business = await prisma.business.findUnique({
            where: { id },
            include: { address: true },
        });

        if (!business) {
            return NextResponse.json(
                { error: "Business not found" },
                { status: 404 }
            );
        }

        // Separate address data from business data
        const { address: addressData, ...businessData } = body;

        // Build the business update object, excluding undefined values
        const businessUpdateData: any = {};
        if (businessData.name !== undefined) businessUpdateData.name = businessData.name;
        if (businessData.phone !== undefined) businessUpdateData.phone = businessData.phone;
        if (businessData.type !== undefined) businessUpdateData.type = businessData.type;
        if (businessData.routingPreference !== undefined) businessUpdateData.routingPreference = businessData.routingPreference;
        if (businessData.pickupInstructions !== undefined) businessUpdateData.pickupInstructions = businessData.pickupInstructions;
        if (businessData.logo !== undefined) businessUpdateData.logo = businessData.logo;

        // Update business information
        const updatedBusiness = await prisma.business.update({
            where: { id: business.id },
            data: businessUpdateData,
            include: { address: true },
        });

        // Handle address update/creation if provided
        if (addressData) {
            if (business.address) {
                // Update existing address
                await prisma.address.update({
                    where: { id: business.address.id },
                    data: {
                        address: addressData.address,
                        street: addressData.street,
                        apartment: addressData.apartment || null,
                        city: addressData.city,
                        state: addressData.state,
                        postalCode: addressData.postalCode,
                        latitude: addressData.latitude ? new Decimal(addressData.latitude) : null,
                        longitude: addressData.longitude ? new Decimal(addressData.longitude) : null,
                    },
                });
            }

            // Refetch to include updated address
            const finalBusiness = await prisma.business.findUnique({
                where: { id },
                include: { address: true },
            });

            return NextResponse.json(
                { success: true, business: finalBusiness },
                { status: 200 }
            );
        }

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

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const business = await prisma.business.findUnique({
            where: { userId: id },
            include: { address: true },
        });

        if (!business) {
            return NextResponse.json(
                { error: "Business not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, business },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching business:", error);

        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

