import React, { useState, useMemo } from 'react';
import MainLayout from '../layout/MainLayout';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import { useBudgets } from '../../context/BudgetContext';
import { useCategories } from '../../context/CategoryContext'; // Import categories
import { useTransactions } from '../../hooks/useTransactions';
import { useCurrencyFormatter } from '../../utils';
import { Plus, Trash2, AlertCircle, Pencil } from 'lucide-react';
import Modal from '../common/Modal';

const BudgetsPage = () => {
    const { budgets, setBudget, deleteBudget } = useBudgets();
    const { transactions } = useTransactions();
    const { categories } = useCategories(); // Get categories
    const formatMoney = useCurrencyFormatter();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [limit, setLimit] = useState('');

    // Pre-select first expense category if available
    React.useEffect(() => {
        if (!selectedCategory && categories.length > 0) {
            const firstExpense = categories.find(c => c.type === 'expense');
            if (firstExpense) setSelectedCategory(firstExpense.name);
        }
    }, [categories, selectedCategory]);

    // Helper: Find Parent Name for a given category name (Sub or Parent)
    // Returns the Parent Name if it's a sub, or the name itself if it's a parent.
    // If not found, returns the name itself (fallback).
    const getParentCategoryName = (catName) => {
        // Check if it's a parent
        const parent = categories.find(c => c.name === catName);
        if (parent) return parent.name;

        // Check if it's a sub
        const parentOfSub = categories.find(c => c.subcategories && c.subcategories.includes(catName));
        if (parentOfSub) return parentOfSub.name;

        return catName;
    };

    // Calculate spending per PARENT category (Monthly)
    const categorySpending = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyExpenses = transactions.filter(t => {
            const tDate = new Date(t.date);
            return t.amount < 0 && tDate >= startOfMonth;
        });

        const spending = {}; // { ParentName: { total: 0, subs: { SubName: 0 } } }

        monthlyExpenses.forEach(t => {
            const rawCat = t.category || 'General';
            // Aggregating to Parent Level
            const parentCat = getParentCategoryName(rawCat);

            if (!spending[parentCat]) {
                spending[parentCat] = { total: 0, subs: {} };
            }

            const amount = Math.abs(parseFloat(t.amount));
            spending[parentCat].total += amount;

            // Track subcategory spending if specifically a sub
            if (rawCat !== parentCat) {
                spending[parentCat].subs[rawCat] = (spending[parentCat].subs[rawCat] || 0) + amount;
            } else {
                // Track explicit parent spending too if needed, or just leave as total
                spending[parentCat].subs['_main'] = (spending[parentCat].subs['_main'] || 0) + amount;
            }
        });
        return spending;
    }, [transactions, categories]);

    const handleSaveBudget = async (e) => {
        e.preventDefault();
        if (!limit || !selectedCategory) return;
        await setBudget(selectedCategory, limit);
        setIsModalOpen(false);
        setLimit('');
    };

    const handleEdit = (budget) => {
        setSelectedCategory(budget.category);
        setLimit(budget.limit);
        setIsModalOpen(true);
    };

    // Filter to only show Parent Categories for budgeting
    const expenseCategories = categories.filter(c => c.type === 'expense');

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Budgets</h2>
                    <p className="text-slate-500 dark:text-slate-400">Set monthly limits for your main categories.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="hidden md:flex items-center gap-2">
                    <Plus size={20} /> Set Budget
                </Button>
            </div>

            {/* Total Budget Summary */}
            {budgets.length > 0 && (() => {
                const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.limit), 0);
                const totalSpent = budgets.reduce((sum, b) => {
                    const bData = categorySpending[b.category];
                    return sum + (bData ? bData.total : 0);
                }, 0);
                const totalPercentage = Math.min((totalSpent / totalBudget) * 100, 100);
                const isTotalOver = totalSpent > totalBudget;

                return (
                    <Card className="mb-8 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-200">Total Monthly Budget</h3>
                                <div className="text-3xl font-bold mt-1">{formatMoney(totalSpent)} <span className="text-slate-400 text-xl font-normal">/ {formatMoney(totalBudget)}</span></div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${isTotalOver ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                                {totalPercentage.toFixed(1)}% Used
                            </div>
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-4 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${isTotalOver ? 'bg-red-500' : 'bg-indigo-500'}`}
                                style={{ width: `${totalPercentage}%` }}
                            />
                        </div>
                        <p className="mt-2 text-sm text-slate-400 text-right">
                            {isTotalOver ? 'You are over your total budget!' : `You have ${formatMoney(totalBudget - totalSpent)} remaining this month.`}
                        </p>
                    </Card>
                );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {budgets.map(budget => {
                    const budgetData = categorySpending[budget.category] || { total: 0, subs: {} };
                    const spent = budgetData.total;
                    const percentage = Math.min((spent / budget.limit) * 100, 100);
                    const isOver = spent > budget.limit;

                    // Sorted subs logic
                    const subEntries = Object.entries(budgetData.subs)
                        .filter(([name]) => name !== '_main') // Optional: hide main if you want only subs, or show all
                        .sort(([, a], [, b]) => b - a);

                    // If we have mixed spending (main + subs), _main represents direct parent category assignment
                    // Just show all keys from subs? User said: "inside it have sub categories and show them like this too"
                    // I will filter out _main for visual clarity if it's small, or maybe rename it to 'General'.
                    // Actually, if a user adds to 'Utilities' directly, it should probably show as 'Utilities (General)' or just be part of total.
                    // Let's list Subcategories specifically.

                    return (
                        <Card key={budget.id} className="relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{budget.category}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Monthly Limit</p>
                                </div>
                                <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                                    <button
                                        onClick={() => handleEdit(budget)}
                                        className="text-slate-400 hover:text-indigo-500 transition-colors p-1.5"
                                        title="Edit Budget"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => deleteBudget(budget.id)}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-1.5"
                                        title="Delete Budget"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-2 flex items-baseline gap-1">
                                <span className={`text-2xl font-bold ${isOver ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                                    {formatMoney(spent)}
                                </span>
                                <span className="text-slate-400">/ {formatMoney(budget.limit)}</span>
                            </div>

                            {/* Main Progress Bar */}
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 mb-4 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-indigo-500'}`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>

                            {/* Subcategory Breakdown */}
                            {subEntries.length > 0 && (
                                <div className="space-y-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Breakdown</p>
                                    {subEntries.map(([subName, subAmount]) => (
                                        <div key={subName} className="text-sm">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-slate-600 dark:text-slate-300">{subName}</span>
                                                <span className="text-slate-800 dark:text-slate-200 font-medium">{formatMoney(subAmount)}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-400/70 rounded-full"
                                                    style={{ width: `${Math.min((subAmount / budget.limit) * 100, 100)}%` }} // % of Main Budget
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {isOver && (
                                <div className="flex items-center gap-2 text-red-500 text-sm font-medium animate-pulse mt-4">
                                    <AlertCircle size={16} />
                                    <span>Over Budget!</span>
                                </div>
                            )}

                            {!isOver && percentage > 80 && (
                                <p className="text-amber-500 text-sm font-medium mt-4">Careful, you're close to the limit.</p>
                            )}
                        </Card>
                    );
                })}

                {budgets.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-slate-400 mb-4">No budgets set yet.</p>
                        <Button variant="outline" onClick={() => setIsModalOpen(true)}>Create your first budget</Button>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Set Category Budget"
            >
                <form onSubmit={handleSaveBudget} className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category (Parent Only)</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {expenseCategories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label="Monthly Limit"
                        type="number"
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                        placeholder="e.g. 20000"
                        min="0"
                        required
                    />
                    <Button type="submit" variant="primary" className="w-full mt-2">
                        Save Budget
                    </Button>
                </form>
            </Modal>
            {/* Mobile Floating Action Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className="md:hidden fixed bottom-24 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/40 z-40 hover:bg-indigo-700 active:scale-95 transition-all"
                aria-label="Set Budget"
            >
                <Plus size={24} />
            </button>
        </MainLayout>
    );
};

export default BudgetsPage;
