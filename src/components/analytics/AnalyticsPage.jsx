import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import Card from '../common/Card';
import { useTransactions } from '../../hooks/useTransactions';
import MainLayout from '../layout/MainLayout';
import { useSettings } from '../../context/SettingsContext';
import { Calendar, TrendingUp, AlertCircle, Target, Award } from 'lucide-react'; // Added Icons

// Custom Colors
const COLORS = ['#6366f1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const AnalyticsPage = () => {
    const { transactions } = useTransactions();
    const { currency } = useSettings();
    const [timeRange, setTimeRange] = useState('thisMonth'); // '30days', 'thisMonth', 'year'

    const formatMoney = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(Math.abs(val));
    };

    // --- 1. Filter Logic (Fixed) ---
    const filteredTransactions = useMemo(() => {
        const now = new Date();
        now.setHours(23, 59, 59, 999); // End of today

        return transactions.filter(t => {
            const tDate = new Date(t.date);
            tDate.setHours(0, 0, 0, 0); // Normalize transaction date

            if (timeRange === '30days') {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(now.getDate() - 30);
                thirtyDaysAgo.setHours(0, 0, 0, 0);
                return tDate >= thirtyDaysAgo && tDate <= now;
            } else if (timeRange === 'thisMonth') {
                return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
            } else if (timeRange === 'year') {
                return tDate.getFullYear() === now.getFullYear();
            }
            return true;
        });
    }, [transactions, timeRange]);

    // --- 2. Metrics Calculation (Smart Analytics) ---
    const metrics = useMemo(() => {
        const income = filteredTransactions
            .filter(t => t.amount > 0 && t.category !== 'Transfer' && t.category !== 'Investment Return')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const expense = filteredTransactions
            .filter(t => t.amount < 0 && t.category !== 'Transfer')
            .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

        const savings = income - expense;
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;

        // Predictive Logic
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentDay = now.getDate();

        let dailyAverage = 0;
        let projectedExpense = 0;

        if (timeRange === 'thisMonth') {
            dailyAverage = expense / (currentDay || 1);
            projectedExpense = dailyAverage * daysInMonth;
        } else if (timeRange === '30days') {
            dailyAverage = expense / 30;
            projectedExpense = dailyAverage * 30; // Just projection of trend
        } else {
            // Year: Monthly Average
            const currentMonth = now.getMonth() + 1; // 1-12
            dailyAverage = expense / (currentMonth || 1); // Actually Monthly Avg here
        }

        // Top Spending Category
        const catMap = {};
        filteredTransactions.filter(t => t.amount < 0).forEach(t => {
            catMap[t.category] = (catMap[t.category] || 0) + Math.abs(t.amount);
        });
        const topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

        return {
            income,
            expense,
            savings,
            savingsRate,
            dailyAverage,
            projectedExpense,
            topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null
        };
    }, [filteredTransactions, timeRange]);

    // --- 3. Chart Data (Sorted) ---
    const chartData = useMemo(() => {
        const dataMap = {};

        filteredTransactions.forEach(t => {
            if (t.category === 'Transfer') return;

            const date = new Date(t.date);
            // Sort Key (YYYY-MM-DD) for correct ordering
            const sortKey = timeRange === 'year'
                ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` // YYYY-MM
                : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; // YYYY-MM-DD

            // Display Label
            const label = timeRange === 'year'
                ? date.toLocaleString('default', { month: 'short' })
                : date.toLocaleDateString('default', { day: 'numeric', month: 'short' });

            if (!dataMap[sortKey]) {
                dataMap[sortKey] = {
                    sortKey,
                    name: label,
                    income: 0,
                    expense: 0
                };
            }

            if (t.amount > 0) {
                dataMap[sortKey].income += parseFloat(t.amount);
            } else {
                dataMap[sortKey].expense += Math.abs(parseFloat(t.amount));
            }
        });

        // Convert to array and SORT by SortKey
        return Object.values(dataMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }, [filteredTransactions, timeRange]);

    const categoryData = useMemo(() => {
        const expenses = filteredTransactions.filter(t => t.amount < 0);
        const map = {};
        expenses.forEach(t => {
            const cat = t.category || 'Uncategorized';
            map[cat] = (map[cat] || 0) + Math.abs(parseFloat(t.amount));
        });
        return Object.keys(map)
            .map(k => ({ name: k, value: map[k] }))
            .sort((a, b) => b.value - a.value);
    }, [filteredTransactions]);

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Analytics</h2>
                    <p className="text-slate-500 dark:text-slate-400">Financial insights & predictions.</p>
                </div>

                {/* Improved Time Range Selector (Segmented Control) */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {[
                        { id: '30days', label: 'Last 30 Days' },
                        { id: 'thisMonth', label: 'This Month' },
                        { id: 'year', label: 'This Year' }
                    ].map(option => (
                        <button
                            key={option.id}
                            onClick={() => setTimeRange(option.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeRange === option.id
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Smart Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* 1. Daily Average */}
                <Card className="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-300">
                            <Calendar size={20} />
                        </div>
                        {timeRange === 'thisMonth' && (
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                                Daily Avg
                            </span>
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                            {timeRange === 'year' ? 'Monthly Average' : 'Daily Spending'}
                        </p>
                        <h4 className="text-2xl font-bold text-slate-800 dark:text-white">
                            {formatMoney(metrics.dailyAverage)}
                        </h4>
                    </div>
                </Card>

                {/* 2. Projected Spend (Only for Month) */}
                <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg text-amber-600 dark:text-amber-300">
                            <Target size={20} />
                        </div>
                        <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                            Projection
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                            Projected Total
                        </p>
                        <h4 className="text-2xl font-bold text-slate-800 dark:text-white">
                            {timeRange === 'thisMonth' ? formatMoney(metrics.projectedExpense) : '---'}
                        </h4>
                        {timeRange === 'thisMonth' && (
                            <p className="text-xs text-amber-600 mt-1">
                                End of month estimate
                            </p>
                        )}
                    </div>
                </Card>

                {/* 3. Top Category */}
                <Card className="bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-300">
                            <Award size={20} />
                        </div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                            Top Category
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                            Highest Spend
                        </p>
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white truncate">
                            {metrics.topCategory ? metrics.topCategory.name : 'None'}
                        </h4>
                        <p className="text-emerald-600 font-bold">
                            {metrics.topCategory ? formatMoney(metrics.topCategory.amount) : '-'}
                        </p>
                    </div>
                </Card>

                {/* 4. Savings Rate */}
                <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-300">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                            Savings
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                            Savings Rate
                        </p>
                        <h4 className="text-2xl font-bold text-slate-800 dark:text-white">
                            {metrics.savingsRate.toFixed(1)}%
                        </h4>
                        <p className={`text-xs mt-1 ${metrics.savings > 0 ? 'text-blue-600' : 'text-red-500'}`}>
                            {metrics.savings > 0 ? `Saved ${formatMoney(metrics.savings)}` : `Overspent ${formatMoney(Math.abs(metrics.savings))}`}
                        </p>
                    </div>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                {/* Income vs Expense Chart */}
                <Card className="h-96 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Income vs Expense</h3>
                    <div className="w-full flex-1">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                                <Tooltip
                                    formatter={(value) => formatMoney(value)}
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="income" name="Income" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Category Breakdown */}
                <Card className="h-96 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Spending by Category</h3>
                    <div className="w-full flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {categoryData.length > 0 ? (
                            <div className="space-y-4">
                                {categoryData.map((cat, index) => (
                                    <div key={cat.name} className="group">
                                        <div className="flex justify-between items-center mb-1 text-sm">
                                            <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                {cat.name}
                                            </span>
                                            <span className="text-slate-500 font-medium">{((cat.value / metrics.expense) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${(cat.value / metrics.expense) * 100}%`, backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                        </div>
                                        <div className="text-xs text-slate-400 text-right mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {formatMoney(cat.value)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-2">
                                <AlertCircle size={32} opacity={0.5} />
                                <span>No spending data for this period</span>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </MainLayout>
    );
};

export default AnalyticsPage;
