import React, { useState, useMemo } from 'react';
import MainLayout from '../layout/MainLayout';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import { useBudgets } from '../../context/BudgetContext';
import { useCategories } from '../../context/CategoryContext'; // Import categories
import { useTour } from '../../context/TourContext';
import { useTransactions } from '../../hooks/useTransactions';
import { useCurrencyFormatter } from '../../utils';
import { Plus, Trash2, AlertCircle, Pencil } from 'lucide-react';
import Modal from '../common/Modal';
import CategoryPicker from '../categories/CategoryPicker';
import { useAuth } from '../../context/AuthContext'; // Managed Gating

const BudgetsPage = () => {
    const { budgets, setBudget, deleteBudget } = useBudgets();
    const { transactions } = useTransactions();
    const { categories } = useCategories(); // Get categories
    const { nextStep } = useTour();
    const { user, isPro } = useAuth(); // Auth for gating
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

        const spending = {}; // { CategoryName: { total: 0, subs: {} } }

        monthlyExpenses.forEach(t => {
            const rawCat = t.category || 'General';
            const parentCat = getParentCategoryName(rawCat);
            const amount = Math.abs(parseFloat(t.amount));

            // 1. Track aggregated spending for Parent
            if (!spending[parentCat]) {
                spending[parentCat] = { total: 0, subs: {} };
            }
            spending[parentCat].total += amount;

            // Track subcategory breakdown for the Parent
            if (rawCat !== parentCat) {
                spending[parentCat].subs[rawCat] = (spending[parentCat].subs[rawCat] || 0) + amount;
            } else {
                spending[parentCat].subs['_main'] = (spending[parentCat].subs['_main'] || 0) + amount;
            }

            // 2. Track individual spending for Subcategory (if budget is set specifically for it)
            if (rawCat !== parentCat) {
                if (!spending[rawCat]) {
                    spending[rawCat] = { total: 0, subs: {} };
                }
                spending[rawCat].total += amount;
                // No 'subs' breakdown needed for a subcategory itself
            }
        });
        return spending;
    }, [transactions, categories]);

    const handleSaveBudget = async (e) => {
        e.preventDefault();
        // Gating Check inside handler as fallback
        if (!isPro(user) && budgets.length >= 3) {
            alert("Free Plan Limit Reached! Upgrade to set unlimited budgets.");
            return;
        }

        if (!limit || !selectedCategory) return;
        await setBudget(selectedCategory, limit);
        setIsModalOpen(false);
        setLimit('');
        nextStep(); // Advance tour
    };

    const handleEdit = (budget) => {
        setSelectedCategory(budget.category);
        setLimit(budget.limit);
        setIsModalOpen(true);
    };

    // Group budgets by Parent Category
    const groupedBudgets = useMemo(() => {
        const groups = {}; // { ParentName: { main: BudgetDoc, subs: [BudgetDocs] } }

        budgets.forEach(b => {
            const parent = getParentCategoryName(b.category);
            if (!groups[parent]) groups[parent] = { main: null, subs: [] };

            if (b.category === parent) {
                groups[parent].main = b;
            } else {
                groups[parent].subs.push(b);
            }
        });

        // Convert to array for rendering
        return Object.entries(groups).map(([parentName, data]) => {
            let totalLimit = 0;
            // Strategy: If Main exists, use its limit? Or if Subs exist, sum them?
            // User requirement: "if i create all subcategories under one main category, show all inside one card"
            // If main budget exists, that is the Ceiling.
            // If only sub budgets exist, the Ceiling is the sum of them.
            // Wait, if Main exists (Limit 50k), and Sub exists (Limit 20k), total budget is 50k? Or 50k + 20k?
            // Usually Main Budget covers everything. Sub Budget is a "Soft Limit" inside it.
            // Let's assume:
            // Top Level Limit = main.limit IF main exists.
            // ELSE Top Level Limit = Sum(subs.limit).

            if (data.main) {
                totalLimit = parseFloat(data.main.limit);
            } else {
                totalLimit = data.subs.reduce((sum, s) => sum + parseFloat(s.limit), 0);
            }

            return {
                parentName,
                mainBudget: data.main,
                subBudgets: data.subs,
                limit: totalLimit
            };
        });
    }, [budgets, categories]);

    // Filter to only show Parent Categories for budgeting (for the form)
    const expenseCategories = categories.filter(c => c.type === 'expense');

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Budgets</h2>
                    <p className="text-slate-500 dark:text-slate-400">Set monthly limits for your main categories.</p>
                </div>
                <Button
                    onClick={() => {
                        if (!isPro(user) && budgets.length >= 3) {
                            alert("Free Plan Limit Reached! Upgrade to set unlimited budgets.");
                            return;
                        }
                        setIsModalOpen(true);
                        nextStep();
                    }}
                    className="hidden md:flex items-center gap-2"
                    data-tour="set-budget-desktop"
                >
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
                            <div className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${isTotalOver ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
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

            {/* Masonry Layout for Variable Heights */}
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {groupedBudgets.map(group => {
                    const { parentName, mainBudget, subBudgets, limit } = group;

                    // Get aggregations from categorySpending (already sums up parents + subs)
                    const spentData = categorySpending[parentName] || { total: 0, subs: {} };
                    const totalSpent = spentData.total;

                    // Progress
                    const percentage = Math.min((totalSpent / limit) * 100, 100);
                    const isOver = totalSpent > limit;

                    // Determine what to show in Breakdown
                    // We want to show:
                    // 1. Explicit Sub-Budgets (Limit vs Spent)
                    // 2. Spent on categories that have NO budget? (Maybe just catch-all or standard list)
                    // User said: "show them like this too". The previous version showed all spending contributors.
                    // Let's merge "Spending Contributors" with "Budget Targets".

                    // We need a list of ALL subcategories that have either Spending OR a Budget.
                    const relevantSubs = new Set([
                        ...Object.keys(spentData.subs).filter(k => k !== '_main'),
                        ...subBudgets.map(b => b.category)
                    ]);

                    // ... logic remains ...

                    const breakdown = Array.from(relevantSubs).map(subName => {
                        const subSpent = spentData.subs[subName] || 0;
                        const subBudgetDoc = subBudgets.find(b => b.category === subName);
                        // If separate sub budget exists, use it. Else... it contributes to main.
                        const subLimit = subBudgetDoc ? parseFloat(subBudgetDoc.limit) : 0;

                        return {
                            name: subName,
                            spent: subSpent,
                            limit: subLimit,
                            hasBudget: !!subBudgetDoc
                        };
                    }).sort((a, b) => b.spent - a.spent); // Sort by spending

                    return (
                        <div key={parentName} className="break-inside-avoid">
                            <Card className="relative overflow-hidden h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{parentName}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {mainBudget ? 'Total Limit' : 'Combined Limit'}
                                        </p>
                                    </div>
                                    <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                                        {/* Action buttons - tricky. If we have multiple budgets, which one to edit?
                                        Maybe separate Edit buttons for Main vs Sub?
                                        For now, if Main exists, Edit Main. If not... maybe prompt to add Main?
                                    */}
                                        {mainBudget && (
                                            <>
                                                <button
                                                    onClick={() => handleEdit(mainBudget)}
                                                    className="text-slate-400 hover:text-indigo-500 transition-colors p-1.5"
                                                    title="Edit Main Budget"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => deleteBudget(mainBudget.id)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors p-1.5"
                                                    title="Delete Main Budget"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-2 flex items-baseline gap-1">
                                    <span className={`text-2xl font-bold ${isOver ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                                        {formatMoney(totalSpent)}
                                    </span>
                                    <span className="text-slate-400">/ {formatMoney(limit)}</span>
                                </div>

                                {/* Main Progress Bar */}
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 mb-4 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-indigo-500'}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>

                                {/* Subcategory Breakdown */}
                                {breakdown.length > 0 && (
                                    <div className="space-y-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Breakdown</p>
                                        {breakdown.map((item) => {
                                            // Calculate sub-bar width.
                                            // If it has its own limit, % of that limit.
                                            // If NO limit, % of Main Limit? Or just visual of Contribution?
                                            // User: "show them like this too". Let's show specific sub-budget progress if defined.

                                            const itemLimit = item.limit > 0 ? item.limit : limit; // Fallback to main limit for relative visual
                                            const itemPercent = Math.min((item.spent / itemLimit) * 100, 100);
                                            const isSubOver = item.limit > 0 && item.spent > item.limit;

                                            // UI Tweak: Differentiate Budgeted vs. Unbudgeted bars
                                            const barColor = item.hasBudget
                                                ? (isSubOver ? 'bg-red-400' : 'bg-indigo-400/70')
                                                : 'bg-slate-300 dark:bg-slate-600'; // Neutral

                                            return (
                                                <div key={item.name} className="text-sm group">
                                                    <div className="flex justify-between mb-1 items-center">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                                                            {item.hasBudget && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-500 border border-indigo-100 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300">
                                                                    {formatMoney(item.limit)}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-medium ${isSubOver ? 'text-red-500' : 'text-slate-800 dark:text-slate-200'}`}>
                                                                {formatMoney(item.spent)}
                                                            </span>

                                                            {/* Sub Actions - Edit/Delete specific sub budgets */}
                                                            {item.hasBudget && (
                                                                <div className="flex opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => {
                                                                            // Find the budget doc again? Or cleaner way?
                                                                            const b = subBudgets.find(sb => sb.category === item.name);
                                                                            if (b) handleEdit(b);
                                                                        }}
                                                                        className="p-1 text-slate-300 hover:text-indigo-500"
                                                                    >
                                                                        <Pencil size={12} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            const b = subBudgets.find(sb => sb.category === item.name);
                                                                            if (b) deleteBudget(b.id);
                                                                        }}
                                                                        className="p-1 text-slate-300 hover:text-red-500"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Sub Progress Bar */}
                                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${barColor}`}
                                                            style={{ width: `${itemPercent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
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
                        </div>
                    );
                })}

                {budgets.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-slate-400 mb-4">No budgets set yet.</p>
                        <Button variant="outline" onClick={() => { setIsModalOpen(true); nextStep(); }}>Create your first budget</Button>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Set Category Budget"
            >
                <form onSubmit={handleSaveBudget} className="space-y-4">
                    <div className="flex flex-col gap-1.5" data-tour="budget-category-picker">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                        <CategoryPicker
                            selectedCategory={selectedCategory}
                            onSelect={setSelectedCategory}
                            type="expense"
                        />
                    </div>
                    <Input
                        label="Monthly Limit"
                        type="number"
                        value={limit}
                        onChange={(e) => setLimit(e.target.value)}
                        placeholder="e.g. 20000"
                        min="0"
                        required
                        data-tour="budget-limit-input"
                    />
                    <Button type="submit" variant="primary" className="w-full mt-2" data-tour="budget-save-btn">
                        Save Budget
                    </Button>
                </form>
            </Modal>
            {/* Mobile Floating Action Button */}
            <button
                onClick={() => {
                    if (!isPro(user) && budgets.length >= 3) {
                        alert("Free Plan Limit Reached! Upgrade to set unlimited budgets.");
                        return;
                    }
                    setIsModalOpen(true);
                    nextStep();
                }}
                className="md:hidden fixed bottom-24 right-6 p-4 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/40 z-40 hover:bg-indigo-700 active:scale-95 transition-all"
                aria-label="Set Budget"
                data-tour="set-budget-mobile"
            >
                <Plus size={24} />
            </button>
        </MainLayout>
    );
};

export default BudgetsPage;
