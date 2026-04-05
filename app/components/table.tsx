import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

export interface ColumnDef<T> {
    key: keyof T | string;
    label: string;
    width?: string;
    flex?: boolean;
    render?: (value: any, row: T, index: number) => React.ReactNode;
    sortable?: boolean;
    align?: 'left' | 'center' | 'right';
    stickyRight?: boolean;
}
interface GenericTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    onRowClick?: (row: T, index: number) => void;
    emptyMessage?: string;
    isLoading?: boolean;
    selectable?: boolean;
    onSelectionChange?: (selectedIndices: number[]) => void;
    onSelectionRowsChange?: (selectedRows: T[]) => void;
    hoverable?: boolean;
    striped?: boolean;
    className?: string;
}

const GenericTable = React.forwardRef<HTMLDivElement, GenericTableProps<any>>(
    function GenericTable({
        data,
        columns,
        onRowClick,
        emptyMessage = 'No data found',
        isLoading = false,
        selectable = false,
        onSelectionChange,
        onSelectionRowsChange,
        hoverable = true,
        striped = false,
        className = '',
    }, ref) {
        const [selectedRows, setSelectedRows] = React.useState<Set<number>>(new Set());
        const [selectAllChecked, setSelectAllChecked] = React.useState(false);

        const handleSelectAll = () => {
            if (selectAllChecked) {
                setSelectedRows(new Set());
                setSelectAllChecked(false);
                onSelectionChange?.([]);
                onSelectionRowsChange?.([]);
            } else {
                setSelectedRows(new Set(data.map((_, i) => i)));
                setSelectAllChecked(true);
                onSelectionChange?.(data.map((_, i) => i));
                onSelectionRowsChange?.(data.slice());
            };
        };

        const handleSelectRow = (index: number) => {
            const newSelected = new Set(selectedRows);
            if (newSelected.has(index)) {
                newSelected.delete(index);
            } else {
                newSelected.add(index);
            }
            setSelectedRows(newSelected);
            setSelectAllChecked(newSelected.size === data.length);
            const indices = Array.from(newSelected);
            onSelectionChange?.(indices);
            onSelectionRowsChange?.(indices.map(i => data[i]));
        };

        const getNestedValue = (obj: any, path: string): any => {
            return path.split('.').reduce((current, prop) => current?.[prop], obj);
        };

        if (isLoading) {
            return (
                <div className="flex items-center justify-center py-8">
                    <div className="text-text-3">Loading...</div>
                </div>
            );
        }

        return (
            <div ref={ref} className={`w-full overflow-x-auto ${className}`}>
                <Table className="w-full">
                    <TableHeader>
                        <TableRow className="border-border">
                            {selectable && (
                                <TableHead className="w-12 pl-6">
                                    <input
                                        type="checkbox"
                                        checked={selectAllChecked}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 rounded border border-gray-300 cursor-pointer mt-1 appearance-none checked:bg-blue-300 checked:border-[#1877F2] checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMC42NjY3IDAuNUw0LjAwMDA0IDcuMTY2NjdMMC4zMzMzNyA0LjUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMS42NjY2NyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=')] checked:bg-size-[7px_7px] checked:bg-center checked:bg-no-repeat"
                                    />
                                </TableHead>
                            )}
                            {columns.map((column) => (
                                <TableHead
                                    key={String(column.key)}
                                    className={`text-[10px] uppercase text-icon font-semibold ${column.flex ? 'flex-1' : column.width || ''} ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}
                                    ${column.stickyRight ? 'max-[1664px]:sticky max-[1664px]:right-0 max-[1664px]:bg-white max-[1664px]:z-20 ' +
                                            'max-[1664px]:before:absolute max-[1664px]:before:left-0 max-[1664px]:before:top-0 ' +
                                            'max-[1664px]:before:bottom-0 max-[1664px]:before:w-4 max-[1664px]:before:-translate-x-full ' +
                                            'max-[1664px]:before:bg-linear-to-l max-[1664px]:before:from-black/5 max-[1664px]:before:to-transparent ' +
                                            'max-[1664px]:before:pointer-events-none'
                                            : ''}`}>
                                    {column.label}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (selectable ? 1 : 0)}
                                    className="text-center py-8 text-text-3"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, index) => (
                                <TableRow
                                    key={index}
                                    className={`border-border font-regular text-text-1 ${hoverable ? 'hover:bg-slate-50/50 cursor-pointer' : ''} ${striped && index % 2 === 0 ? 'bg-slate-50/30' : ''}`}
                                    onClick={() => onRowClick?.(row, index)}
                                >
                                    {selectable && (
                                        <TableCell className="py-4 pl-6 w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.has(index)}
                                                onChange={() => handleSelectRow(index)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="h-4 w-4 rounded border border-gray-300 cursor-pointer mt-1 appearance-none checked:bg-blue-300 checked:border-[#1877F2] checked:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOSIgdmlld0JveD0iMCAwIDEyIDkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0xMC42NjY3IDAuNUw0LjAwMDA0IDcuMTY2NjdMMC4zMzMzNyA0LjUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMS42NjY2NyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=')] checked:bg-size-[7px_7px] checked:bg-center checked:bg-no-repeat"
                                            />
                                        </TableCell>
                                    )}
                                    {columns.map((column) => {
                                        const value = typeof column.key === 'string'
                                            ? getNestedValue(row, column.key as string)
                                            : row[column.key];

                                        return (
                                            <TableCell
                                                key={String(column.key)}
                                                className={`text-sm ${column.flex ? 'flex-1' : column.width || ''} ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''} 
                                                ${column.stickyRight ? 'max-[1664px]:sticky max-[1664px]:right-0 max-[1664px]:bg-white max-[1664px]:z-20 ' +
                                                        'max-[1664px]:before:absolute max-[1664px]:before:left-0 max-[1664px]:before:top-0 ' +
                                                        'max-[1664px]:before:bottom-0 max-[1664px]:before:w-4 max-[1664px]:before:-translate-x-full ' +
                                                        'max-[1664px]:before:bg-linear-to-l max-[1664px]:before:from-black/5 max-[1664px]:before:to-transparent ' +
                                                        'max-[1664px]:before:pointer-events-none'
                                                        : ''}`}>
                                                {column.render
                                                    ? column.render(value, row, index)
                                                    : value ?? '-'}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        );
    }
);

export default GenericTable;
