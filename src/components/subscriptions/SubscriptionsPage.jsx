import React, { useState } from 'react';
import MainLayout from '../layout/MainLayout';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import { useSubscriptions } from '../../context/SubscriptionContext';
import { useSettings } from '../../context/SettingsContext';
import { useTransactions } from '../../context/TransactionContext';
import { Plus, Trash2, Calendar, RefreshCw, Check, Pencil } from 'lucide-react'; // Added Pencil

const SubscriptionsPage = () => {
    const { subscriptions, addSubscription, deleteSubscription, updateSubscription, loading } = useSubscriptions();
    const { currency } = useSettings();
    const { addTransaction } = useTransactions();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [billingCycle, setBillingCycle] = useState('Monthly');
    const [nextBillingDate, setNextBillingDate] = useState('');
    const [editingId, setEditingId] = useState(null); // ID of sub being edited

    const handleSubmit = async (e) => {
        e.preventDefault();
        const subData = {
            name,
            amount: parseFloat(amount),
            billingCycle,
            nextBillingDate: new Date(nextBillingDate).toISOString()
        };

        if (editingId) {
            await updateSubscription(editingId, subData);
        } else {
            await addSubscription(subData);
        }

        handleClose();
    };

    const handleEdit = (sub) => {
        setName(sub.name);
        setAmount(sub.amount.toString());
        setBillingCycle(sub.billingCycle);
        // Format date for input field (YYYY-MM-DD)
        const date = new Date(sub.nextBillingDate);
        setNextBillingDate(date.toISOString().split('T')[0]);
        setEditingId(sub.id);
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setName('');
        setAmount('');
        setBillingCycle('Monthly');
        setNextBillingDate('');
        setEditingId(null);
    };

    const handlePayment = async (sub) => {
        if (!window.confirm(`Mark ${sub.name} as paid? This will add a transaction and update the due date.`)) return;

        // 1. Add Transaction
        const transactionResult = await addTransaction({
            type: 'expense',
            amount: parseFloat(sub.amount),
            category: 'Bills & Utilities',
            description: `Subscription: ${sub.name}`,
            date: new Date().toISOString()
        });

        if (transactionResult.success) {
            // 2. Calculate New Next Date
            const currentNextDate = new Date(sub.nextBillingDate);
            let newNextDate = new Date(currentNextDate);

            if (sub.billingCycle === 'Monthly') {
                newNextDate.setMonth(newNextDate.getMonth() + 1);
            } else {
                newNextDate.setFullYear(newNextDate.getFullYear() + 1);
            }

            // 3. Update Subscription
            await updateSubscription(sub.id, {
                nextBillingDate: newNextDate.toISOString()
            });
            // Optional: Toast or simple alert
            console.log("Payment recorded successfully");
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: currency
        }).format(value);
    };

    // Calculate Total Monthly Cost
    const totalMonthlyCost = subscriptions.reduce((total, sub) => {
        if (sub.billingCycle === 'Monthly') {
            return total + sub.amount;
        } else {
            return total + (sub.amount / 12); // Amortize yearly
        }
    }, 0);

    const getDaysUntilDue = (dateString) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today
        const due = new Date(dateString);
        due.setHours(0, 0, 0, 0); // Normalize due date

        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <MainLayout>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Subscriptions</h2>
                    <p className="text-slate-500 dark:text-slate-400">Track recurring bills and fixed costs.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
                    <Plus size={20} /> Add Subscription
                </Button>
            </div>

            {/* Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none">
                    <h3 className="text-indigo-100 font-medium mb-1">Total Monthly Fixed Cost</h3>
                    <p className="text-4xl font-bold">{formatCurrency(totalMonthlyCost)}</p>
                    <p className="text-sm text-indigo-200 mt-2">Includes amortized yearly subs</p>
                </Card>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscriptions.map(sub => {
                    const daysLeft = getDaysUntilDue(sub.nextBillingDate);
                    const isDueSoon = daysLeft >= 0 && daysLeft <= 3;

                    return (
                        <Card key={sub.id} className={`relative ${isDueSoon ? 'border-orange-300 dark:border-orange-500/50' : ''}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                        <RefreshCw size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">{sub.name}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{sub.billingCycle}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {daysLeft > 20 ? (
                                        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold uppercase tracking-wider">
                                            <Check size={14} /> Paid
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handlePayment(sub)}
                                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                                            title="Mark as Paid (Creates Transaction)"
                                        >
                                            <Check size={18} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleEdit(sub)}
                                        className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                        title="Edit Subscription"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => deleteSubscription(sub.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                        title="Delete Subscription"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Amount</p>
                                    <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{formatCurrency(sub.amount)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Next Bill</p>
                                    <p className={`font-medium ${isDueSoon ? 'text-orange-600 dark:text-orange-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {new Date(sub.nextBillingDate).toLocaleDateString()}
                                    </p>
                                    {isDueSoon && (
                                        <span className="text-xs font-bold text-orange-500">
                                            {daysLeft === 0 ? "Due Today!" : `Due in ${daysLeft} days!`}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {subscriptions.length === 0 && !loading && (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <RefreshCw className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500 font-medium">No subscriptions yet.</p>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={handleClose} title={editingId ? "Edit Subscription" : "Add Subscription"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Netflix, Rent, etc."
                        required
                    />
                    <Input
                        label="Amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        required
                    />
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Billing Cycle</label>
                        <select
                            value={billingCycle}
                            onChange={(e) => setBillingCycle(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="Monthly">Monthly</option>
                            <option value="Yearly">Yearly</option>
                        </select>
                    </div>
                    <Input
                        label="Next Billing Date"
                        type="date"
                        value={nextBillingDate}
                        onChange={(e) => setNextBillingDate(e.target.value)}
                        required
                    />
                    <Button type="submit" variant="primary" className="w-full">
                        {editingId ? "Update Subscription" : "Add Subscription"}
                    </Button>
                </form>
            </Modal>
        </MainLayout>
    );
};

export default SubscriptionsPage;
