import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import { useAccounts } from '../../context/AccountContext';
import { useTour } from '../../context/TourContext';
import { useTransactions } from '../../hooks/useTransactions'; // Import transactions
import { useSubscriptions } from '../../context/SubscriptionContext';
import { useCategories } from '../../context/CategoryContext';
import { useCurrencyFormatter } from '../../utils';
import { Wallet, Banknote, CreditCard, Plus, Trash2, Edit2, X, ArrowRightLeft, TrendingUp, RefreshCw } from 'lucide-react';
import TransferModal from './TransferModal';
import MainLayout from '../layout/MainLayout';

const MyWallets = () => {
    const { accounts, addAccount, updateAccount, deleteAccount, updateBalance } = useAccounts();
    const { addTransaction } = useTransactions();
    const { addSubscription } = useSubscriptions();
    const { categories } = useCategories();
    const { nextStep } = useTour();
    const formatMoney = useCurrencyFormatter();

    // Modal States
    const [isAdding, setIsAdding] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [adjustingAccount, setAdjustingAccount] = useState(null); // For Balance Adjustment
    const [isFabOpen, setIsFabOpen] = useState(false);

    // Form State (Add/Edit)
    const [name, setName] = useState('');
    const [type, setType] = useState('Bank');
    const [balance, setBalance] = useState('');
    const [creditLimit, setCreditLimit] = useState('');
    const [interestRate, setInterestRate] = useState(''); // New for Investment

    // Loan Specific State
    const [calculateMode, setCalculateMode] = useState(false); // Toggle
    const [loanTotal, setLoanTotal] = useState('');
    const [monthsPaid, setMonthsPaid] = useState('');
    const [loanPayment, setLoanPayment] = useState('');
    const [loanTerm, setLoanTerm] = useState(''); // Total months
    const [downPayment, setDownPayment] = useState('');
    const [loanDueDate, setLoanDueDate] = useState(''); // Full Date string
    const [loanCategory, setLoanCategory] = useState('');

    // Adjustment State
    const [newBalance, setNewBalance] = useState('');
    const [recordAdjustment, setRecordAdjustment] = useState(true);

    // Separation
    const creditCards = accounts.filter(a => a.type === 'Credit Card');
    const investments = accounts.filter(a => a.type === 'Investment');
    const loans = accounts.filter(a => a.type === 'Loan');
    const cashAndBank = accounts.filter(a => a.type !== 'Credit Card' && a.type !== 'Investment' && a.type !== 'Loan');

    // Totals
    const totalCash = cashAndBank.reduce((sum, a) => sum + a.balance, 0);
    const totalInvestments = investments.reduce((sum, a) => sum + a.balance, 0);
    const totalDebt = creditCards.reduce((sum, a) => sum + (a.creditLimit - a.balance), 0);
    const totalLoanDebt = loans.reduce((sum, a) => sum + Math.abs(a.balance), 0);
    const netWorth = totalCash + totalInvestments - totalDebt - totalLoanDebt;

    // Filter Categories
    const loanCategories = categories.find(c => c.name === 'Loans')?.subcategories || [];

    // --- Add/Edit Logic ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) return;

        let initialBalance = parseFloat(balance) || 0;
        const limit = parseFloat(creditLimit) || 0;
        const rate = parseFloat(interestRate) || 0;

        let finalLoanTotal = parseFloat(loanTotal) || 0;

        // Loan Calculation
        if (type === 'Loan') {
            const monthly = parseFloat(loanPayment) || 0;
            const paidMonths = parseFloat(monthsPaid) || 0;

            if (calculateMode) {
                const term = parseFloat(loanTerm) || 0;
                finalLoanTotal = term * monthly;

                // Current Debt = (Term - PaidMonths) * Monthly
                const remainingMonths = Math.max(0, term - paidMonths);
                const currentDebt = remainingMonths * monthly;
                initialBalance = -currentDebt;
            } else {
                // Manual Mode: Current = Total - Paid
                const alreadyPaid = paidMonths * monthly;
                const currentDebt = finalLoanTotal - alreadyPaid;
                initialBalance = -currentDebt;
            }
        }

        let color = 'bg-slate-100 text-slate-600';
        if (type === 'Cash') color = 'bg-green-100 text-green-600';
        else if (type === 'Bank') color = 'bg-blue-100 text-blue-600';
        else if (type === 'Credit Card') color = 'bg-purple-100 text-purple-600';
        else if (type === 'Investment') color = 'bg-amber-100 text-amber-600';
        else if (type === 'Loan') color = 'bg-red-100 text-red-600';

        const accountData = {
            name,
            type,
            balance: initialBalance,
            color
        };

        if (type === 'Credit Card') accountData.creditLimit = limit;
        if (type === 'Investment') accountData.interestRate = rate;
        if (type === 'Loan') {
            accountData.loanTotal = finalLoanTotal;
            accountData.loanPayment = parseFloat(loanPayment) || 0;
            accountData.loanDueDate = loanDueDate;
            accountData.downPayment = parseFloat(downPayment) || 0;
            accountData.loanTerm = parseFloat(loanTerm) || 0;
        }

        if (editingId) {
            await updateAccount(editingId, accountData);
        } else {
            const result = await addAccount(accountData);

            // Auto-Create Subscription for Loans
            if (result.success && type === 'Loan') {
                await addSubscription({
                    name: `${name} Repayment`,
                    amount: parseFloat(loanPayment) || 0,
                    billingCycle: 'Monthly',
                    nextBillingDate: loanDueDate || new Date().toISOString(),
                    category: loanCategory || 'Loans',
                    walletId: result.id,
                    reminderEnabled: true
                });
            }
        }

        closeForm();
        nextStep(); // Advance tour on successful submit
    };

    const handleEdit = (acc) => {
        setEditingId(acc.id);
        setName(acc.name);
        setType(acc.type);
        setBalance(acc.balance);
        if (acc.type === 'Credit Card') setCreditLimit(acc.creditLimit);
        if (acc.type === 'Investment') setInterestRate(acc.interestRate || '');
        // Note: Full edit loading for loans (term, etc) omitted for brevity as typical usecase is creation
        setIsAdding(true);
    };

    const closeForm = () => {
        setIsAdding(false);
        resetForm();
    };

    const resetForm = () => {
        setName('');
        setType('Bank');
        setBalance('');
        setCreditLimit('');
        setInterestRate('');

        // Reset Loan
        setLoanTotal('');
        setMonthsPaid('');
        setLoanPayment('');
        setLoanDueDate('');
        setCalculateMode(false);
        setLoanTerm('');
        setDownPayment('');
        setLoanCategory('');

        setEditingId(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this wallet?')) {
            await deleteAccount(id);
        }
    };

    // --- Adjustment Logic ---
    const openAdjustment = (acc) => {
        setAdjustingAccount(acc);
        setNewBalance(acc.balance);
        setRecordAdjustment(true);
    };

    const handleAdjustmentSubmit = async (e) => {
        e.preventDefault();
        if (!adjustingAccount) return;

        const currentBal = parseFloat(adjustingAccount.balance) || 0;
        const targetBal = parseFloat(newBalance) || 0;
        const diff = targetBal - currentBal;

        // 1. Update Balance
        await updateAccount(adjustingAccount.id, { balance: targetBal });

        // 2. Record Transaction (if enabled and diff exists)
        if (recordAdjustment && Math.abs(diff) > 0.01) {
            const isIncome = diff > 0;
            await addTransaction({
                text: isIncome ? 'Interest / Gain' : 'Value Drop / Fee',
                amount: diff, // addTransaction handles signage usually, or we pass absolute and type?
                // Checking AddTransactionForm: it sends NEGATIVE for expense.
                // So if Income: +diff. If Expense: -diff (which `diff` is already negative if target < current).
                // Wait, if diff is -500. `amount` should be -500?
                // Let's assume standard behavior: type='expense' => visually red, logic handles keys.
                // Usually we store signed amount or unsigned + type.
                // Looking at AnalyticsPage: `t.amount < 0` checks expense. So we need to store SIGNED amount.
                // `diff` is signed.
                type: isIncome ? 'income' : 'expense',
                category: isIncome ? 'Interest Income' : 'Adjustment',
                date: new Date().toISOString(),
                accountId: adjustingAccount.id
            });
        }

        setAdjustingAccount(null);
        setNewBalance('');
    };


    const getIcon = (type) => {
        switch (type) {
            case 'Cash': return <Banknote size={24} />;
            case 'Credit Card': return <CreditCard size={24} />;
            case 'Investment': return <TrendingUp size={24} />;
            default: return <Wallet size={24} />;
        }
    };

    const AccountCard = ({ acc }) => (
        <Card key={acc.id} className="relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${acc.color || 'bg-slate-100 text-slate-600'}`}>
                        {getIcon(acc.type)}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">{acc.name}</h3>
                        <span className="text-sm text-slate-500 dark:text-slate-400">{acc.type}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => handleEdit(acc)}
                        className="text-slate-300 hover:text-indigo-500 transition-colors p-1"
                        title="Edit Wallet"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => handleDelete(acc.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        title="Delete Wallet"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className="mt-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                    {acc.type === 'Credit Card' ? 'Available Credit' : 'Current Balance'}
                </span>
                <div className="text-lg md:text-2xl font-bold text-slate-800 dark:text-white mt-1 break-words">
                    {formatMoney(acc.balance)}
                </div>

                {acc.type === 'Credit Card' && acc.creditLimit && (
                    <>
                        <div className="mt-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-purple-500 h-full rounded-full"
                                style={{ width: `${(acc.balance / acc.creditLimit) * 100}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-slate-400">
                            <span>Used: {formatMoney(acc.creditLimit - acc.balance)}</span>
                            <span>Limit: {formatMoney(acc.creditLimit)}</span>
                        </div>
                    </>
                )}

                {acc.type === 'Investment' && (
                    <div className="mt-3 flex items-center justify-between">
                        {acc.interestRate ? (
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                {acc.interestRate}% Return
                            </span>
                        ) : <span></span>}

                        <button
                            onClick={() => openAdjustment(acc)}
                            className="text-xs flex items-center gap-1 text-indigo-500 hover:underline font-medium"
                        >
                            <RefreshCw size={12} /> Update Balance
                        </button>
                    </div>
                )}
            </div>
        </Card>
    );

    return (
        <MainLayout>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Wallets</h1>
                        <p className="text-slate-500 dark:text-slate-400">Manage your accounts and investments.</p>
                    </div>
                    <div className="flex gap-2 hidden md:flex">
                        <Button onClick={() => setIsTransferring(true)} variant="secondary" className="flex items-center gap-2">
                            <ArrowRightLeft size={20} /> Transfer
                        </Button>
                        <Button onClick={() => { setIsAdding(true); nextStep(); }} className="flex items-center gap-2" data-tour="add-wallet-btn">
                            <Plus size={20} /> Add Wallet
                        </Button>
                    </div>
                </div>

                {/* Net Worth Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-slate-900 text-white border-none col-span-2 md:col-span-1">
                        <div className="text-slate-400 text-sm mb-1">Total Net Worth</div>
                        <div className="text-xl md:text-2xl font-bold">{formatMoney(netWorth)}</div>
                    </Card>
                    <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800">
                        <div className="text-amber-600 dark:text-amber-400 text-sm mb-1">Investments</div>
                        <div className="text-xl md:text-2xl font-bold text-amber-700 dark:text-amber-300">{formatMoney(totalInvestments)}</div>
                    </Card>
                    <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800">
                        <div className="text-emerald-600 dark:text-emerald-400 text-sm mb-1">Cash & Bank</div>
                        <div className="text-xl md:text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatMoney(totalCash)}</div>
                    </Card>
                    <Card className="bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800">
                        <div className="text-red-600 dark:text-red-400 text-sm mb-1">Debt</div>
                        <div className="text-xl md:text-2xl font-bold text-red-700 dark:text-red-300">{formatMoney(totalDebt)}</div>
                    </Card>
                </div>

                {/* Loans Section */}
                {loans.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <TrendingUp size={20} className="text-red-500 rotate-180" /> Loans
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loans.map(acc => <AccountCard key={acc.id} acc={acc} />)}
                        </div>
                    </div>
                )}

                {/* Investments Section */}
                {investments.length > 0 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <TrendingUp size={20} className="text-amber-500" /> Investments / FD
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {investments.map(acc => <AccountCard key={acc.id} acc={acc} />)}
                        </div>
                    </div>
                )}

                {/* Accounts Section */}
                <div data-tour="wallets-list">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Banknote size={20} className="text-emerald-500" /> Cash & Bank
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cashAndBank.map(acc => <AccountCard key={acc.id} acc={acc} />)}
                        {cashAndBank.length === 0 && (
                            <div className="col-span-full py-8 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 rounded-xl border-dashed border">
                                No cash or bank accounts found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Credit Cards Section */}
                {creditCards.length > 0 && (
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <CreditCard size={20} className="text-purple-500" /> Credit Cards
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {creditCards.map(acc => <AccountCard key={acc.id} acc={acc} />)}
                        </div>
                    </div>
                )}


                {/* Transfer Modal */}
                <TransferModal
                    isOpen={isTransferring}
                    onClose={() => setIsTransferring(false)}
                />

                {/* Add/Edit Wallet Modal */}
                {isAdding && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <Card className="w-full max-w-md animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingId ? 'Edit Wallet' : 'Add New Wallet'}</h3>
                                <button onClick={closeForm}><X size={20} className="text-slate-400" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Type</label>
                                    <div className="grid grid-cols-5 gap-2" data-tour="wallet-type-selector">
                                        {['Cash', 'Bank', 'Credit Card', 'Investment', 'Loan'].map(t => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => { setType(t); nextStep(); }}
                                                className={`py-2 px-1 rounded-lg text-[10px] md:text-xs font-bold transition-colors border ${type === t ? 'bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Input
                                    label="Account Name"
                                    placeholder={type === 'Investment' ? "e.g. CAL Equity Fund" : (type === 'Loan' ? "e.g. Vehicle Loan" : "e.g. Seylan Bank")}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    data-tour="wallet-name-input"
                                />

                                {type === 'Loan' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">

                                        {/* Toggle Between Calculator and Manual */}
                                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => setCalculateMode(false)}
                                                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${!calculateMode ? 'bg-white text-indigo-600 shadow-sm dark:bg-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                            >
                                                Manual Entry
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCalculateMode(true)}
                                                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${calculateMode ? 'bg-white text-indigo-600 shadow-sm dark:bg-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                                            >
                                                Loan Calculator
                                            </button>
                                        </div>

                                        {!calculateMode ? (
                                            /* Manual Mode */
                                            <Input
                                                label="Total Loan Amount (Full Debt)"
                                                type="number"
                                                placeholder="500000"
                                                value={loanTotal}
                                                onChange={(e) => setLoanTotal(e.target.value)}
                                            />
                                        ) : (
                                            /* Calculator Mode */
                                            <Input
                                                label="Loan Term (Months)"
                                                type="number"
                                                placeholder="24"
                                                value={loanTerm}
                                                onChange={(e) => setLoanTerm(e.target.value)}
                                            />
                                        )}

                                        <Input
                                            label="Down Payment (Optional)"
                                            type="number"
                                            placeholder="100000"
                                            value={downPayment}
                                            onChange={(e) => setDownPayment(e.target.value)}
                                        />

                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="Monthly Payment"
                                                type="number"
                                                placeholder="25000"
                                                value={loanPayment}
                                                onChange={(e) => setLoanPayment(e.target.value)}
                                            />
                                            <Input
                                                label="Months Already Paid"
                                                type="number"
                                                placeholder="9"
                                                value={monthsPaid}
                                                onChange={(e) => setMonthsPaid(e.target.value)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Next Due Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                                                    value={loanDueDate}
                                                    onChange={(e) => setLoanDueDate(e.target.value)}
                                                    required={type === 'Loan'}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                                <select
                                                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                                                    value={loanCategory}
                                                    onChange={(e) => setLoanCategory(e.target.value)}
                                                >
                                                    <option value="">Select Category</option>
                                                    {loanCategories.length > 0 ? (
                                                        loanCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)
                                                    ) : (
                                                        <>
                                                            <option value="Personal Loan">Personal Loan</option>
                                                            <option value="Vehicle Loan">Vehicle Loan</option>
                                                            <option value="Housing Loan">Housing Loan</option>
                                                            <option value="Gold Loan">Gold Loan</option>
                                                            <option value="Finance">Finance</option>
                                                            <option value="General Loan">General Loan</option>
                                                        </>
                                                    )}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex justify-between items-center">
                                            <span>Outstanding Debt:</span>
                                            <span className="font-bold">
                                                {(() => {
                                                    const monthly = parseFloat(loanPayment) || 0;
                                                    const paid = parseFloat(monthsPaid) || 0;

                                                    if (calculateMode) {
                                                        const term = parseFloat(loanTerm) || 0;
                                                        const remaining = Math.max(0, term - paid);
                                                        return formatMoney(remaining * monthly);
                                                    } else {
                                                        const total = parseFloat(loanTotal) || 0;
                                                        return formatMoney(total - (paid * monthly));
                                                    }
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {type === 'Investment' && (
                                    <Input
                                        label="Annual Interest Rate (%) (Optional)"
                                        type="number"
                                        placeholder="e.g. 12"
                                        value={interestRate}
                                        onChange={(e) => setInterestRate(e.target.value)}
                                    />
                                )}

                                {type !== 'Loan' && (
                                    <div className="grid grid-cols-1 gap-4">
                                        {type === 'Credit Card' && (
                                            <Input
                                                label="Total Credit Limit"
                                                type="number"
                                                placeholder="0.00"
                                                value={creditLimit}
                                                onChange={(e) => setCreditLimit(e.target.value)}
                                            />
                                        )}
                                        <Input
                                            label={type === 'Credit Card' ? "Current Available Balance" : "Current Balance"}
                                            type="number"
                                            placeholder="0.00"
                                            value={balance}
                                            onChange={(e) => setBalance(e.target.value)}
                                            data-tour="wallet-balance-input"
                                        />
                                    </div>
                                )}

                                <Button type="submit" className="w-full mt-2" data-tour="wallet-submit-btn">
                                    {editingId ? 'Save Changes' : 'Create Wallet'}
                                </Button>
                            </form>
                        </Card>
                    </div>
                )}

                {/* Adjust Balance Modal */}
                {adjustingAccount && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <Card className="w-full max-w-md animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Update Balance</h3>
                                    <p className="text-sm text-slate-500">{adjustingAccount.name}</p>
                                </div>
                                <button onClick={() => setAdjustingAccount(null)}><X size={20} className="text-slate-400" /></button>
                            </div>

                            <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
                                <Input
                                    label="New Total Balance"
                                    type="number"
                                    value={newBalance}
                                    onChange={(e) => setNewBalance(e.target.value)}
                                    placeholder="0.00"
                                    autoFocus
                                />

                                {(() => {
                                    const diff = (parseFloat(newBalance) || 0) - adjustingAccount.balance;
                                    const isProfit = diff > 0;
                                    return (
                                        <div className={`p-4 rounded-lg flex items-center justify-between border ${diff === 0 ? 'bg-slate-50 border-slate-200' : isProfit ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                            <span className="text-sm font-medium">Difference:</span>
                                            <span className="font-bold text-lg">{diff > 0 ? '+' : ''}{formatMoney(diff)}</span>
                                        </div>
                                    );
                                })()}

                                <div className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="recordTx"
                                        checked={recordAdjustment}
                                        onChange={(e) => setRecordAdjustment(e.target.checked)}
                                        className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                    />
                                    <label htmlFor="recordTx" className="text-sm text-slate-600 dark:text-slate-300">
                                        Record this difference as a transaction?
                                        <p className="text-xs text-slate-400 mt-0.5">Useful for tracking Interest Income or Fees automatically.</p>
                                    </label>
                                </div>

                                <Button type="submit" className="w-full">
                                    Confirm Update
                                </Button>
                            </form>
                        </Card>
                    </div>
                )}
                {/* Mobile Floating Action Button - Transfer */}
                {/* Mobile Speed Dial FAB */}
                <div className="fixed bottom-24 right-6 z-40 md:hidden flex flex-col items-end gap-3">
                    {/* Menu Items */}
                    {isFabOpen && (
                        <>
                            <div className="flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-200">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                                    Add Wallet
                                </span>
                                <button
                                    onClick={() => { setIsAdding(true); setIsFabOpen(false); }}
                                    className="p-3 bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-600 transition-all"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                                    Transfer
                                </span>
                                <button
                                    onClick={() => { setIsTransferring(true); setIsFabOpen(false); }}
                                    className="p-3 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-all"
                                >
                                    <ArrowRightLeft size={20} />
                                </button>
                            </div>
                        </>
                    )}

                    {/* Main Toggle Button */}
                    <button
                        onClick={() => setIsFabOpen(!isFabOpen)}
                        className={`p-4 rounded-full shadow-lg shadow-indigo-500/40 text-white transition-all duration-300 ${isFabOpen ? 'bg-slate-800 rotate-45' : 'bg-indigo-600 hover:scale-105 active:scale-95'}`}
                        aria-label="Actions"
                    >
                        <Plus size={24} />
                    </button>
                </div>
            </div>
        </MainLayout>
    );
};

export default MyWallets;
