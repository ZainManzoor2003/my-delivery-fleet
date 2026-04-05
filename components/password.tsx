'use client'

import { Label } from '@radix-ui/react-label';
import { Check, Eye, EyeOff, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Input } from './ui/input';
import { motion, AnimatePresence } from "framer-motion";
import { usePasswordValidation } from '@/lib/utils';
interface PasswordProps {
    label: string
    placeholder: string;
    password: string;
    setPassword: React.Dispatch<React.SetStateAction<string>>
    setPasswordValidation?: React.Dispatch<React.SetStateAction<boolean>>
}

function PasswordRule({ label, valid }: { label: string, valid: boolean }) {
    return (
        <li className={`flex items-center gap-2 ${valid ? 'text-text-2' : 'text-text-3'}`}>
            {valid ? <Check className=' text-green-500' size={15} />
                :
                <X className='text-red-500' size={15} />
            }
            {label}
        </li>
    );
}

export default function Password({ label, placeholder, password, setPassword, setPasswordValidation }: PasswordProps) {
    const [showPassword, setShowPassword] = useState<boolean>(false)

    const passwordChecks = usePasswordValidation(password);

    const isPasswordValid = Object.values(passwordChecks).every(Boolean);

    useEffect(() => {
        if (setPasswordValidation) {
            setPasswordValidation(isPasswordValid)
        }
    }, [isPasswordValid, setPasswordValidation])

    return (
        <>
            <Label className="text-sm font-medium text-text-2 gap-0">{label}<span className='text-red-500'>*</span></Label>
            <div className="relative">
                <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={placeholder}
                    className="h-10 border-border pr-10 placeholder:text-text-3"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {showPassword ? (
                    <EyeOff className="absolute right-3 top-2.5 h-4 w-4 text-icon cursor-pointer" onClick={() => setShowPassword(prev => !prev)} />
                ) : (
                    <Eye className="absolute right-3 top-2.5 h-4 w-4 text-icon cursor-pointer" onClick={() => setShowPassword(prev => !prev)} />
                )}
                <AnimatePresence>
                    {label !== 'Confirm Password' && password.length > 0 && !isPasswordValid && (
                        <motion.ul
                            className="mt-2 space-y-1 text-sm"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <PasswordRule label="At least 8 characters" valid={passwordChecks.minLength} />
                            <PasswordRule label="One uppercase letter (A–Z)" valid={passwordChecks.uppercase} />
                            <PasswordRule label="One lowercase letter (a–z)" valid={passwordChecks.lowercase} />
                            <PasswordRule label="One number (0–9)" valid={passwordChecks.number} />
                        </motion.ul>
                    )}
                </AnimatePresence>
            </div>
        </>
    )
}
