import React, { useState, useMemo } from 'react';
import MainLayout from '../layout/MainLayout';
import Card from '../common/Card';
import Input from '../common/Input';
import Modal from '../common/Modal'; // Import Modal
import AddTransactionForm from '../dashboard/AddTransactionForm'; // Import Form
import { useTransactions } from '../../context/TransactionContext';
import { useSettings } from '../../context/SettingsContext';
import { Search, Filter, Calendar, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Pencil, Trash2 } from 'lucide-react'; // Added Icons

const TransactionsPage = () => {
    const { transactions, deleteTransaction } = useTransactions(); // Get deleteTransaction
    const { currency } = useSettings();

    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all'); // all, income, expense
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState('all'); // all, 0-11

    // State for Editing
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    // Handlers
    const handleEdit = (transaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
            await deleteTransaction(id);
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingTransaction(null);
    };

    // Generate Year Options (from transaction data + current year)
    const yearOptions = useMemo(() => {
        const years = new Set([new Date().getFullYear()]);
        transactions.forEach(t => {
            if (t.date) years.add(new Date(t.date).getFullYear());
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [transactions]);

    // Month Names
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Filter Logic
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const date = new Date(t.date);

            // Search Text
            const matchesSearch = t.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.category.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            // Type
            if (selectedType !== 'all') {
                const isExpense = t.amount < 0;
                if (selectedType === 'income' && isExpense) return false;
                if (selectedType === 'expense' && !isExpense) return false;
            }

            // Year
            if (selectedYear !== 'all' && date.getFullYear().toString() !== selectedYear) return false;

            // Month
            if (selectedMonth !== 'all' && date.getMonth().toString() !== selectedMonth) return false;

            return true;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions, searchTerm, selectedType, selectedYear, selectedMonth]);

    // Grouping by Month (for display)
    const groupedTransactions = useMemo(() => {
        const groups = {};
        filteredTransactions.forEach(t => {
            const date = new Date(t.date);
            const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });
        return groups;
    }, [filteredTransactions]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: currency
        }).format(Math.abs(value));
    };

    const getTotal = (type) => {
        return filteredTransactions.reduce((acc, t) => {
            if (type === 'income' && t.amount > 0) return acc + t.amount;
            if (type === 'expense' && t.amount < 0) return acc + Math.abs(t.amount);
            return acc;
        }, 0);
    };

    return (
        <MainLayout>
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Transaction History</h2>
                    <p className="text-slate-500 dark:text-slate-400">View and filter your complete financial history.</p>
                </div>

                {/* Filters & Search */}
                <Card>
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>

                        {/* Filters Group */}
                        <div className="flex flex-wrap gap-2">
                            {/* Type Filter */}
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="all">All Types</option>
                                <option value="income">Income Only</option>
                                <option value="expense">Expense Only</option>
                            </select>

                            {/* Year Filter */}
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="all">All Years</option>
                                {yearOptions.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>

                            {/* Month Filter */}
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="all">All Months</option>
                                {monthNames.map((m, i) => (
                                    <option key={i} value={i}>{m}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </Card>

                {/* Summary Stats for Period */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-400">
                                <ArrowDownLeft size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Total Income</p>
                                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">+{formatCurrency(getTotal('income'))}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-800 rounded-lg text-red-600 dark:text-red-400">
                                <ArrowUpRight size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Total Expenses</p>
                                <p className="text-2xl font-bold text-red-700 dark:text-red-300">-{formatCurrency(getTotal('expense'))}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Transaction List Grouped */}
                <div className="space-y-6">
                    {Object.keys(groupedTransactions).length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <Filter className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-500 font-medium">No transactions found matching your filters.</p>
                        </div>
                    ) : (
                        Object.keys(groupedTransactions).map(groupKey => (
                            <div key={groupKey}>
                                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 ml-1">{groupKey}</h3>
                                <Card className="p-0 overflow-hidden">
                                    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {groupedTransactions[groupKey].map(t => (
                                            <div key={t.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.amount < 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                                        {t.amount < 0 ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 dark:text-white">{t.text}</h4>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">{t.category} • {new Date(t.date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className={`font-bold ${t.amount < 0 ? 'text-slate-800 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                        {t.amount < 0 ? '-' : '+'}{formatCurrency(t.amount)}
                                                    </span>

                                                    {/* Edit/Delete Actions */}
                                                    <div className="flex opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEdit(t)}
                                                            className="text-slate-300 hover:text-indigo-500 transition-colors p-1"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(t.id)}
                                                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        ))
                    )}
                </div>

                {/* Edit Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={handleClose}
                    title="Edit Transaction"
                >
                    <AddTransactionForm onSuccess={handleClose} initialData={editingTransaction} />
                </Modal>
            </div>
        </MainLayout>
    );
};

export default TransactionsPage;
