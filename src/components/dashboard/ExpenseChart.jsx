import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../common/Card';
import { useTransactions } from '../../hooks/useTransactions';
import { useCurrencyFormatter } from '../../utils';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']; // Indigo palette

const ExpenseChart = () => {
    const { transactions } = useTransactions();
    const formatMoney = useCurrencyFormatter();

    const data = useMemo(() => {
        const expenses = transactions.filter(t => parseFloat(t.amount) < 0);
        const categoryMap = {};

        expenses.forEach(t => {
            const category = t.category || 'Other';
            const amount = Math.abs(parseFloat(t.amount));
            categoryMap[category] = (categoryMap[category] || 0) + amount;
        });

        return Object.keys(categoryMap).map(key => ({
            name: key,
            value: categoryMap[key],
        }));
    }, [transactions]);

    if (data.length === 0) {
        return (
            <Card className="h-96 flex flex-col justify-center items-center">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Expenses by Category</h3>
                <p className="text-slate-400">No expenses to display</p>
            </Card>
        )
    }

    return (
        <Card className="h-96 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Expenses by Category</h3>
            <div className="flex-1 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatMoney(value)} />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default ExpenseChart;
