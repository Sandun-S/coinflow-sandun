import React, { useState } from 'react';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';
import { useCategories } from '../../context/CategoryContext';
import { Plus, Trash2, Tag, ChevronDown, ChevronRight, Check } from 'lucide-react';
import * as Icons from 'lucide-react';

const COLORS = [
    'bg-slate-100 text-slate-600',
    'bg-red-100 text-red-600',
    'bg-orange-100 text-orange-600',
    'bg-amber-100 text-amber-600',
    'bg-yellow-100 text-yellow-600',
    'bg-lime-100 text-lime-600',
    'bg-green-100 text-green-600',
    'bg-emerald-100 text-emerald-600',
    'bg-teal-100 text-teal-600',
    'bg-cyan-100 text-cyan-600',
    'bg-sky-100 text-sky-600',
    'bg-blue-100 text-blue-600',
    'bg-indigo-100 text-indigo-600',
    'bg-violet-100 text-violet-600',
    'bg-purple-100 text-purple-600',
    'bg-fuchsia-100 text-fuchsia-600',
    'bg-pink-100 text-pink-600',
    'bg-rose-100 text-rose-600',
];

const ICONS = [
    'Tag', 'ShoppingBag', 'CreditCard', 'Banknote', 'Wallet', 'DollarSign',
    'Home', 'Briefcase', 'GraduationCap', 'Book', 'Gamepad', 'Music',
    'Tv', 'Wifi', 'Smartphone', 'Cpu', 'Zap', 'Lightbulb',
    'Tool', 'Truck', 'Car', 'Plane', 'Map', 'Globe',
    'Coffee', 'Utensils', 'Pizza', 'GlassWater', 'Beer', 'Heart',
    'Activity', 'Stethoscope', 'Pill', 'Smile', 'Star', 'Gift',
    'Shield', 'Lock', 'Key', 'Umbrella', 'Cloud', 'Sun'
];

const ManageCategories = () => {
    const { categories, addCategory, deleteCategory, updateCategory } = useCategories();
    // Section Collapse State
    const [isExpanded, setIsExpanded] = useState(false);

    // Form State
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState('expense');
    const [newCatColor, setNewCatColor] = useState(COLORS[0]);
    const [newCatIcon, setNewCatIcon] = useState('Tag');

    // Subcategory Expansion
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [newSubcatName, setNewSubcatName] = useState('');

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCatName.trim()) return;

        await addCategory({
            name: newCatName,
            type: newCatType,
            icon: newCatIcon,
            color: newCatColor,
            subcategories: []
        });
        setNewCatName('');
        // Check if we want to reset icon/color or keep last choice? Resetting is cleaner.
        setNewCatColor(COLORS[0]);
        setNewCatIcon('Tag');
    };

    const handleAddSubcategory = async (parentId) => {
        if (!newSubcatName.trim()) return;

        const parent = categories.find(c => c.id === parentId);
        if (!parent) return;

        const updatedSubs = [...(parent.subcategories || []), newSubcatName];
        await updateCategory(parentId, { subcategories: updatedSubs });
        setNewSubcatName('');
    };

    const handleDeleteSubcategory = async (parentId, subName) => {
        if (!window.confirm(`Delete subcategory "${subName}"?`)) return;
        const parent = categories.find(c => c.id === parentId);
        if (!parent) return;

        const updatedSubs = parent.subcategories.filter(s => s !== subName);
        await updateCategory(parentId, { subcategories: updatedSubs });
    };

    const getIcon = (iconName) => {
        const Icon = Icons[iconName] || Icons.HelpCircle;
        return <Icon size={20} />;
    };

    return (
        <Card>
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-lg">
                        <Tag size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Manage Categories</h3>
                        <p className="text-sm text-slate-500">Add or remove custom categories.</p>
                    </div>
                </div>
                <div className="text-slate-400">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
            </div>

            {isExpanded && (
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Add New Category Form */}
                    <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Add New Category</h4>
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-3">
                                <select
                                    value={newCatType}
                                    onChange={(e) => setNewCatType(e.target.value)}
                                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 outline-none"
                                >
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                </select>
                                <Input
                                    placeholder="Category Name"
                                    value={newCatName}
                                    onChange={(e) => setNewCatName(e.target.value)}
                                    className="flex-1"
                                />
                            </div>

                            {/* Color Picker */}
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setNewCatColor(color)}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform hover:scale-110 ${color} ${newCatColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-800' : ''}`}
                                        >
                                            {newCatColor === color && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Icon Picker */}
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 block">Icon</label>
                                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                                    {ICONS.map((iconName) => (
                                        <button
                                            key={iconName}
                                            type="button"
                                            onClick={() => setNewCatIcon(iconName)}
                                            className={`p-2 rounded-lg flex items-center justify-center transition-colors ${newCatIcon === iconName ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 ring-1 ring-indigo-500' : 'bg-white dark:bg-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                                            title={iconName}
                                        >
                                            {getIcon(iconName)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button onClick={handleAddCategory} disabled={!newCatName} className="self-end flex items-center gap-2">
                                <Plus size={18} /> Create Category
                            </Button>
                        </div>
                    </div>

                    {/* Category List */}
                    <div className="space-y-3">
                        {categories.map(cat => (
                            <div key={cat.id} className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <div
                                        className="flex items-center gap-3 flex-1 cursor-pointer"
                                        onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                                    >
                                        <div className={`p-2 rounded-lg ${cat.color}`}>
                                            {getIcon(cat.icon)}
                                        </div>
                                        <span className="font-medium text-slate-700 dark:text-slate-200">{cat.name}</span>
                                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 uppercase tracking-wider text-[10px]">{cat.type}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => deleteCategory(cat.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Delete Category"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                                            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {expandedCategory === cat.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Subcategories */}
                                {expandedCategory === cat.id && (
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-3">
                                        <div className="flex flex-wrap gap-2">
                                            {cat.subcategories && cat.subcategories.map(sub => (
                                                <span key={sub} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300">
                                                    {sub}
                                                    <button onClick={() => handleDeleteSubcategory(cat.id, sub)} className="hover:text-red-500 ml-1 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"><Trash2 size={12} /></button>
                                                </span>
                                            ))}
                                            {(!cat.subcategories || cat.subcategories.length === 0) && (
                                                <span className="text-sm text-slate-400 italic">No subcategories</span>
                                            )}
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <Input
                                                placeholder="Add Subcategory..."
                                                value={newSubcatName}
                                                onChange={(e) => setNewSubcatName(e.target.value)}
                                                className="flex-1 py-1.5 text-sm bg-white dark:bg-slate-700"
                                            />
                                            <Button
                                                size="sm"
                                                onClick={() => handleAddSubcategory(cat.id)}
                                                disabled={!newSubcatName}
                                                variant="secondary"
                                            >
                                                Add Sub
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};

export default ManageCategories;
