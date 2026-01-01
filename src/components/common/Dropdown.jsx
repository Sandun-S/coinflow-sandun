import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

const Dropdown = ({ trigger, items, align = 'right' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger || (
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-full transition-colors">
                        <MoreVertical size={20} />
                    </button>
                )}
            </div>

            {isOpen && (
                <div
                    className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100`}
                >
                    {items.map((item, index) => {
                        if (item.type === 'divider') {
                            return <div key={index} className="h-px bg-slate-100 dark:bg-slate-700 my-1" />;
                        }

                        return (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    item.onClick();
                                    setIsOpen(false);
                                }}
                                disabled={item.disabled}
                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors
                                    ${item.variant === 'danger'
                                        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                        : item.variant === 'success'
                                            ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                    }
                                    ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                {item.icon && <span className="opacity-75">{item.icon}</span>}
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Dropdown;
