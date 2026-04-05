'use client'

import React, { useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input';

interface DollarInputProps {
    value: string
    onChange?: (value: string) => void;
    error?: string | boolean;
    touched?: boolean;
    autoFocus?: boolean;
    disabled?: boolean;
}

export default function DollarInput({ value, error, touched, onChange, autoFocus = false, disabled = false }: DollarInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let raw = e.target.value.replace(/[^0-9.]/g, '');

        const dotIndex = raw.indexOf('.');
        if (dotIndex !== -1) {
            const before = raw.slice(0, dotIndex);
            const after = raw.slice(dotIndex + 1).replace(/\./g, '').slice(0, 2);
            raw = before + '.' + after;
        }

        onChange?.(raw);
    };

    const hasError = touched && error;

    return (
        <div>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 text-sm pointer-events-none">
                    $
                </span>
                <Input
                    disabled={disabled}
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className={`h-10 pl-7 bg-white placeholder:text-text-3 active:border-primary ${hasError ? 'border-red-500' : 'border-border'}`}
                    value={value || ''}
                    onChange={handleChange}
                />
            </div>
            {hasError && (
                <span className="text-red-500 text-xs">{error}</span>
            )}
        </div>
    );
}
