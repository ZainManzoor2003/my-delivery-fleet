import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useMemo } from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const passwordRules = {
  minLength: (v: string) => v.length >= 8,
  uppercase: (v: string) => /[A-Z]/.test(v),
  lowercase: (v: string) => /[a-z]/.test(v),
  number: (v: string) => /\d/.test(v),
};
export const usePasswordValidation = (password: string) => {
  // useMemo prevents recalculating on every render unless password changes
  const passwordChecks = useMemo(() => ({
    minLength: passwordRules.minLength(password),
    uppercase: passwordRules.uppercase(password),
    lowercase: passwordRules.lowercase(password),
    number: passwordRules.number(password),
  }), [password]);

  return passwordChecks;
};