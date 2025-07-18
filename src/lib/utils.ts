import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Settings } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: Settings['currency'] = 'EUR') {
  // Use a specific locale for West African CFA franc to ensure correct formatting
  const locale = currency === 'XOF' ? 'fr-CI' : 'fr-FR'; 
  
  // Use Intl.NumberFormat for robust currency formatting
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    // CFA Franc doesn't typically use decimals
    minimumFractionDigits: currency === 'XOF' ? 0 : 2,
    maximumFractionDigits: currency === 'XOF' ? 0 : 2,
  }).format(amount);
}
