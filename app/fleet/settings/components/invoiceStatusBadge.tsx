'use client'
import { InvoiceStatus } from '@/lib/types/invoice';
import { cn } from '@/lib/utils';

interface InvoiceStatusBadgeProps {
    status: InvoiceStatus;
    className?: string;
}

export default function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
    const getStatusColor = (status: InvoiceStatus) => {
        switch (status) {
            case InvoiceStatus.Paid:
                return " border-[#1877F2] text-text-1 bg-blue-200";
            case InvoiceStatus.Pending:
                return "border-[#94A3B8] text-text-1 bg-gray-200"
            case InvoiceStatus.Failed:
                return 'bg-red-100 text-red-800 border-red-200';
            case InvoiceStatus.Processed:
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusText = (status: InvoiceStatus) => {
        switch (status) {
            case InvoiceStatus.Paid:
                return 'Paid';
            case InvoiceStatus.Pending:
                return 'Pending';
            case InvoiceStatus.Failed:
                return 'Failed';
            case InvoiceStatus.Processed:
                return 'Processed';
            default:
                return status;
        }
    };

    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                getStatusColor(status),
                className
            )}
        >
            {getStatusText(status)}
        </span>
    );
}
