import React, { useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Hook version of formatMoney
export const useCurrencyFormatter = () => {
    const { currency } = useSettings();

    const formatMoney = useCallback((amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    }, [currency]);

    return formatMoney;
};

// Keep utility for non-hook usage (default USD) or if passed explicitly
export const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};
