import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Settings } from './types';
import { ToWords } from 'to-words';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: Settings['currency'] = 'EUR') {
  const locale = 'fr-FR'; // Use a locale that uses space as a thousands separator
  
  // Use decimal style to manually control currency symbol placement
  const formattedAmount = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: currency === 'XOF' ? 0 : 2,
    maximumFractionDigits: currency === 'XOF' ? 0 : 2,
  }).format(amount);

  // We use non-breaking spaces (\u00A0) to prevent line breaks within the price string
  const currencySymbol = currency === 'XOF' ? 'F\u00A0CFA' : currency;
  const amountWithNoBreakSpaces = formattedAmount.replace(/\s/g, '\u00A0');

  return `${amountWithNoBreakSpaces}\u00A0${currencySymbol}`;
}


// Helper function to convert number to French words for currency
export const numberToWordsFr = (amount: number, currency: Settings['currency']): string => {
    const currencyInfo = {
        EUR: { name: 'Euro', plural: 'Euros', fractionalUnit: { name: 'Centime', plural: 'Centimes' } },
        USD: { name: 'Dollar', plural: 'Dollars', fractionalUnit: { name: 'Centime', plural: 'Centimes' } },
        GBP: { name: 'Livre Sterling', plural: 'Livres Sterling', fractionalUnit: { name: 'Penny', plural: 'Pence' } },
        XOF: { name: 'Franc CFA', plural: 'Francs CFA', fractionalUnit: { name: '', plural: '' } }, // No fractional part for XOF
    };
    
    const selectedCurrency = currencyInfo[currency];

    const toWordsInstance = new ToWords({
        localeCode: 'fr-FR',
        converterOptions: {
            currency: true,
            ignoreDecimal: !selectedCurrency.fractionalUnit.name,
            currencyOptions: {
                name: selectedCurrency.name,
                plural: selectedCurrency.plural,
                symbol: '', // We don't need the symbol in the words
                fractionalUnit: {
                    name: selectedCurrency.fractionalUnit.name,
                    plural: selectedCurrency.fractionalUnit.plural,
                    symbol: '',
                },
            }
        }
    });
    
    let words = toWordsInstance.convert(amount);
    words = words.replace(/ et zéro centimes?/i, '').replace(/ seulement/i, '');
    return words.charAt(0).toUpperCase() + words.slice(1);
};
