import React from 'react';
import { cn } from '../../utils';

const Button = ({ children, onClick, className, type = 'button', variant = 'primary' }) => {
    const baseStyles = "px-4 py-2 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95";

    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none focus:ring-indigo-500",
        secondary: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 focus:ring-slate-200 shadow-sm",
        danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    };

    return (
        <button
            type={type}
            className={cn(baseStyles, variants[variant], className)}
            onClick={onClick}
        >
            {children}
        </button>
    );
};

export default Button;
