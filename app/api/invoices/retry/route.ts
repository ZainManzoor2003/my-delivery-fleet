import prisma from '@/lib/prisma';
import { chargeBusinessForWeeklyBilling } from '@/services/billingService';
import { InvoiceStatus } from '@/lib/enums/invoice';
import { BusinessStatus } from '@/lib/types/business';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { invoiceId } = await req.json();

        if (!invoiceId) {
            return NextResponse.json({ message: 'invoiceId is required' }, { status: 400 });
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            select: {
                id: true,
                businessId: true,
                totalAmount: true,
                totalOrders: true,
                weekStart: true,
                weekEnd: true,
                status: true,
            },
        });

        if (!invoice) {
            return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
        }

        const userBusiness = await prisma.business.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!userBusiness || userBusiness.id !== invoice.businessId) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        if (invoice.status !== InvoiceStatus.Pending && invoice.status !== InvoiceStatus.Failed) {
            return NextResponse.json(
                { message: `Invoice cannot be retried in status: ${invoice.status}` },
                { status: 400 }
            );
        }

        const description = `Retry billing for ${invoice.totalOrders} orders (${new Date(invoice.weekStart).toLocaleDateString()} - ${new Date(invoice.weekEnd).toLocaleDateString()})`;

        const result = await chargeBusinessForWeeklyBilling(
            invoice.businessId,
            Number(invoice.totalAmount),
            invoice.totalOrders,
            invoice.id,
            description
        );

        if (!result.success) {
            return NextResponse.json({ message: result.error || 'Payment failed' }, { status: 402 });
        }

        await prisma.business.update({
            where: { id: invoice.businessId },
            data: { status: BusinessStatus.APPROVED },
        });

        return NextResponse.json({ message: 'Invoice paid successfully', ...result }, { status: 200 });
    } catch (error: any) {
        console.error('Retry invoice error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
