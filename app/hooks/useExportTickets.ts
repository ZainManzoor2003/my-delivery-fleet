import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

interface ExportOptions {
    dateRange?: DateRange;
    businessId: string;
}
function downloadCSV(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function useExportTickets() {
    const exportTickets = async (options: ExportOptions): Promise<void> => {
        try {
            const body = {
                businessId: options.businessId,
                ...(options.dateRange?.from && options.dateRange?.to && {
                    fromDate: options.dateRange.from,
                    toDate: options.dateRange.to,
                }),
            };
            const response = await fetch(`/api/support/export`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to export tickets');
            }

            const blob = await response.blob();
            let filename = 'tickets';
            if (options.dateRange?.from && options.dateRange?.to) {
                const fromDate = format(options.dateRange.from, 'MMM-dd-yyyy');
                const toDate = format(options.dateRange.to, 'MMM-dd-yyyy');
                filename = `tickets_${fromDate}_to_${toDate}`;
            } else {
                filename = `tickets_${format(new Date(), 'MMM-dd-yyyy')}`;
            }
            downloadCSV(blob, `${filename}.csv`);
        } catch (error) {
            console.error('Export error:', error);
            alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    return { exportTickets };
}
