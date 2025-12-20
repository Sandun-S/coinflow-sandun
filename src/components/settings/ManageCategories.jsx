import React, { useState } from 'react';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';
import { useCategories } from '../../context/CategoryContext';
import { Plus, Trash2, Tag, ChevronDown, ChevronRight, Check } from 'lucide-react';
import * as Icons from 'lucide-react';

const ManageCategories = () => {
    const { categories, addCategory, deleteCategory, updateCategory } = useCategories();
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState('expense');
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [newSubcatName, setNewSubcatName] = useState('');

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCatName.trim()) return;

        // Simplified: Random color/icon for now or hardcoded defaults
        await addCategory({
            name: newCatName,
            type: newCatType,
            icon: 'Tag',
            color: 'bg-slate-100 text-slate-600',
            subcategories: []
        });
        setNewCatName('');
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
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-lg">
                    <Tag size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Manage Categories</h3>
                    <p className="text-sm text-slate-500">Add or remove custom categories.</p>
                </div>
            </div>

            {/* Add New Category Form */}
            <form onSubmit={handleAddCategory} className="flex flex-col md:flex-row gap-3 mb-6">
                <select
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 outline-none"
                >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                </select>
                <Input
                    placeholder="New Category Name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1"
                />
                <Button type="submit" disabled={!newCatName} className="flex items-center gap-2">
                    <Plus size={18} /> Add
                </Button>
            </form>

            {/* Category List */}
            <div className="space-y-3">
                {categories.map(cat => (
                    <div key={cat.id} className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50">
                            <div
                                className="flex items-center gap-3 flex-1 cursor-pointer"
                                onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                            >
                                <div className={`p-2 rounded-lg ${cat.color}`}>
                                    {getIcon(cat.icon)}
                                </div>
                                <span className="font-medium text-slate-700 dark:text-slate-200">{cat.name}</span>
                                <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500">{cat.type}</span>
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
                            <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {cat.subcategories && cat.subcategories.map(sub => (
                                        <span key={sub} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm text-slate-600 dark:text-slate-300">
                                            {sub}
                                            <button onClick={() => handleDeleteSubcategory(cat.id, sub)} className="hover:text-red-500 ml-1"><Trash2 size={12} /></button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="New Subcategory..."
                                        value={newSubcatName}
                                        onChange={(e) => setNewSubcatName(e.target.value)}
                                        className="flex-1 py-1 text-sm"
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => handleAddSubcategory(cat.id)}
                                        disabled={!newSubcatName}
                                    >
                                        Add
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default ManageCategories;
