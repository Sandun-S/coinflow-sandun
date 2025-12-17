import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import Card from '../common/Card';
import { useTransactions } from '../../hooks/useTransactions';
import MainLayout from '../layout/MainLayout';
import { useSettings } from '../../context/SettingsContext';

const AnalyticsPage = () => {
    const { transactions } = useTransactions();
    const { currency } = useSettings();

    // Data for Bar Chart
    const barData = useMemo(() => {
        const expenses = transactions.filter(t => t.amount < 0);
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
    }, [transactions]);

    // Top 3 Transactions
    const topExpenses = useMemo(() => {
        return transactions
            .filter(t => t.amount < 0)
            .sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount)) // Descending, but amounts are negative, so careful
            .sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount)) // Ascending logic: -500 is smaller than -100. So -500 comes first (top expense)
            .slice(0, 3);
    }, [transactions]);

    const formatMoney = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(Math.abs(val));
    };

    return (
        <MainLayout>
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Analytics</h2>
                <p className="text-gray-500 dark:text-gray-400">Deep dive into your spending habits.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart */}
                <Card className="h-96">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-6">Spending per Category</h3>
                    {barData.length > 0 ? (
                        <div className="w-full h-full pb-8">
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#4B5563' }} />
                                    <Tooltip
                                        formatter={(value) => formatMoney(value)}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="amount" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={32}>
                                        {barData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            No data available
                        </div>
                    )}
                </Card>

                {/* Top Expenses */}
                <Card>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-6">Top 3 Highest Expenses</h3>
                    {topExpenses.length > 0 ? (
                        <div className="space-y-4">
                            {topExpenses.map((t) => (
                                <div key={t.id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-gray-100">{t.text}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                                    </div>
                                    <span className="text-xl font-bold text-red-600 dark:text-red-400">
                                        {formatMoney(t.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-64 text-gray-400">
                            No expenses recorded
                        </div>
                    )}
                </Card>
            </div>
        </MainLayout>
    );
};

export default AnalyticsPage;
