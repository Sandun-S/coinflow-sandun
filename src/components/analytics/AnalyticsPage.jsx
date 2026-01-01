import React, { useMemo, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import Card from '../common/Card';
import { useTransactions } from '../../hooks/useTransactions';
import { useAccounts } from '../../context/AccountContext';
import { useBudgets } from '../../context/BudgetContext';
import { useSubscriptions } from '../../context/SubscriptionContext';
import { useCategories } from '../../context/CategoryContext';
import MainLayout from '../layout/MainLayout';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { Calendar, TrendingUp, AlertCircle, Target, Award, Wallet, Briefcase, CreditCard, PiggyBank, ArrowUpRight, ArrowDownRight, Activity, Percent, BarChart3 } from 'lucide-react';

// Modern Palette
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

const AnalyticsPage = () => {
    const { user, isPro } = useAuth();
    const { transactions } = useTransactions();
    const { accounts } = useAccounts();
    const { currency } = useSettings();
    const [timeRange, setTimeRange] = useState('thisMonth'); // '30days', 'thisMonth', 'year'

    const formatMoney = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(val);
    };

    // --- 1. Filter Logic ---
    const filteredTransactions = useMemo(() => {
        const now = new Date();
        now.setHours(23, 59, 59, 999);

        return transactions.filter(t => {
            const tDate = new Date(t.date);
            tDate.setHours(0, 0, 0, 0);

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

    // --- 2. Chart Data Aggregation (Restored) ---
    const chartData = useMemo(() => {
        const dataMap = {};
        filteredTransactions.forEach(t => {
            if (t.category === 'Transfer' || t.category === 'Investment Return') return;

            const date = new Date(t.date);
            // Key format based on range
            let sortKey, label;

            if (timeRange === 'year') {
                sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                label = date.toLocaleString('default', { month: 'short' });
            } else {
                sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                label = date.toLocaleDateString('default', { day: 'numeric', month: 'short' });
            }

            if (!dataMap[sortKey]) {
                dataMap[sortKey] = { sortKey, name: label, income: 0, expense: 0 };
            }
            if (t.amount > 0) dataMap[sortKey].income += parseFloat(t.amount);
            else dataMap[sortKey].expense += Math.abs(parseFloat(t.amount));
        });
        return Object.values(dataMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }, [filteredTransactions, timeRange]);

    // --- 3. Weekday Analysis (New Feature) ---
    const weekdayData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const counts = Array(7).fill(0);
        filteredTransactions.forEach(t => {
            if (t.amount < 0) {
                const day = new Date(t.date).getDay();
                counts[day] += Math.abs(parseFloat(t.amount));
            }
        });
        return days.map((day, i) => ({ name: day, value: counts[i] }));
    }, [filteredTransactions]);

    // --- 4. Core Metrics ---
    const metrics = useMemo(() => {
        const income = filteredTransactions
            .filter(t => t.amount > 0 && t.category !== 'Transfer' && t.category !== 'Investment Return')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const expense = filteredTransactions
            .filter(t => t.amount < 0 && t.category !== 'Transfer')
            .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

        const savings = income - expense;

        let savingsRate = 0;
        if (income > 0) savingsRate = (savings / income) * 100;
        else if (income === 0 && expense > 0) savingsRate = -100;

        // Daily Average
        const now = new Date();
        const currentDay = now.getDate();
        let dailyAverage = 0;
        if (timeRange === 'thisMonth') dailyAverage = expense / (currentDay || 1);
        else if (timeRange === '30days') dailyAverage = expense / 30;
        else dailyAverage = expense / ((now.getMonth() + 1) * 30);

        // Loans
        const loans = accounts.filter(a => a.type === 'Loan');
        const totalLoanDebt = loans.reduce((sum, a) => sum + Math.abs(a.balance), 0);
        const totalLoanPrincipal = loans.reduce((sum, a) => sum + (a.loanTotal || 0), 0);
        const loanProgress = totalLoanPrincipal > 0 ? ((totalLoanPrincipal - totalLoanDebt) / totalLoanPrincipal) * 100 : 0;
        const monthlyLoanCommitments = loans.reduce((sum, a) => sum + (a.loanPayment || 0), 0);

        // Investments & Net Worth
        const investments = accounts.filter(a => a.type === 'Investment');
        const totalInvested = investments.reduce((sum, a) => sum + a.balance, 0);
        const cash = accounts.filter(a => ['Cash', 'Bank', 'Mobile Wallet'].includes(a.type)).reduce((sum, a) => sum + a.balance, 0);
        const creditCards = accounts.filter(a => a.type === 'Credit Card');
        const creditCardDebt = creditCards.reduce((sum, a) => sum + ((a.creditLimit || 0) - a.balance), 0);

        const totalDebt = totalLoanDebt + creditCardDebt;
        const netWorth = (cash + totalInvested) - totalDebt;

        return {
            income, expense, savings, savingsRate, dailyAverage,
            totalLoanDebt, totalLoanPrincipal, loanProgress, monthlyLoanCommitments,
            totalInvested, netWorth, totalDebt,
            // Fallback for division by zero
            dtiRatio: income > 0 ? (monthlyLoanCommitments / income) * 100 : 0
        };
    }, [filteredTransactions, timeRange, accounts]);

    // --- 5. Spending By Category Data ---
    const categoryData = useMemo(() => {
        const expenses = filteredTransactions.filter(t => t.amount < 0 && t.category !== 'Transfer');
        const map = {};
        let total = 0;
        expenses.forEach(t => {
            const cat = t.category || 'Uncategorized';
            const val = Math.abs(parseFloat(t.amount));
            map[cat] = (map[cat] || 0) + val;
            total += val;
        });

        return Object.keys(map)
            .map(k => ({ name: k, value: map[k], percent: (map[k] / total) * 100 }))
            .sort((a, b) => b.value - a.value);
    }, [filteredTransactions]);

    return (
        <MainLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Analytics</h2>
                    <p className="text-slate-500 dark:text-slate-400">Financial insights & health check.</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {[{ id: '30days', label: 'Last 30 Days' }, { id: 'thisMonth', label: 'This Month' }, { id: 'year', label: 'This Year' }].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setTimeRange(opt.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeRange === opt.id ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Pro Lock */}
            {!isPro(user) && (
                <div className="absolute inset-0 z-50 flex items-start justify-center pt-40 pointer-events-none">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-indigo-500/20 max-w-lg text-center mx-4 pointer-events-auto">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-indigo-500/30">
                            <TrendingUp size={32} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Unlock Analytics 💎</h2>
                        <p className="text-slate-600 dark:text-slate-300 mb-8">Get deep insights into your Net Worth, Loan Progress, and Future Wealth Projections.</p>
                        <a href="/profile" className="block w-full py-4 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:scale-[1.02] transition-transform">
                            Upgrade to Lifetime
                        </a>
                    </div>
                </div>
            )}

            {/* Content Body */}
            <div className={`transition-all duration-500 space-y-6 ${!isPro(user) ? 'filter blur-xl opacity-40 pointer-events-none h-screen overflow-hidden' : ''}`}>

                {/* --- 1. Top Cards (Summary) --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Savings Rate */}
                    <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-lg shadow-emerald-500/20">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-white/20 rounded-lg"><Percent size={20} /></div>
                            <span className="text-xs font-bold bg-black/20 px-2 py-1 rounded-full">Savings Rate</span>
                        </div>
                        <h3 className="text-4xl font-bold mb-1">{metrics.savingsRate.toFixed(1)}%</h3>
                        <p className="text-emerald-100 text-sm">
                            {metrics.savings >= 0 ? 'Deficit' : 'Surplus'} of {formatMoney(Math.abs(metrics.savings))}
                        </p>
                    </Card>

                    {/* Net Worth */}
                    <Card className="bg-white dark:bg-slate-800 shadow-sm border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400"><Wallet size={20} /></div>
                            <span className="text-xs font-bold text-slate-500">Estimated Net Worth</span>
                        </div>
                        <h3 className={`text-4xl font-bold mb-1 ${metrics.netWorth >= 0 ? 'text-slate-800 dark:text-white' : 'text-red-500'}`}>
                            {formatMoney(metrics.netWorth)}
                        </h3>
                        <p className="text-slate-500 text-sm">Cash + Invest - Debt</p>
                    </Card>

                    {/* Daily Avg */}
                    <Card className="bg-white dark:bg-slate-800 shadow-sm border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400"><Activity size={20} /></div>
                            <span className="text-xs font-bold text-slate-500">Daily Spending</span>
                        </div>
                        <h3 className="text-4xl font-bold text-slate-800 dark:text-white mb-1">{formatMoney(metrics.dailyAverage)}</h3>
                        <p className="text-slate-500 text-sm">Average per day</p>
                    </Card>
                </div>

                {/* --- 2. Advanced Metrics (Loans & Investments) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Loan Commitments */}
                    <Card className="border-red-100 dark:border-red-900/20 bg-red-50/50 dark:bg-red-900/10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-red-100 dark:bg-red-800 rounded-lg text-red-600 dark:text-red-300"><Target size={20} /></div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Loan Commitments</h3>
                                <p className="text-xs text-slate-500">{formatMoney(metrics.monthlyLoanCommitments)} / Month</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Loan Payoff Progress</span>
                                <span className="font-bold text-slate-900 dark:text-white">{metrics.loanProgress.toFixed(1)}% Paid</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                                <div
                                    className="bg-red-500 h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${metrics.loanProgress}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                                <div className="text-xs text-slate-500 mb-1">Monthly Bill</div>
                                <div className="font-bold text-slate-800 dark:text-white text-sm">{formatMoney(metrics.monthlyLoanCommitments)}</div>
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                                <div className="text-xs text-slate-500 mb-1">Total Remaining</div>
                                <div className="font-bold text-red-600 text-sm">{formatMoney(metrics.totalLoanDebt)}</div>
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                                <div className="text-xs text-slate-500 mb-1">Debt/Income</div>
                                <div className="font-bold text-slate-800 dark:text-white text-sm">{metrics.dtiRatio.toFixed(1)}%</div>
                            </div>
                        </div>
                    </Card>

                    {/* Investments & Projections */}
                    <Card className="bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/20">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-300"><TrendingUp size={20} /></div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Investments</h3>
                                <p className="text-xs text-slate-500">Wealth Growth</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Portfolio</p>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{formatMoney(metrics.totalInvested)}</h3>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">5-Year Est.</p>
                                <h3 className="text-2xl font-bold text-emerald-600">
                                    {formatMoney(metrics.totalInvested * Math.pow(1.06, 5))}
                                </h3>
                                <p className="text-[10px] text-slate-400">Assuming 6% annual return</p>
                            </div>
                        </div>

                        <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-700 dark:text-indigo-200 text-sm italic">
                            "Compound interest is the eighth wonder of the world!" 🚀
                        </div>
                    </Card>
                </div>

                {/* --- 3. Charts Section (Restored & Enhanced) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Income vs Expense Chart */}
                    <Card className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-700 dark:text-white">Income vs Expense</h3>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1 text-xs text-slate-500"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Income</div>
                                <div className="flex items-center gap-1 text-xs text-slate-500"><div className="w-2 h-2 rounded-full bg-rose-500"></div>Expense</div>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.1} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} minTickGap={30} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        formatter={(value) => formatMoney(value)}
                                    />
                                    <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                                    <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Weekday Analysis (New Feature) */}
                    <Card className="lg:col-span-1">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-700 dark:text-white">Spending Peaks</h3>
                            <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded text-xs px-2 text-slate-500">By Day</div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weekdayData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.1} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none' }}
                                        formatter={(value) => formatMoney(value)}
                                    />
                                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* --- 4. Spending By Category (Donut + List) --- */}
                <Card>
                    <h3 className="font-bold text-slate-700 dark:text-white mb-6">Spending Break-down</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        {/* Donut Chart */}
                        <div className="h-[250px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatMoney(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-bold text-slate-800 dark:text-white">{categoryData.length}</span>
                                <span className="text-xs text-slate-500 uppercase tracking-wider">Cats</span>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-4 custom-scrollbar">
                            {categoryData.map((cat, index) => (
                                <div key={cat.name} className="group">
                                    <div className="flex justify-between text-sm mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span className="font-medium text-slate-700 dark:text-slate-300">{cat.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-bold text-slate-800 dark:text-white">{formatMoney(cat.value)}</span>
                                        </div>
                                    </div>

                                    <div className="relative w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
                                            style={{
                                                width: `${cat.percent}%`,
                                                backgroundColor: COLORS[index % COLORS.length]
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        </MainLayout>
    );
};

export default AnalyticsPage;
