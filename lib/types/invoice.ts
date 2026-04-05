import { Decimal } from "@prisma/client/runtime/client";

export enum InvoiceStatus {
    Pending = 'pending',
    Paid = 'paid',
    Failed = 'failed',
    Processed = 'processed',
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    totalUberQuote?: Decimal;
    totalServiceCharges?: Decimal;
    businessId: string;
    businessName: string;
    weekStart: Date;
    totalCustomerTips: Decimal;
    totalTips: Decimal;
    totalCustomerDeliveryFees: Decimal;
    weekEnd: Date;
    totalOrders: number;
    totalDeliveryFees: Decimal;
    totalDriverTips: Decimal;
    cardCharges: Decimal;
    subscriptionFee: Decimal;
    smartMarketingCharges: Decimal;
    totalAmount: Decimal;
    status: InvoiceStatus;
    pdfUrl: string;
    transactions?: any[];
    createdAt: Date;
}
