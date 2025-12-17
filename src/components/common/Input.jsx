import React from 'react';
import { cn } from '../../utils';

const Input = ({ label, id, className, ...props }) => {
    return (
        <div className="flex flex-col gap-1.5">
            {label && <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
            <input
                id={id}
                className={cn("border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-all duration-200 placeholder:text-slate-400", className)}
                {...props}
            />
        </div>
    );
};

export default Input;
