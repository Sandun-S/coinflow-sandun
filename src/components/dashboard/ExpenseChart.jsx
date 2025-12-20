import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../common/Card';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../context/CategoryContext'; // Import categories
import { useCurrencyFormatter } from '../../utils';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f97316']; // Improved palette

const ExpenseChart = () => {
    const { transactions } = useTransactions();
    const { categories } = useCategories();
    const formatMoney = useCurrencyFormatter();

    // Helper: Find Parent Name for a given category name
    const getParentCategoryName = (catName) => {
        const parent = categories.find(c => c.name === catName);
        if (parent) return parent.name;

        const parentOfSub = categories.find(c => c.subcategories && c.subcategories.includes(catName));
        if (parentOfSub) return parentOfSub.name;

        return catName; // Fallback
    };

    const data = useMemo(() => {
        const expenses = transactions.filter(t => parseFloat(t.amount) < 0);
        const categoryMap = {};

        expenses.forEach(t => {
            const rawCat = t.category || 'Other';
            const parentCat = getParentCategoryName(rawCat);
            const amount = Math.abs(parseFloat(t.amount));
            categoryMap[parentCat] = (categoryMap[parentCat] || 0) + amount;
        });

        return Object.keys(categoryMap)
            .map(key => ({
                name: key,
                value: categoryMap[key],
            }))
            .sort((a, b) => b.value - a.value); // Sort bigger slices first
    }, [transactions, categories]);

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
            <div className="flex-1 w-full relative min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60} // Donut chart for modern look
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => formatMoney(value)}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export default ExpenseChart;
