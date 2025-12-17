import React from 'react';
import { cn } from '../../utils';

const Card = ({ children, className }) => {
    return (
        <div className={cn("bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-xl p-6 transition-all duration-200", className)}>
            {children}
        </div>
    );
};

export default Card;
