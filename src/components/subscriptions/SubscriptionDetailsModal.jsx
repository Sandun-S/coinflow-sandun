import React, { useMemo } from 'react';
import Modal from '../common/Modal';
import { useTransactions } from '../../context/TransactionContext';
import { useSettings } from '../../context/SettingsContext';
import { Calendar, CreditCard, TrendingUp, Clock, CheckCircle } from 'lucide-react';

const SubscriptionDetailsModal = ({ isOpen, onClose, subscription }) => {
    const { transactions } = useTransactions();
    const { currency } = useSettings();

    const formatCurrency = (val) => new Intl.NumberFormat('en-LK', { style: 'currency', currency }).format(val);

    // Filter relevant transactions
    const history = useMemo(() => {
        if (!subscription) return [];
        return transactions.filter(t =>
            // Match specifically by ID if available (new logic)
            t.subscriptionId === subscription.id ||
            // Fallback match by exact text name (legacy logic)
            t.text === subscription.name ||
            t.text === `Auto-Pay: ${subscription.name}`
        ).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions, subscription]);

    const stats = useMemo(() => {
        if (!history.length) return { total: 0, yearTotal: 0, avg: 0, count: 0 };

        const total = history.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const currentYear = new Date().getFullYear();
        const yearTotal = history
            .filter(t => new Date(t.date).getFullYear() === currentYear)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        return {
            total,
            yearTotal,
            avg: total / history.length,
            count: history.length
        };
    }, [history]);

    if (!subscription) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Subscription Details">
            <div className="space-y-6">

                {/* Header Info */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <Calendar size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{subscription.name}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-2">
                                {subscription.billingCycle} • Next bill: {new Date(subscription.nextBillingDate).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                        <p className="text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400 mb-1">Total Paid (Lifetime)</p>
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(stats.total)}</p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                        <p className="text-xs font-semibold uppercase text-blue-600 dark:text-blue-400 mb-1">Total Paid ({new Date().getFullYear()})</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(stats.yearTotal)}</p>
                    </div>
                </div>

                {/* Timeline */}
                <div>
                    <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Clock size={16} /> Payment History
                    </h4>

                    {history.length > 0 ? (
                        <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 space-y-6">
                            {history.map((t, i) => (
                                <div key={t.id} className="relative">
                                    <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-800"></div>
                                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">{new Date(t.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                            <p className="text-xs text-slate-400">Paid from Wallet</p>
                                        </div>
                                        <div className="font-bold text-slate-700 dark:text-slate-200">
                                            {formatCurrency(Math.abs(t.amount))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-400 text-sm italic">
                            No payment history found yet.
                        </div>
                    )}
                </div>

            </div>
        </Modal>
    );
};

export default SubscriptionDetailsModal;
