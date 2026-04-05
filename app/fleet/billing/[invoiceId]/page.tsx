'use client'
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader } from "@/app/components/loader";
import { useGetAdminInvoiceDetails } from "@/app/hooks/useInvoice";
import InvoiceStatusBadge from "@/app/fleet/settings/components/invoiceStatusBadge";
import GenericTable, { ColumnDef } from "@/app/components/table";
import { InvoiceStatus } from "@/lib/types/invoice";

export default function InvoiceDetailPage() {
    const router = useRouter();
    const params = useParams();
    const invoiceId = params?.invoiceId as string;

    const { data, isLoading, error } = useGetAdminInvoiceDetails(invoiceId);

    if (isLoading) {
        return (
            <Loader
                fullScreen
                label="Loading invoice details..."
                description="Please wait while we load the invoice information..."
            />
        );
    }

    if (error || !data?.success || !data?.invoice) {
        return (
            <div className="min-h-screen py-5 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">
                        {(error as any)?.message || 'Failed to load invoice details'}
                    </p>
                    <Button onClick={() => router.back()} variant="outline">
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const invoice = data.invoice;
    const orders: any[] = data.orders || [];

    const fmt = (n: any) => Number(n || 0).toFixed(2);

    const formatDate = (date: string | Date) =>
        new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

    const billingPeriod = invoice.weekStart && invoice.weekEnd
        ? `${formatDate(invoice.weekStart)} - ${formatDate(invoice.weekEnd)}`
        : 'N/A';

    // Per-column totals computed from orders
    const totalProviderQuote = orders.reduce((s, o) => s + Number(o.providerQuote || 0), 0);
    const totalServiceFee = orders.reduce((s, o) => s + Number(o.serviceFee || 0), 0);
    const totalDriverTips = orders.reduce((s, o) => s + Number(o.driverTip || 0), 0);
    const totalCustomerTips = orders.reduce((s, o) => s + Number(o.customerTip || 0), 0);
    const totalOrderFees = orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);

    // Right panel calculations (same as InvoiceDetailModal)
    const deliveryFees = Number(invoice.totalDeliveryFees || 0);
    const customerDeliveryFees = Number(invoice.totalCustomerDeliveryFees || 0);
    const driverTipsInv = Number(invoice.totalTips || 0);
    const customerTipsInv = Number(invoice.totalCustomerTips || 0);
    const smartMarketing = Number(invoice.smartMarketingCharges || 0);
    const cardChargesNum = Number(invoice.cardCharges || 0);
    const totalAmountNum = Number(invoice.totalAmount || 0);
    const trueDeliveryCost = deliveryFees + driverTipsInv - (customerDeliveryFees + customerTipsInv + smartMarketing);
    const costPerOrder = invoice.totalOrders > 0
        ? (trueDeliveryCost / invoice.totalOrders).toFixed(2)
        : '0.00';

    const orderColumns: ColumnDef<any>[] = [
        {
            key: 'orderNumber',
            label: 'Order #',
            width: 'pl-0 w-24 min-w-24',
            render: (value) => value || 'N/A',
        },
        {
            key: 'customerSubTotal',
            label: 'Customer Subtotal',
            width: 'w-32 min-w-32',
            render: (value) => `$${fmt(value)}`,
        },
        {
            key: 'customerDeliveryFee',
            label: 'Customer Delivery Fee',
            width: 'w-32 min-w-32',
            render: (value) => `$${fmt(value)}`,
        },
        {
            key: 'providerQuote',
            label: 'Uber Quote',
            width: 'w-28 min-w-28',
            render: (value) => `$${fmt(value)}`,
        },
        {
            key: 'serviceFee',
            label: 'Service Fee',
            width: 'w-28 min-w-28',
            render: (value) => `$${fmt(value)}`,
        },
        {
            key: 'driverTip',
            label: 'Add. Driver Tip',
            width: 'w-28 min-w-28',
            render: (value) => `$${fmt(value)}`,
        },
        {
            key: 'customerTip',
            label: 'Customer Tip',
            width: 'w-28 min-w-28',
            render: (value) => `$${fmt(value)}`,
        },
        {
            key: 'totalTip',
            label: 'Total Tips',
            width: 'w-28 min-w-28',
            render: (value) => `$${fmt(value)}`,
        },
        {
            key: 'totalAmount',
            label: 'Delivery Total',
            width: 'w-28 min-w-28',
            render: (value) => `$${fmt(value)}`,
        },
    ];

    return (
        <div className="min-h-screen py-5">
            <div className="px-4">
                <button className="flex items-center text-md font-medium text-text-sidebar">
                    <ArrowLeft
                        className="h-6 w-6 mr-2 hover:text-text-sidebar/70 cursor-pointer transition-colors"
                        onClick={() => router.push('/fleet/billing')}
                    />
                    Back to Invoices
                </button>
                <div className="py-10">
                    <h1 className="text-xl font-medium text-text-sidebar">Invoice #{invoice.invoiceNumber}</h1>
                    <div className="flex flex-wrap justify-between gap-2">
                        <div className="flex gap-2 mt-2 items-center">
                            <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
                            <p className="text-md text-text-2 font-normal">
                                Created at {invoice.createdAt ? formatDate(invoice.createdAt) : ''}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row px-4 gap-4">
                <main className="min-w-0 flex-[1.6] space-y-4 px-6 py-4 bg-background border border-border rounded-[20px]">
                    <div className="px-0 pt-2 pb-0">
                        <h2 className="text-lg font-medium text-text-1">Orders</h2>
                        <p className="text-sm text-text-2 mt-1">
                            {orders.length} order{orders.length !== 1 ? 's' : ''} in this invoice
                        </p>
                    </div>
                    <Separator className="bg-border" />
                    <GenericTable
                        data={orders}
                        columns={orderColumns}
                        hoverable={false}
                        emptyMessage="No orders found for this invoice"
                    />
                    {orders.length > 0 && (
                        <div className="border-t border-border pt-4 pr-6 space-y-3">
                            <div className="flex justify-between text-sm text-text-2">
                                <span>Total Uber Quote</span>
                                <span>${fmt(totalProviderQuote)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-text-2">
                                <span>Total Service Fee</span>
                                <span>${fmt(totalServiceFee)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-text-2">
                                <span>Total Customer Tips</span>
                                <span>${fmt(totalCustomerTips)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-text-2">
                                <span>Additional Driver Tips</span>
                                <span>${fmt(totalDriverTips)}</span>
                            </div>
                            <Separator className="bg-border" />
                            <div className="flex justify-between font-medium text-text-1">
                                <span>Delivery Total</span>
                                <span>${fmt(totalOrderFees)}</span>
                            </div>
                        </div>
                    )}
                </main>

                <div className="min-w-0 h-fit flex-[1.2] flex flex-col bg-background border border-border rounded-[20px] px-6 py-6 space-y-5">
                    <div className="border border-border rounded-[16px] p-4 flex justify-between items-start bg-background">
                        <div>
                            <h3 className="text-md font-medium text-text-1">{invoice.businessName}</h3>
                            <InvoiceStatusBadge status={invoice.status as InvoiceStatus} className="mt-2" />
                        </div>
                        <div className="text-right space-y-2">
                            <p className="text-text-2 font-normal text-sm">{billingPeriod}</p>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-text-2 text-sm">Orders Delivered ({invoice.totalOrders})</span>
                                <span className="text-text-2 text-sm">Free Subscription</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-0.5">
                        <div className="grid grid-cols-3 gap-2 p-3 bg-[#F1F5F9] rounded-xl mb-0.5">
                            <div />
                            <div className="text-[10px] font-medium text-text-1 uppercase tracking-wider leading-tight text-center">
                                FEES & TIPS COLLECTED<br />BY {invoice.businessName?.toUpperCase()}
                            </div>
                            <div className="text-[10px] font-medium text-text-1 uppercase tracking-wider leading-tight text-center">
                                PAYMENT TO<br />MY DELIVERY FLEET
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 px-3 py-3 items-center">
                            <span className="text-text-2 text-sm">Delivery / Dispatch Fees</span>
                            <span className="text-text-2 text-sm text-center">
                                <span className="text-green-500 mr-0.5">+</span>${fmt(customerDeliveryFees)}
                            </span>
                            <span className="text-text-2 text-sm text-center">${fmt(deliveryFees)}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 px-3 py-3 items-center">
                            <span className="text-text-2 text-sm">Tips</span>
                            <span className="text-text-2 text-sm text-center">
                                <span className="text-green-500 mr-0.5">+</span>${fmt(customerTipsInv)}
                            </span>
                            <span className="text-text-2 text-sm text-center">${fmt(driverTipsInv)}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 px-3 py-3 bg-[#F1F5F9] rounded-xl items-center">
                            <span className="text-text-1 text-sm font-medium">Delivery Total</span>
                            <span className="text-text-1 font-medium text-sm text-center">
                                <span className="text-green-500 mr-0.5">+</span>${fmt(customerDeliveryFees + customerTipsInv)}
                            </span>
                            <span className="text-text-1 font-medium text-sm text-center">
                                ${fmt(deliveryFees + driverTipsInv)}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 px-3 py-3 items-center">
                            <span className="text-text-2 text-sm">Smart Marketing</span>
                            <span className="text-text-2 text-sm text-center">-</span>
                            <span className="text-text-2 text-sm text-center">${fmt(smartMarketing)}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 px-3 py-3 bg-[#F1F5F9] rounded-xl items-center">
                            <span className="text-text-1 text-sm font-medium">Subtotal</span>
                            <span className="text-text-1 font-medium text-sm text-center">
                                <span className="text-green-500 mr-0.5">+</span>${fmt(customerDeliveryFees + customerTipsInv + smartMarketing)}
                            </span>
                            <span className="text-text-1 font-medium text-sm text-center">
                                ${fmt(deliveryFees + driverTipsInv)}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 px-3 py-3 items-center">
                            <span className="text-text-2 text-sm">Credit Card Processing</span>
                            <span className="text-text-2 text-sm text-center">-</span>
                            <span className="text-text-2 text-sm text-center">${fmt(cardChargesNum)}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 px-3 py-3 bg-[#F1F5F9] rounded-xl items-center">
                            <span className="text-text-1 text-sm font-medium">Total</span>
                            <span className="text-text-1 font-medium text-sm text-center">
                                <span className="text-green-500 mr-0.5">+</span>${fmt(customerDeliveryFees + customerTipsInv + smartMarketing)}
                            </span>
                            <span className="text-text-1 font-medium text-sm text-center">${fmt(totalAmountNum)}</span>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-border text-center">
                        <p className="text-icon font-medium text-sm">
                            Your true delivery cost was ${fmt(trueDeliveryCost)}, or ${costPerOrder} per order
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
