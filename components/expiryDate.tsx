'use client'
import { Label } from '@radix-ui/react-label';
import React from 'react'
import { Input } from './ui/input';
interface ValidationErrors {
    expiryDate?: string | boolean
}
interface Props {
    label: string
    expiryDate: string;
    onChange: (value: string) => void;
    touched: ValidationErrors,
    errors: ValidationErrors
}

export default function ExpiryDate({ label, expiryDate, onChange, touched, errors }: Props) {
    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let digits = e.target.value.replace(/\D/g, ""); // digits only

        // limit to MMYY (4 digits)
        if (digits.length > 4) digits = digits.slice(0, 4);

        let formatted = digits;

        if (digits.length >= 2) {
            formatted = `${digits.slice(0, 2)} / ${digits.slice(2)}`;
        }

        onChange(formatted);
    };


    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" || e.key === "Delete") {
            let digits = expiryDate.replace(/\D/g, ""); // MMYY only digits

            if (digits.length === 0) return;

            digits = digits.slice(0, -1); // remove last digit

            onChange(formatExpiry(digits));
            e.preventDefault(); // prevent default cursor jump
        }
    };


    const formatExpiry = (digits: string) => {
        if (digits.length <= 2) {
            return digits;
        }
        return `${digits.slice(0, 2)} / ${digits.slice(2, 4)}`;
    };


    return (
        <>
            <Label className="text-sm font-medium text-text-2">{label}</Label>
            <Input
                type='text'
                name='expiryDate'
                placeholder="MM / YY"
                className={`h-10 border-border placeholder:text-text-3`}
                value={expiryDate || ''}
                onChange={handleExpiryChange}
                onKeyDown={handleKeyDown}
            />
            {touched.expiryDate && errors.expiryDate && (
                <p className="text-red-500 text-xs">{errors.expiryDate}</p>
            )}
        </>
    )
}