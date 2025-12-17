import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LineChart, Line } from 'recharts';
import Card from '../common/Card';
import { useTransactions } from '../../hooks/useTransactions';
import MainLayout from '../layout/MainLayout';
import { useSettings } from '../../context/SettingsContext';
import { Calendar } from 'lucide-react';

const AnalyticsPage = () => {
    const { transactions } = useTransactions();
    const { currency } = useSettings();
    const [timeRange, setTimeRange] = useState('30days'); // '30days', 'thisMonth', 'year'

    // Filter Transactions based on Time Range
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

    // Data for Bar Chart (Category Spending)
    const barData = useMemo(() => {
        const expenses = filteredTransactions.filter(t => t.amount < 0);
        const categoryMap = {};

        expenses.forEach(t => {
            const category = t.category || 'Other';
            const amount = Math.abs(parseFloat(t.amount));
            categoryMap[category] = (categoryMap[category] || 0) + amount;
        });

        return Object.keys(categoryMap).map(key => ({
            name: key,
            amount: categoryMap[key],
        })).sort((a, b) => b.amount - a.amount);
    }, [filteredTransactions]);

    // Data for Line Chart (Spending Trend)
    const trendData = useMemo(() => {
        const dataMap = {};

        // Initialize based on range?? For simplicity, just map existing transaction dates
        // Or create buckets. For now, daily buckets.
        filteredTransactions.forEach(t => {
            // Only consider expenses? or Net? Let's do Net Balance for trend or Expense Trend. 
            // Request said "Spending vs Time". So Expenses.
            if (t.amount < 0) {
                const dateKey = new Date(t.date).toLocaleDateString(); // Simple key
                const amount = Math.abs(parseFloat(t.amount));
                dataMap[dateKey] = (dataMap[dateKey] || 0) + amount;
            }
        });

        const data = Object.keys(dataMap).map(date => ({
            date,
            amount: dataMap[date]
        }));

        // Sort by date
        return data.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [filteredTransactions]);


    // Top 3 Transactions
    const topExpenses = useMemo(() => {
        return filteredTransactions
            .filter(t => t.amount < 0)
            .sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount)) // Descending amounts
            .sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount))
            .slice(0, 3);
    }, [filteredTransactions]);

    const formatMoney = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(Math.abs(val));
    };

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Analytics</h2>
                    <p className="text-slate-500 dark:text-slate-400">Deep dive into your spending habits.</p>
                </div>

                {/* Time Filter */}
                {/* Time Filter */}
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm relative z-20">
                    <Calendar size={18} className="ml-2 text-slate-400" />
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none p-2 rounded-md appearance-none pr-8 cursor-pointer"
                        style={{ backgroundColor: 'transparent' }} // Ensure transparency
                    >
                        <option value="30days" className="text-slate-700 bg-white dark:bg-slate-800 dark:text-white">Last 30 Days</option>
                        <option value="thisMonth" className="text-slate-700 bg-white dark:bg-slate-800 dark:text-white">This Month</option>
                        <option value="year" className="text-slate-700 bg-white dark:bg-slate-800 dark:text-white">Year to Date</option>
                    </select>
                </div>
            </div>

            {/* Trend Chart (Line) */}
            <Card className="h-80 mb-8 flex flex-col">
                <h3 className="text-lg font-semibold text-slate-700 dark:text-gray-200 mb-6">Spending Trend</h3>
                {trendData.length > 0 ? (
                    <div className="w-full flex-1 min-h-0 pb-4 relative">
                        <ResponsiveContainer width="99%" height="100%">
                            <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                                <Tooltip
                                    formatter={(value) => formatMoney(value)}
                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                                />
                                <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex items-center justify-center flex-1 text-slate-400">
                        No spending data for this period.
                    </div>
                )}
            </Card>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart */}
                <Card className="h-96 flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-gray-200 mb-6">Spending per Category</h3>
                    {barData.length > 0 ? (
                        <div className="w-full flex-1 min-h-0 pb-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                    <Tooltip
                                        formatter={(value) => formatMoney(value)}
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                                    />
                                    <Bar dataKey="amount" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={24}>
                                        {barData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#6366f1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">
                            No data available
                        </div>
                    )}
                </Card>

                {/* Top Expenses */}
                <Card>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-gray-200 mb-6">Top 3 Highest Expenses</h3>
                    {topExpenses.length > 0 ? (
                        <div className="space-y-4">
                            {topExpenses.map((t) => (
                                <div key={t.id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-gray-100">{t.text}</p>
                                        <p className="text-sm text-slate-500 dark:text-gray-400">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                                    </div>
                                    <span className="text-xl font-bold text-red-600 dark:text-red-400">
                                        {formatMoney(t.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-slate-400">
                            No expenses recorded
                        </div>
                    )}
                </Card>
            </div>
        </MainLayout>
    );
};

export default AnalyticsPage;
