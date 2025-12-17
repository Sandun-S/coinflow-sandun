import React, { useState } from 'react';
import MainLayout from '../layout/MainLayout';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import { useSubscriptions } from '../../context/SubscriptionContext';
import { useSettings } from '../../context/SettingsContext';
import { Plus, Trash2, Calendar, RefreshCw } from 'lucide-react';

const SubscriptionsPage = () => {
    const { subscriptions, addSubscription, deleteSubscription, loading } = useSubscriptions();
    const { currency } = useSettings();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [billingCycle, setBillingCycle] = useState('Monthly');
    const [nextBillingDate, setNextBillingDate] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        await addSubscription({
            name,
            amount: parseFloat(amount),
            billingCycle,
            nextBillingDate: new Date(nextBillingDate).toISOString()
        });
        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setName('');
        setAmount('');
        setBillingCycle('Monthly');
        setNextBillingDate('');
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
        const due = new Date(dateString);
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
                                <button
                                    onClick={() => deleteSubscription(sub.id)}
                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
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
                                    {isDueSoon && <span className="text-xs font-bold text-orange-500">Due in {daysLeft} days!</span>}
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

            {/* Add Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Subscription">
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
                        Add Subscription
                    </Button>
                </form>
            </Modal>
        </MainLayout>
    );
};

export default SubscriptionsPage;
