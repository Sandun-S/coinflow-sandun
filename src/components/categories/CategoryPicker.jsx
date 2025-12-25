import React, { useState } from 'react';
import { useCategories } from '../../context/CategoryContext';
import { useTour } from '../../context/TourContext';
import { ChevronRight, ChevronDown, Check, X, Settings } from 'lucide-react'; // Added Settings
import { Link } from 'react-router-dom'; // Added Link
import * as Icons from 'lucide-react';

const CategoryPicker = ({ selectedCategory, onSelect, type = 'expense' }) => {
    const { categories } = useCategories();
    const { nextStep, currentStepTarget } = useTour();
    const [isOpen, setIsOpen] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState(null);

    // Filter categories by type (income/expense)
    const filteredCategories = categories.filter(c => c.type === type);

    // Helper to get Icon component dynamically
    const getIcon = (iconName) => {
        const Icon = Icons[iconName] || Icons.HelpCircle;
        return <Icon size={20} />;
    };

    const handleSelect = (categoryName) => {
        onSelect(categoryName);
        setIsOpen(false);
        // Only advance if the tour is targeting this picker (Transaction or Budget)
        if (currentStepTarget === '[data-tour="category-picker"]' || currentStepTarget === '[data-tour="budget-category-picker"]' || currentStepTarget === '[data-tour="sub-category-picker"]') {
            nextStep();
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                data-tour="category-picker"
            >
                <span className="truncate">{selectedCategory || "Select Category"}</span>
                <ChevronDown size={16} className="text-slate-400" />
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Select Category</h3>
                                <Link to="/settings" className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1 mt-1" onClick={() => setIsOpen(false)}>
                                    <Settings size={12} /> Manage Categories
                                </Link>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {filteredCategories.map(cat => (
                                <div key={cat.id} className="rounded-xl overflow-hidden">
                                    {/* Parent Category Item */}
                                    <div
                                        className={`flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${selectedCategory === cat.name ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                                        onClick={() => {
                                            if (cat.subcategories && cat.subcategories.length > 0) {
                                                setExpandedCategory(expandedCategory === cat.id ? null : cat.id);
                                            } else {
                                                handleSelect(cat.name);
                                            }
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={cat.color?.startsWith('#') ? 'p-2 rounded-lg' : `p-2 rounded-lg ${cat.color || 'bg-slate-100 text-slate-600'}`}
                                                style={cat.color?.startsWith('#') ? { backgroundColor: cat.color + '25', color: cat.color } : {}}
                                            >
                                                {getIcon(cat.icon)}
                                            </div>
                                            <span className="font-medium text-slate-700 dark:text-slate-200">{cat.name}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {selectedCategory === cat.name && <Check size={16} className="text-indigo-500" />}
                                            {cat.subcategories && cat.subcategories.length > 0 && (
                                                <ChevronRight
                                                    size={16}
                                                    className={`text-slate-400 transition-transform ${expandedCategory === cat.id ? 'rotate-90' : ''}`}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Subcategories */}
                                    {expandedCategory === cat.id && cat.subcategories && (
                                        <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
                                            {/* Allow selecting the Parent itself */}
                                            <button
                                                type="button"
                                                onClick={() => handleSelect(cat.name)}
                                                className={`w-full flex items-center justify-between px-4 py-3 pl-14 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left border-b border-slate-100 dark:border-slate-700/50 ${selectedCategory === cat.name ? 'text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-900/10' : 'text-slate-500 font-semibold'}`}
                                            >
                                                <span>Select {cat.name} (Entire Category)</span>
                                                {selectedCategory === cat.name && <Check size={14} className="text-indigo-500" />}
                                            </button>

                                            {cat.subcategories.map(sub => (
                                                <button
                                                    key={sub}
                                                    type="button"
                                                    onClick={() => handleSelect(sub)}
                                                    className={`w-full flex items-center justify-between px-4 py-3 pl-14 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left ${selectedCategory === sub ? 'text-indigo-600 font-medium bg-indigo-50 dark:bg-indigo-900/10' : 'text-slate-600 dark:text-slate-400'}`}
                                                >
                                                    {sub}
                                                    {selectedCategory === sub && <Check size={14} className="text-indigo-500" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {filteredCategories.length === 0 && (
                                <div className="text-center py-8 text-slate-400">
                                    No categories found for {type}.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CategoryPicker;
