'use client'
import { Label } from '@radix-ui/react-label';
import React, { ChangeEvent } from 'react'
import { Input } from './ui/input';
interface ValidationErrors {
    phoneNumber?: string | boolean
}
interface Props {
    label: string
    phoneNumber: string;
    onChange: (value: string) => void;
    touched: ValidationErrors,
    errors: ValidationErrors
}

export default function PhoneNumber({ label, phoneNumber, onChange, touched, errors }: Props) {
    const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, ""); // remove non-digits
        // enforce first digit of area code 2–9
        if (value.length > 0 && parseInt(value[0]) < 2) {
            value = "";
        }
        if (value.length > 10) value = value.slice(0, 10); // max 10 digits

        let formatted = "";
        if (value.length > 0) {
            formatted += "(" + value.slice(0, 3);
        }
        if (value.length >= 3) {
            formatted += ") ";
            formatted += value.slice(3, 6);
        }
        if (value.length >= 6) {
            formatted += "-" + value.slice(6, 10);
        }

        onChange(formatted);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (
            e.key === "Backspace" ||
            e.key === "Delete"
        ) {
            let digits = phoneNumber.replace(/\D/g, ""); // get only numbers
            digits = digits.slice(0, digits.length - 1); // remove last digit
            onChange(formatPhone(digits));
            e.preventDefault(); // prevent default so cursor behaves correctly
        }
    };

    const formatPhone = (value: string) => {
        let formatted = "";
        if (value.length > 0) formatted += "(" + value.slice(0, 3);
        if (value.length >= 3) formatted += ") " + value.slice(3, 6);
        if (value.length >= 6) formatted += "-" + value.slice(6, 10);
        return formatted;
    };

    return (
        <div className='space-y-1'>
            <Label className="text-sm font-medium text-text-2 gap-0">{label}<span className='text-red-500'>*</span></Label>
            <Input
                type='tel'
                name='phoneNumber'
                placeholder="(000) 000-0000"
                className={`h-10 placeholder:text-text-3 ${errors.phoneNumber && touched.phoneNumber ? 'border-red-500' : 'border-border'}`}
                value={phoneNumber}
                onChange={handlePhoneChange}
                onKeyDown={handleKeyDown}
            />
            {touched.phoneNumber && errors.phoneNumber && <span className='text-red-500 text-xs'>{errors.phoneNumber}</span>}
        </div>
    )
}