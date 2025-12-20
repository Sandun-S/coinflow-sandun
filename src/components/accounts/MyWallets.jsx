import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import { useAccounts } from '../../context/AccountContext';
import { useCurrencyFormatter } from '../../utils';
import { Wallet, Banknote, CreditCard, Plus, Trash2, Edit2, X, ArrowRightLeft } from 'lucide-react';
import TransferModal from './TransferModal';

const MyWallets = () => {
    const { accounts, addAccount, updateAccount, deleteAccount, updateBalance } = useAccounts();
    const formatMoney = useCurrencyFormatter();
    const [isAdding, setIsAdding] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [type, setType] = useState('Bank');
    const [balance, setBalance] = useState('');
    const [creditLimit, setCreditLimit] = useState(''); // Only for Credit Card

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) return;

        const initialBalance = parseFloat(balance) || 0;
        const limit = parseFloat(creditLimit) || 0;

        const accountData = {
            name,
            type,
            balance: initialBalance,
            color: type === 'Cash' ? 'bg-green-100 text-green-600' :
                type === 'Bank' ? 'bg-blue-100 text-blue-600' :
                    type === 'Credit Card' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'
        };

        if (type === 'Credit Card') {
            accountData.creditLimit = limit;
            if (!balance && limit) {
                accountData.balance = limit;
            }
        }

        await addAccount(accountData);
        setIsAdding(false);
        resetForm();
    };

    const resetForm = () => {
        setName('');
        setType('Bank');
        setBalance('');
        setCreditLimit('');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this wallet? Transactions related to it will lose their link.')) {
            await deleteAccount(id);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'Cash': return <Banknote size={24} />;
            case 'Credit Card': return <CreditCard size={24} />;
            default: return <Wallet size={24} />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Wallets</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your accounts and balances.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setIsTransferring(true)} variant="secondary" className="flex items-center gap-2">
                        <ArrowRightLeft size={20} /> Transfer
                    </Button>
                    <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
                        <Plus size={20} /> Add Wallet
                    </Button>
                </div>
            </div>

            {/* Wallets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map(acc => (
                    <Card key={acc.id} className="relative overflow-hidden group">
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
                            <button
                                onClick={() => handleDelete(acc.id)}
                                className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="mt-2">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Available Balance</span>
                            <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                                {formatMoney(acc.balance)}
                            </div>
                            {acc.type === 'Credit Card' && acc.creditLimit && (
                                <div className="mt-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-purple-500 h-full rounded-full"
                                        style={{ width: `${(acc.balance / acc.creditLimit) * 100}%` }}
                                    />
                                </div>
                            )}
                            {acc.type === 'Credit Card' && acc.creditLimit && (
                                <p className="text-xs text-slate-400 mt-1 text-right">
                                    Limit: {formatMoney(acc.creditLimit)}
                                </p>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Transfer Modal */}
            <TransferModal
                isOpen={isTransferring}
                onClose={() => setIsTransferring(false)}
            />

            {/* Add Wallet Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <Card className="w-full max-w-md animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Add New Wallet</h3>
                            <button onClick={() => setIsAdding(false)}><X size={20} className="text-slate-400" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Cash', 'Bank', 'Credit Card'].map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setType(t)}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${type === t ? 'bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Input
                                label="Account Name"
                                placeholder="e.g. Seylan Bank, My Wallet"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />

                            <div className="grid grid-cols-1 gap-4">
                                {type === 'Credit Card' && (
                                    <Input
                                        label="Credit Limit"
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
                                />
                            </div>

                            <Button type="submit" className="w-full mt-2">
                                Create Wallet
                            </Button>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default MyWallets;
