import React, { useState, useMemo } from 'react';
import MainLayout from '../layout/MainLayout';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import { useBudgets } from '../../context/BudgetContext';
import { useTransactions } from '../../hooks/useTransactions';
import { useCurrencyFormatter } from '../../utils';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';

const BudgetsPage = () => {
    const { budgets, setBudget, deleteBudget } = useBudgets();
    const { transactions } = useTransactions();
    const formatMoney = useCurrencyFormatter();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('Food');
    const [limit, setLimit] = useState('');

    const CATEGORIES = ["Food", "Transport", "Utilities", "Entertainment", "Health", "Shopping", "General"];

    // Calculate spending per category (Monthly)
    const categorySpending = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyExpenses = transactions.filter(t => {
            const tDate = new Date(t.date);
            return t.amount < 0 && tDate >= startOfMonth;
        });

        const spending = {};
        monthlyExpenses.forEach(t => {
            const cat = t.category || 'General';
            spending[cat] = (spending[cat] || 0) + Math.abs(parseFloat(t.amount));
        });
        return spending;
    }, [transactions]);

    const handleSaveBudget = async (e) => {
        e.preventDefault();
        if (!limit) return;
        await setBudget(selectedCategory, limit);
        setIsModalOpen(false);
        setLimit('');
    };

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Budgets</h2>
                    <p className="text-slate-500 dark:text-slate-400">Set monthly limits and track your goals.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
                    <Plus size={20} /> Set Budget
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {budgets.map(budget => {
                    const spent = categorySpending[budget.category] || 0;
                    const percentage = Math.min((spent / budget.limit) * 100, 100);
                    const isOver = spent > budget.limit;

                    return (
                        <Card key={budget.id} className="relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{budget.category}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Monthly Limit</p>
                                </div>
                                <button
                                    onClick={() => deleteBudget(budget.id)}
                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="mb-2 flex items-baseline gap-1">
                                <span className={`text-2xl font-bold ${isOver ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                                    {formatMoney(spent)}
                                </span>
                                <span className="text-slate-400">/ {formatMoney(budget.limit)}</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 mb-4 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-indigo-500'}`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>

                            {isOver && (
                                <div className="flex items-center gap-2 text-red-500 text-sm font-medium animate-pulse">
                                    <AlertCircle size={16} />
                                    <span>Over Budget!</span>
                                </div>
                            )}

                            {!isOver && percentage > 80 && (
                                <p className="text-amber-500 text-sm font-medium">Careful, you're close to the limit.</p>
                            )}

                            {!isOver && percentage <= 80 && (
                                <p className="text-green-500 text-sm font-medium">On track!</p>
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
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
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
        </MainLayout>
    );
};

export default BudgetsPage;
