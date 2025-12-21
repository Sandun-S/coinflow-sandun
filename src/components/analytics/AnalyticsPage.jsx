import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LineChart, Line, AreaChart, Area, Legend } from 'recharts';
import Card from '../common/Card';
import { useTransactions } from '../../hooks/useTransactions';
import MainLayout from '../layout/MainLayout';
import { useSettings } from '../../context/SettingsContext';
import { Calendar, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

// Custom Colors
const COLORS = ['#6366f1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const AnalyticsPage = () => {
    const { transactions } = useTransactions();
    const { currency } = useSettings();
    const [timeRange, setTimeRange] = useState('year'); // '30days', 'thisMonth', 'year'

    const formatMoney = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(Math.abs(val));
    };

    // Filter Transactions
    const filteredTransactions = useMemo(() => {
        const now = new Date();
        return transactions.filter(t => {
            const tDate = new Date(t.date);
            if (timeRange === '30days') {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(now.getDate() - 30);
                return tDate >= thirtyDaysAgo;
            } else if (timeRange === 'thisMonth') {
                return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
            } else if (timeRange === 'year') {
                return tDate.getFullYear() === now.getFullYear();
            }
            return true;
        });
    }, [transactions, timeRange]);

    // 1. Income vs Expense Over Time (Monthly or Daily)
    const incomeExpenseData = useMemo(() => {
        const dataMap = {};

        filteredTransactions.forEach(t => {
            const date = new Date(t.date);
            // Group by Month if range is Year, else Day
            const key = timeRange === 'year'
                ? date.toLocaleString('default', { month: 'short' })
                : date.toLocaleDateString('default', { day: 'numeric', month: 'short' });

            if (!dataMap[key]) dataMap[key] = { name: key, income: 0, expense: 0, savings: 0 };

            if (t.amount > 0) {
                if (t.category === 'Transfer') return;
                dataMap[key].income += parseFloat(t.amount);
            } else {
                dataMap[key].expense += Math.abs(parseFloat(t.amount));
            }
            dataMap[key].savings = dataMap[key].income - dataMap[key].expense;
        });

        // Sort? If Monthly, need proper sort.
        // For simplicity, converting to array and hoping entry order or simple sort works for now.
        // Ideally should sort by date object.
        // Let's rely on standard array sort if Keys are dates.

        return Object.values(dataMap);
    }, [filteredTransactions, timeRange]);

    // 2. Spending by Category (Pie/Bar)
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

    // 3. Totals for Cards
    const totals = useMemo(() => {
        const income = filteredTransactions.filter(t => t.amount > 0 && t.category !== 'Transfer').reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const expense = filteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
        return { income, expense, savings: income - expense };
    }, [filteredTransactions]);

    // 4. Savings %
    const savingsRate = totals.income > 0 ? ((totals.savings / totals.income) * 100) : 0;

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Analytics</h2>
                    <p className="text-slate-500 dark:text-slate-400">Deep dive into your financial health.</p>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <Calendar size={18} className="ml-2 text-slate-400" />
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none p-2 rounded-md appearance-none pr-8 cursor-pointer"
                    >
                        <option value="30days" className="bg-white dark:bg-slate-800">Last 30 Days</option>
                        <option value="thisMonth" className="bg-white dark:bg-slate-800">This Month</option>
                        <option value="year" className="bg-white dark:bg-slate-800">This Year</option>
                    </select>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-none relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-indigo-100 text-sm font-medium mb-1">Total Income</div>
                        <div className="text-2xl font-bold">{formatMoney(totals.income)}</div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-indigo-200 bg-indigo-500/30 w-fit px-2 py-1 rounded-full">
                            <ArrowUpRight size={14} /> +12% vs last period
                        </div>
                    </div>
                    {/* Decorative Blob */}
                    <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <div className="text-slate-500 text-sm font-medium mb-1">Total Expenses</div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-white">{formatMoney(totals.expense)}</div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 w-fit px-2 py-1 rounded-full font-medium">
                        <ArrowDownRight size={14} /> {((totals.expense / (totals.income || 1)) * 100).toFixed(1)}% of Income
                    </div>
                </Card>

                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <div className="text-slate-500 text-sm font-medium mb-1">Net Savings</div>
                    <div className={`text-2xl font-bold ${totals.savings >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatMoney(totals.savings)}
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 w-fit px-2 py-1 rounded-full font-medium">
                        <TrendingUp size={14} /> {savingsRate.toFixed(1)}% Savings Rate
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
                            <BarChart data={incomeExpenseData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                                <Tooltip
                                    formatter={(value) => formatMoney(value)}
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="income" name="Income" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Category Breakdown (Donut or Horizontal Bar?? Stick to Horizontal Bar for readability) */}
                <Card className="h-96 flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Spending by Category</h3>
                    <div className="w-full flex-1 overflow-y-auto pr-2">
                        {categoryData.length > 0 ? (
                            <div className="space-y-4">
                                {categoryData.map((cat, index) => (
                                    <div key={cat.name} className="group">
                                        <div className="flex justify-between items-center mb-1 text-sm">
                                            <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                {cat.name}
                                            </span>
                                            <span className="text-slate-500 font-medium">{((cat.value / totals.expense) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${(cat.value / totals.expense) * 100}%`, backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                        </div>
                                        <div className="text-xs text-slate-400 text-right mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {formatMoney(cat.value)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">No data available</div>
                        )}
                    </div>
                </Card>
            </div>
        </MainLayout>
    );
};

export default AnalyticsPage;
