"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Invoice } from "@/lib/types/invoice";
import jsPDF from 'jspdf';
interface InvoiceDetailModalProps {
    invoice: Invoice | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function InvoiceDetailModal({
    invoice,
    isOpen,
    onClose
}: InvoiceDetailModalProps) {

    if (!invoice) return null;

    // Format the invoice data from API
    const weekStart = invoice.weekStart ? new Date(invoice.weekStart) : new Date();
    const weekEnd = invoice.weekEnd ? new Date(invoice.weekEnd) : new Date();

    // Format billing period
    const formatDate = (date: Date) => {
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const billingPeriod = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;

    // Use invoice data or defaults
    const invoiceData = {
        totalOrders: invoice.totalOrders || 0,
        totalDeliveryFees: invoice.totalDeliveryFees || "0.00",
        totalCustomerDeliveryFees: invoice.totalCustomerDeliveryFees || "0.00",
        totalTips: invoice.totalTips || "0.00",
        totalCustomerTips: invoice.totalCustomerTips || "0.00",
        smartMarketingCharges: invoice.smartMarketingCharges || "0.00",
        cardCharges: invoice.cardCharges || "0.00",
        totalAmount: invoice.totalAmount || "0.00",
        businessName: invoice.businessName || "Business Name", // This could come from business data
        billingPeriod: billingPeriod,
    };

    // Calculations
    const deliveryFees = Number(invoiceData.totalDeliveryFees);
    const customerDeliveryFees = Number(invoiceData.totalCustomerDeliveryFees);
    const driverTips = Number(invoiceData.totalTips);
    const customerTips = Number(invoiceData.totalCustomerTips);
    const customerTotal = customerDeliveryFees + customerTips;
    const smartMarketing = Number(invoiceData.smartMarketingCharges);
    const cardChargesNum = Number(invoiceData.cardCharges);
    const totalAmountNum = Number(invoiceData.totalAmount);

    // True Delivery Cost calculation
    const trueDeliveryCost = totalAmountNum - customerTotal;
    const costPerOrder = invoiceData.totalOrders > 0 ? (trueDeliveryCost / invoiceData.totalOrders).toFixed(2) : "0.00";

    const fmt = (n: number) => n.toFixed(2);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="md:min-w-2xl max-h-[95vh] overflow-y-auto rounded-3xl p-0">
                <VisuallyHidden>
                    <DialogTitle>Invoice Details</DialogTitle>
                </VisuallyHidden>
                <div className="p-6 space-y-6">
                    {/* Header Info Card */}
                    <div className="border border-border rounded-[20px] p-6 mt-2 flex justify-between items-start bg-background">
                        <div>
                            <h3 className="text-md font-medium text-text-1">{invoiceData.businessName}</h3>
                        </div>
                        <div className="text-right space-y-3">
                            <p className="text-text-2 font-normal text-sm">{invoiceData.billingPeriod}</p>
                            <div className="flex flex-col items-end gap-1.5">
                                <span className="text-text-2 text-sm">Orders Delivered ({invoiceData.totalOrders})</span>
                                <span className="text-text-2 text-sm">Free Subscription</span>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="space-y-0.5">
                        {/* Table Header */}
                        <div className="grid grid-cols-3 gap-4 p-3 bg-[#F1F5F9] rounded-xl mb-0.5">
                            <div></div>
                            <div className="text-[10px] font-medium text-text-1 uppercase tracking-wider leading-tight text-center">
                                FEES & TIPS COLLECTED<br />BY {invoiceData.businessName.toUpperCase()}
                            </div>
                            <div className="text-[10px] font-medium text-text-1 uppercase tracking-wider leading-tight text-center">
                                PAYMENT TO<br />MY DELIVERY FLEET
                            </div>
                        </div>

                        {/* Regular Rows */}
                        <div className="grid grid-cols-3 gap-4 p-4 items-center">
                            <span className="text-text-2 text-sm">Delivery / Dispatch Fees</span>
                            <span className="text-text-2 font-normal text-sm text-center">
                                <span className="text-green-500 mr-0.5">+</span>${fmt(customerDeliveryFees)}
                            </span>
                            <span className="text-text-2 font-normal text-sm text-center">
                                ${fmt(deliveryFees)}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 p-4 items-center">
                            <span className="text-text-2 text-sm">Tips</span>
                            <span className="text-text-2 font-normal text-sm text-center">
                                <span className="text-green-500 mr-0.5">+</span>${fmt(customerTips)}
                            </span>
                            <span className="text-text-2 font-normal text-sm text-center">
                                ${fmt(driverTips)}
                            </span>
                        </div>

                        {/* Total Row - Delivery Total */}
                        <div className="grid grid-cols-3 gap-4 p-4 bg-[#F1F5F9] rounded-xl items-center my-1">
                            <span className="text-text-1 text-sm font-medium">Delivery Total</span>
                            <span className="text-text-1 font-medium text-sm text-center">
                                <span className="text-green-500 mr-0.5">+</span>${fmt(customerDeliveryFees + customerTips)}
                            </span>
                            <span className="text-text-1 font-medium text-sm text-center">
                                ${fmt(deliveryFees + driverTips)}
                            </span>
                        </div>

                        {/* Regular Row */}
                        <div className="grid grid-cols-3 gap-4 p-4 items-center">
                            <span className="text-text-2 text-sm">Smart Marketing</span>
                            <span className="text-text-2 font-normal text-sm text-center">
                                -
                            </span>
                            <span className="text-text-2 font-normal text-sm text-center">
                                ${fmt(smartMarketing)}
                            </span>
                        </div>

                        {/* Total Row - Subtotal */}
                        <div className="grid grid-cols-3 gap-4 p-4 bg-[#F1F5F9] rounded-xl items-center my-1">
                            <span className="text-text-1 text-sm font-medium">Subtotal</span>
                            <span className="text-text-1 font-medium text-sm text-center">
                                <span className="text-green-500 mr-0.5">+</span>${fmt(customerDeliveryFees + customerTips + smartMarketing)}
                            </span>
                            <span className="text-text-1 font-medium text-sm text-center">
                                ${fmt(deliveryFees + driverTips)}
                            </span>
                        </div>

                        {/* Regular Row */}
                        <div className="grid grid-cols-3 gap-4 p-4 items-center">
                            <span className="text-text-2 text-sm">Credit Card Processing</span>
                            <span className="text-text-2 font-normal text-sm text-center">
                                -
                            </span>
                            <span className="text-text-2 font-normal text-sm text-center">
                                ${fmt(cardChargesNum)}
                            </span>
                        </div>

                        {/* Total Row - Final Total */}
                        <div className="grid grid-cols-3 gap-4 p-4 bg-[#F1F5F9] rounded-xl items-center my-1">
                            <span className="text-text-1 text-sm font-medium">Total</span>
                            <span className="text-text-1 font-medium text-sm text-center">
                                <span className="text-green-500 mr-0.5">+</span>${fmt(customerDeliveryFees + customerTips + smartMarketing)}
                            </span>
                            <span className="text-text-1 font-medium text-sm text-center">
                                ${fmt(totalAmountNum)}
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-border text-center">
                        <p className="text-icon font-medium text-sm">
                            Your true delivery cost was ${fmt(trueDeliveryCost)}, or ${costPerOrder} per order
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end items-center gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="h-10"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => handleDownloadPDF()}
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Download PDF
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );

