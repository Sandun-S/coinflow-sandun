import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import Card from '../common/Card';
import { useTransactions } from '../../hooks/useTransactions';
import { useAccounts } from '../../context/AccountContext';
import { useBudgets } from '../../context/BudgetContext';
import { useSubscriptions } from '../../context/SubscriptionContext';
import { useCategories } from '../../context/CategoryContext';
import MainLayout from '../layout/MainLayout';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext'; // Import Auth
import { Calendar, TrendingUp, AlertCircle, Target, Award, Wallet, Briefcase, CreditCard, PiggyBank } from 'lucide-react';

// Custom Colors
const COLORS = ['#6366f1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
const PIE_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

const AnalyticsPage = () => {
    const { user, isPro } = useAuth(); // Auth State
    const { transactions } = useTransactions();
    const { accounts } = useAccounts();
    const { budgets } = useBudgets();
    const { subscriptions } = useSubscriptions();
    const { categories } = useCategories();
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

    // --- 2. Core Metrics & Savings Logic (Fixed) ---
    const metrics = useMemo(() => {
        const income = filteredTransactions
            .filter(t => t.amount > 0 && t.category !== 'Transfer' && t.category !== 'Investment Return')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const expense = filteredTransactions
            .filter(t => t.amount < 0 && t.category !== 'Transfer')
            .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

        const savings = income - expense;

        // Fixed: Cap/Handle infinite savings rate logic
        let savingsRate = 0;
        if (income > 0) {
            savingsRate = (savings / income) * 100;
        } else if (income === 0 && expense === 0) {
            savingsRate = 0;
        } else if (income === 0 && expense > 0) {
            savingsRate = -100; // Total loss/spend
        }

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
            projectedExpense = dailyAverage * 30;
        } else {
            const currentMonth = now.getMonth() + 1;
            dailyAverage = expense / (currentMonth || 1);
        }

        // Top Spending Category
        const catMap = {};
        filteredTransactions.filter(t => t.amount < 0).forEach(t => {
            catMap[t.category] = (catMap[t.category] || 0) + Math.abs(t.amount);
        });
        const topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

        // --- NEW: Loan & Investment Metrics ---
        // Loans
        const loans = accounts.filter(a => a.type === 'Loan');
        const totalLoanDebt = loans.reduce((sum, a) => sum + Math.abs(a.balance), 0);
        const totalLoanPrincipal = loans.reduce((sum, a) => sum + (a.loanTotal || 0), 0);
        const totalLoanOrgs = totalLoanPrincipal || totalLoanDebt; // Fallback
        const loanProgress = totalLoanOrgs > 0 ? ((totalLoanOrgs - totalLoanDebt) / totalLoanOrgs) * 100 : 0;
        const monthlyLoanCommitments = loans.reduce((sum, a) => sum + (a.loanPayment || 0), 0);

        // Debt to Income (DTI) - Using current period income as proxy for "Monthly Income"
        // If viewing "This Month", income is accurate. If Year, we avg it.
        let estimatedMonthlyIncome = income;
        if (timeRange === 'year') {
            estimatedMonthlyIncome = income / (new Date().getMonth() + 1);
        }
        const dtiRatio = estimatedMonthlyIncome > 0 ? (monthlyLoanCommitments / estimatedMonthlyIncome) * 100 : 0;

        // Investments
        const investments = accounts.filter(a => a.type === 'Investment');
        const totalInvested = investments.reduce((sum, a) => sum + a.balance, 0);
        const cash = accounts.filter(a => a.type !== 'Loan' && a.type !== 'Investment' && a.type !== 'Credit Card').reduce((sum, a) => sum + a.balance, 0);

        // Credit Card Debt (Limit - Available)
        const creditCards = accounts.filter(a => a.type === 'Credit Card');
        const creditCardDebt = creditCards.reduce((sum, a) => sum + ((a.creditLimit || 0) - a.balance), 0);

        const totalDebtRaw = totalLoanDebt + creditCardDebt;

        return {
            income,
            expense,
            savings,
            savingsRate,
            dailyAverage,
            projectedExpense,
            topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
            // New
            totalLoanDebt,
            creditCardDebt,
            totalDebtRaw,
            monthlyLoanCommitments,
            loanProgress,
            dtiRatio,
            totalInvested,
            cash,
            netWorth: (cash + totalInvested) - totalDebtRaw
        };
    }, [filteredTransactions, timeRange, accounts]);

    // --- 3. Chart Data ---
    const chartData = useMemo(() => {
        const dataMap = {};
        filteredTransactions.forEach(t => {
            if (t.category === 'Transfer') return;
            const date = new Date(t.date);
            const sortKey = timeRange === 'year'
                ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const label = timeRange === 'year'
                ? date.toLocaleString('default', { month: 'short' })
                : date.toLocaleDateString('default', { day: 'numeric', month: 'short' });

            if (!dataMap[sortKey]) {
                dataMap[sortKey] = { sortKey, name: label, income: 0, expense: 0 };
            }
            if (t.amount > 0) dataMap[sortKey].income += parseFloat(t.amount);
            else dataMap[sortKey].expense += Math.abs(parseFloat(t.amount));
        });
        return Object.values(dataMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    }, [filteredTransactions, timeRange]);

    const categoryData = useMemo(() => {
        const expenses = filteredTransactions.filter(t => t.amount < 0);
        const map = {};
        expenses.forEach(t => {
            const cat = t.category || 'Uncategorized';
            map[cat] = (map[cat] || 0) + Math.abs(parseFloat(t.amount));
        });
        return Object.keys(map).map(k => ({ name: k, value: map[k] })).sort((a, b) => b.value - a.value);
    }, [filteredTransactions]);

    // Net Worth Distribution Data
    const netWorthData = [
        { name: 'Cash', value: Math.max(0, metrics.cash) },
        { name: 'Investments', value: metrics.totalInvested },
        { name: 'Debt', value: metrics.totalDebtRaw },
    ].filter(i => i.value > 0);

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="animate-in fade-in slide-in-from-left-4">
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Analytics</h2>
                    <p className="text-slate-500 dark:text-slate-400">Financial insights & health check.</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl animate-in fade-in slide-in-from-right-4">
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

            {/* --- LOCKED OVERLAY FOR FREE USERS --- */}
            {!isPro(user) && (
                <div className="absolute inset-0 z-50 flex items-start justify-center pt-20">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-indigo-500/20 max-w-lg text-center mx-4">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-indigo-400">
                            <TrendingUp size={32} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                            Unlock Financial Clarity 💎
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg">
                            Get full access to Advanced Analytics, Net Worth tracking, Loan Payoff Calculators, and Investment Projections with CoinFlow Pro.
                        </p>

                        <div className="space-y-4">
                            <a
                                href="/profile"
                                className="block w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transform hover:scale-[1.02] transition-all"
                            >
                                Upgrade to Lifetime Access
                            </a>
                            <p className="text-sm text-slate-500">
                                One-time payment. Forever yours.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CONTENT CONTAINER (Blurred if Locked) --- */}
            <div className={`transition-all duration-500 ${!isPro(user) ? 'filter blur-lg opacity-50 pointer-events-none select-none h-[80vh] overflow-hidden' : ''}`}>

                {/* --- Section 1: Overview Cards --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Daily Average */}
                    <Card className="bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800">
                        <div className="flex items-start justify-between mb-2">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-300">
                                <Calendar size={20} />
                            </div>
                            {timeRange === 'thisMonth' && <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">Avg</span>}
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{timeRange === 'year' ? 'Monthly Average' : 'Daily Spending'}</p>
                            <h4 className="text-2xl font-bold text-slate-800 dark:text-white">{formatMoney(metrics.dailyAverage)}</h4>
                        </div>
                    </Card>

                    {/* Savings Rate (Fixed) */}
                    <Card className="bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800">
                        <div className="flex items-start justify-between mb-2">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-300">
                                <PiggyBank size={20} />
                            </div>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Rate</span>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Savings Rate</p>
                            <h4 className={`text-2xl font-bold ${metrics.savingsRate >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {metrics.savingsRate.toFixed(1)}%
                            </h4>
                            <p className="text-xs text-slate-400 mt-1">
                                {metrics.savings >= 0 ? 'Saved ' : 'Deficit '} {formatMoney(Math.abs(metrics.savings))}
                            </p>
                        </div>
                    </Card>

                    {/* Net Worth */}
                    <Card className="bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-800">
                        <div className="flex items-start justify-between mb-2">
                            <div className="p-2 bg-violet-100 dark:bg-violet-800 rounded-lg text-violet-600 dark:text-violet-300">
                                <Wallet size={20} />
                            </div>
                            <span className="text-xs font-bold text-violet-600 bg-violet-100 px-2 py-1 rounded-full">Total</span>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Estimated Net Worth</p>
                            <h4 className="text-2xl font-bold text-slate-800 dark:text-white">{formatMoney(metrics.netWorth)}</h4>
                            <p className="text-xs text-slate-400 mt-1">Cash + Invest - Debt</p>
                        </div>
                    </Card>

                    {/* Monthly Obligations */}
                    <Card className="bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800">
                        <div className="flex items-start justify-between mb-2">
                            <div className="p-2 bg-red-100 dark:bg-red-800 rounded-lg text-red-600 dark:text-red-300">
                                <CreditCard size={20} />
                            </div>
                            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full">Bills</span>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Loan Commitments</p>
                            <h4 className="text-2xl font-bold text-slate-800 dark:text-white">{formatMoney(metrics.monthlyLoanCommitments)}</h4>
                            <p className="text-xs text-slate-400 mt-1">/ Month</p>
                        </div>
                    </Card>
                </div>

                {/* --- Section 2: Loan & Investment Deep Dive --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 items-start">

                    {/* Loan Breakdown (Per Loan) */}
                    {metrics.totalLoanDebt > 0 && (
                        <Card className="lg:col-span-2 flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Target className="text-indigo-500" size={20} /> Loan Payoff Progress
                                </h3>
                                <span className="text-sm font-semibold text-slate-500">
                                    {metrics.loanProgress.toFixed(1)}% Total Paid
                                </span>
                            </div>

                            {accounts.filter(a => a.type === 'Loan').map(loan => {
                                const total = loan.loanTotal || 0;
                                const paid = total - Math.abs(loan.balance); // Approximate if balance is negative debt
                                const progress = total > 0 ? (paid / total) * 100 : 0;
                                // Estimate Asset Value: Down Payment + Loan Principal (Account for interest if possible, but Total is usually Full Debt)
                                const assetValue = (loan.downPayment || 0) + total;

                                return (
                                    <div key={loan.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-slate-700 dark:text-slate-200">{loan.name}</h4>
                                            <span className="text-xs font-bold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                                                {progress.toFixed(1)}%
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative mb-3">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                                                style={{ width: `${Math.max(5, progress)}%` }}
                                            />
                                        </div>

                                        {/* Loan Details Grid */}
                                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                            <div>
                                                <p className="text-slate-500">Remaining</p>
                                                <p className="font-bold text-red-500">{formatMoney(Math.abs(loan.balance))}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">Monthly</p>
                                                <p className="font-bold text-slate-700 dark:text-slate-300">{formatMoney(loan.loanPayment || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500">Total Value</p>
                                                <p className="font-bold text-slate-700 dark:text-slate-300">{formatMoney(assetValue)}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="grid grid-cols-3 gap-4 text-center divide-x divide-slate-100 dark:divide-slate-700 mt-2">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Total Debt</p>
                                    <p className="font-bold text-red-600 text-lg mt-1">{formatMoney(metrics.totalLoanDebt)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Monthly Bill</p>
                                    <p className="font-bold text-slate-700 dark:text-slate-200 text-lg mt-1">{formatMoney(metrics.monthlyLoanCommitments)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Debt/Income</p>
                                    <p className={`font-bold text-lg mt-1 ${metrics.dtiRatio > 35 ? 'text-red-500' : 'text-green-500'}`}>
                                        {metrics.dtiRatio.toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Investment Summary & Projection */}
                    <div className={`flex flex-col gap-6 ${metrics.totalLoanDebt === 0 ? 'lg:col-span-3' : ''}`}>
                        <Card className="relative overflow-hidden flex-1">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Briefcase size={100} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <Briefcase className="text-emerald-500" size={20} /> Investments
                            </h3>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <p className="text-sm text-slate-500">Total Portfolio Value</p>
                                    <h4 className="text-3xl font-bold text-emerald-600">{formatMoney(metrics.totalInvested)}</h4>
                                </div>

                                {/* Smart Projection */}
                                {metrics.totalInvested >= 0 && (() => {
                                    // 1. Calculate Monthly Contribution from Budget & Subscriptions
                                    // Get valid investment categories
                                    const invCategory = categories.find(c => c.name === 'Investment');
                                    const invSubCats = invCategory ? invCategory.subcategories : []; // ['Stocks', 'Savings', ...]
                                    const invKeywords = ['Investment', ...invSubCats];

                                    // Filter Budgets
                                    const invBudgetTotal = budgets
                                        .filter(b => invKeywords.includes(b.category))
                                        .reduce((sum, b) => sum + b.limit, 0);

                                    // Filter Subscriptions
                                    const invSubsTotal = subscriptions
                                        .filter(s => {
                                            // Case 1: Exact match on Category (e.g. "Investment", "Savings")
                                            if (invKeywords.includes(s.category)) return true;
                                            // Case 2: Compound strings like "Investment > Savings" (common in some UI inputs)
                                            if (s.category && typeof s.category === 'string') {
                                                const parts = s.category.split('>');
                                                const mainCat = parts[0].trim();
                                                if (invKeywords.includes(mainCat)) return true;
                                            }
                                            return false;
                                        })
                                        .reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);

                                    // Use the greater of the two
                                    const monthlyContribution = Math.max(invBudgetTotal, invSubsTotal);

                                    // 2. Calculate Weighted Average Interest Rate
                                    const investments = accounts.filter(a => a.type === 'Investment');
                                    let avgRate = 6.0; // Default 6%

                                    if (investments.length > 0 && metrics.totalInvested > 0) {
                                        const weightedSum = investments.reduce((sum, inv) => {
                                            const rate = parseFloat(inv.interestRate) || 6.0;
                                            return sum + (inv.balance * rate);
                                        }, 0);
                                        avgRate = weightedSum / metrics.totalInvested;
                                    }

                                    // 3. Compound Interest Formula with Monthly Contributions
                                    // FV = P * (1 + r/n)^(nt) + PMT * [ ((1 + r/n)^(nt) - 1) / (r/n) ]
                                    const r = avgRate / 100;
                                    const n = 12; // Monthly
                                    const t = 5;  // Years
                                    const nt = n * t;
                                    const ratePerPeriod = r / n;

                                    const fvPrincipal = metrics.totalInvested * Math.pow(1 + ratePerPeriod, nt);
                                    const fvContributions = monthlyContribution * ((Math.pow(1 + ratePerPeriod, nt) - 1) / ratePerPeriod);

                                    const projection = fvPrincipal + fvContributions;
                                    const totalContributed = monthlyContribution * nt;
                                    const interestEarned = projection - (metrics.totalInvested + totalContributed);

                                    return (
                                        <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 space-y-4">

                                            <div className="flex justify-between items-center pb-3 border-b border-emerald-100 dark:border-emerald-800/50">
                                                <div>
                                                    <h5 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                                                        <TrendingUp size={16} /> 5-Year Projection
                                                    </h5>
                                                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400 mt-1">
                                                        Assuming {avgRate.toFixed(1)}% annual return
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                                        {formatMoney(projection)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase font-semibold">Monthly Investment</p>
                                                    {monthlyContribution > 0 ? (
                                                        <p className="font-bold text-slate-700 dark:text-slate-200">{formatMoney(monthlyContribution)}</p>
                                                    ) : (
                                                        <p className="text-xs text-amber-500 mt-1">No monthly plan found</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase font-semibold">Interest Earned</p>
                                                    <p className="font-bold text-emerald-600">+{formatMoney(interestEarned)}</p>
                                                </div>
                                            </div>

                                            {monthlyContribution > 0 && (
                                                <div className="text-xs bg-white/50 dark:bg-black/20 p-2 rounded text-center text-emerald-700 dark:text-emerald-400 font-medium">
                                                    "Compound interest is the eighth wonder of the world!" 🚀
                                                </div>
                                            )}

                                            <div className="text-[10px] text-emerald-600/40 text-center">
                                                *Based on your 'Investment' budget & subscriptions + account rates.
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs text-slate-500">
                                    💡 Tip: Set an "Investment" budget or subscription to see your wealth grow!
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* --- Section 3: Detailed Charts --- */}
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

                    {/* Category Breakdown (Enhanced) */}
                    <Card className="h-96 flex flex-col">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Spending by Category</h3>
                        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            {/* Chart Side */}
                            <div className="h-full w-full min-h-[200px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            innerRadius="60%"
                                            outerRadius="80%"
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => formatMoney(value)}
                                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Total */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-sm text-slate-400">Total</span>
                                    <span className="text-xl font-bold text-slate-800 dark:text-white">{formatMoney(metrics.expense)}</span>
                                </div>
                            </div>

                            {/* List Side */}
                            <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                                {categoryData.length > 0 ? (
                                    <div className="space-y-4">
                                        {categoryData.map((cat, index) => (
                                            <div key={cat.name} className="group">
                                                <div className="flex justify-between items-center mb-1 text-sm">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                                        {cat.name}
                                                    </span>
                                                    <span className="text-slate-500 font-bold">{((cat.value / metrics.expense) * 100).toFixed(1)}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500 relative"
                                                        style={{ width: `${(cat.value / metrics.expense) * 100}%`, backgroundColor: COLORS[index % COLORS.length] }}
                                                    ></div>
                                                </div>
                                                <div className="text-xs text-slate-400 text-right mt-1">
                                                    {formatMoney(cat.value)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-2">
                                        <AlertCircle size={32} opacity={0.5} />
                                        <span>No spending data</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

        </MainLayout>
    );
};

export default AnalyticsPage;
