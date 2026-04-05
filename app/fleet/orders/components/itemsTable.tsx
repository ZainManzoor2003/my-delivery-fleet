import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { OrderItem } from "@/lib/types/order";
import { FormikErrors } from "formik";
import React from "react";
import DollarInput from "./dollarInput";

const DebouncedInput = React.memo(
    function DebouncedInput({
        value,
        onChange,
        ...props
    }: {
        value: string | number;
        onChange: (value: any) => void;
        [key: string]: any;
    }) {
        const [localValue, setLocalValue] = React.useState(value);
        const timeoutRef = React.useRef<number | null>(null);

        React.useEffect(() => {
            setLocalValue(value);
        }, [value]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setLocalValue(val);

            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = window.setTimeout(() => {
                onChange(val);
            }, 300);
        };

        return <Input {...props} value={localValue} onChange={handleChange} />;
    }
);

interface Props {
    items: OrderItem[];
    editable?: boolean;
    onDataChange?: (id: number | string, field: string, value: any) => void;
    onDeleteItem?: (id: string | number) => void;
    errors?: (FormikErrors<OrderItem> | undefined)[];
    touched?: (Partial<OrderItem> | undefined)[];
}

const ItemsTable = React.memo(function ItemsTable({
    items,
    editable = false,
    onDataChange,
    onDeleteItem,
    errors,
    touched
}: Props) {
    return (
        <div className="w-full overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="font-semibold text-icon uppercase text-[10px] pl-0">Item Name</TableHead>
                        <TableHead className="w-28  font-semibold text-icon uppercase text-[10px]">QTY</TableHead>
                        <TableHead className="w-36 font-semibold text-icon uppercase text-[10px]">Unit Price</TableHead>
                        {editable && <TableHead className="w-16" />}
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {items.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={editable ? 4 : 3}
                                className="text-center py-8 text-text-3"
                            >
                                No items added
                            </TableCell>
                        </TableRow>
                    ) : (
                        items.map((item) => (
                            <TableRow key={item.id}>
                                {/* NAME */}
                                <TableCell className="align-top pl-0">
                                    {editable ? (
                                        <div className={`flex flex-col space-y-1`}>
                                            <DebouncedInput
                                                value={item.name}
                                                onChange={(v) =>
                                                    onDataChange?.(item.id, "name", v)
                                                }

                                                className={`h-10 w-full  ${errors?.[items.indexOf(item)]?.name &&
                                                    touched?.[items.indexOf(item)]?.name ? "border-red-500" : "border-border"}`}
                                                placeholder="Item name"
                                            />
                                            {errors?.[items.indexOf(item)]?.name &&
                                                touched?.[items.indexOf(item)]?.name && <span className='text-red-500 h-5 text-xs'>{errors?.[items.indexOf(item)]?.name}</span>}
                                        </div>
                                    ) : (
                                        item.name || "-"
                                    )}
                                </TableCell>
                                <TableCell className="align-top">
                                    {editable ? (
                                        <div className={`flex flex-col space-y-1`}>
                                            <DebouncedInput
                                                type="number"
                                                step='1'
                                                value={item.quantity}
                                                onKeyDown={(e: any) => {
                                                    if (e.key === '.' || e.key === ',') {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                onChange={(v) => {
                                                    onDataChange?.(
                                                        item.id,
                                                        "quantity",
                                                        Number(v)
                                                    );
                                                }}
                                                onWheel={(e: any) => e.currentTarget.blur()}
                                                className={`h-10 w-20 sm:w-30 text-center ${errors?.[items.indexOf(item)]?.quantity &&
                                                    touched?.[items.indexOf(item)]?.quantity ? "border-red-500" : "border-border"}`}
                                            />
                                            {errors?.[items.indexOf(item)]?.quantity &&
                                                touched?.[items.indexOf(item)]?.quantity && <span className='text-red-500 h-5 text-xs'>{errors?.[items.indexOf(item)]?.quantity}</span>}
                                        </div>

                                    ) : (
                                        item.quantity
                                    )}
                                </TableCell>
                                {/* UNIT PRICE */}
                                <TableCell className="align-top">
                                    {editable ? (
                                        <DollarInput
                                            value={(item.unitPrice?.toString() ?? '0')}
                                            onChange={(val) => onDataChange?.(item.id, "unitPrice", val)}
                                        />
                                    ) : (
                                        item.unitPrice != null ? `$${item.unitPrice}` : '-'
                                    )}
                                </TableCell>
                                {editable && (
                                    <TableCell className="align-top">
                                        <div className={`flex h-10 items-center`}>
                                            <div
                                                onClick={() =>
                                                    onDeleteItem?.(item.id)
                                                }
                                                className={`h-4 sm:w-4 ${errors?.[items.indexOf(item)]?.id &&
                                                    touched?.[items.indexOf(item)]?.id ? "border-red-500" : "border-border"}`}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500 cursor-pointer" />
                                            </div>
                                        </div>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
});

export default ItemsTable;