    function handleDownloadPDF() {
        const doc = new jsPDF();

        // Business info box with border
        doc.setDrawColor(200, 200, 200);
        doc.rect(15, 15, 180, 35);

        // Business name inside box
        doc.setFontSize(16);
        doc.setFont('helvetica', 'medium');
        doc.text(invoiceData.businessName, 25, 30);

        // Right aligned info inside box
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(invoiceData.billingPeriod, 185, 25, { align: 'right' });
        doc.text(`Orders Delivered (${invoiceData.totalOrders})`, 185, 35, { align: 'right' });
        doc.text('Free Subscription', 185, 45, { align: 'right' });

        // Table headers with proper positioning
        doc.setFontSize(7);
        doc.setFont('helvetica', 'medium');

        // First column header (empty)
        doc.text('', 25, 70);

        // Second column header - FEES & TIPS COLLECTED
        doc.text('FEES & TIPS COLLECTED', 80, 70, { align: 'center' });
        doc.text('BY "' + invoiceData.businessName.toUpperCase() + '"', 80, 75, { align: 'center' });

        // Third column header - PAYMENT TO
        doc.text('PAYMENT TO', 145, 70, { align: 'center' });
        doc.text('MY DELIVERY FLEET', 145, 75, { align: 'center' });

        // Helper: write "+$X.XX" centered at x with green "+" and normal color "$X.XX"
        const writeWithGreenPlus = (x: number, y: number, amount: string) => {
            const plusText = '+';
            const dollarText = `$${amount}`;
            const fullText = plusText + dollarText;
            const fontSize = (doc as any).getFontSize();
            const scale = fontSize / doc.internal.scaleFactor;
            const totalWidth = doc.getStringUnitWidth(fullText) * scale;
            const plusWidth = doc.getStringUnitWidth(plusText) * scale;
            const startX = x - totalWidth / 2;
            doc.setTextColor(63, 192, 96);
            doc.text(plusText, startX, y);
            doc.setTextColor(0, 0, 0);
            doc.text(dollarText, startX + plusWidth, y);
        };

        // Table rows
        let yPosition = 90;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        // Delivery / Dispatch Fees
        doc.text('Delivery / Dispatch Fees', 25, yPosition);
        writeWithGreenPlus(80, yPosition, fmt(customerDeliveryFees));
        doc.text(`$${fmt(deliveryFees)}`, 145, yPosition, { align: 'center' });
        yPosition += 12;

        // Tips
        doc.text('Tips', 25, yPosition);
        writeWithGreenPlus(80, yPosition, fmt(customerTips));
        doc.text(`$${fmt(driverTips)}`, 145, yPosition, { align: 'center' });
        yPosition += 12;

        // Delivery Total (highlighted)
        doc.setFillColor(245, 245, 245);
        doc.rect(15, yPosition - 8, 180, 12, 'F');
        doc.setFont('helvetica', 'medium');
        doc.text('Delivery Total', 25, yPosition);
        writeWithGreenPlus(80, yPosition, fmt(customerDeliveryFees + customerTips));
        doc.text(`$${fmt(deliveryFees + driverTips)}`, 145, yPosition, { align: 'center' });
        yPosition += 12;

        // Smart Marketing
        doc.setFont('helvetica', 'normal');
        doc.text('Smart Marketing', 25, yPosition);
        doc.text('-', 80, yPosition, { align: 'center' });
        doc.text(`$${fmt(smartMarketing)}`, 145, yPosition, { align: 'center' });
        yPosition += 12;

        // Subtotal (highlighted)
        doc.setFillColor(245, 245, 245);
        doc.rect(15, yPosition - 8, 180, 12, 'F');
        doc.setFont('helvetica', 'medium');
        doc.text('Subtotal', 25, yPosition);
        writeWithGreenPlus(80, yPosition, fmt(customerDeliveryFees + customerTips + smartMarketing));
        doc.text(`$${fmt(deliveryFees + driverTips)}`, 145, yPosition, { align: 'center' });
        yPosition += 12;

        // Credit Card Processing
        doc.setFont('helvetica', 'normal');
        doc.text('Credit Card Processing', 25, yPosition);
        doc.text('-', 80, yPosition, { align: 'center' });
        doc.text(`$${fmt(cardChargesNum)}`, 145, yPosition, { align: 'center' });
        yPosition += 12;

        // Total (highlighted)
        doc.setFillColor(245, 245, 245);
        doc.rect(15, yPosition - 8, 180, 12, 'F');
        doc.setFont('helvetica', 'medium');
        doc.text('Total', 25, yPosition);
        writeWithGreenPlus(80, yPosition, fmt(customerDeliveryFees + customerTips + smartMarketing));
        doc.text(`$${fmt(totalAmountNum)}`, 145, yPosition, { align: 'center' });
        yPosition += 12;

        // Footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(`Your true delivery cost was $${fmt(trueDeliveryCost)}, or ${costPerOrder} per order`, 105, yPosition, { align: 'center' });

        // Save the PDF
        doc.save(`invoice-${invoiceData.businessName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    }
}
