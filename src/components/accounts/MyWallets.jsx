import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import { useAccounts } from '../../context/AccountContext';
import { useCurrencyFormatter } from '../../utils';
import { Wallet, Banknote, CreditCard, Plus, Trash2, Edit2, X, ArrowRightLeft } from 'lucide-react';
import TransferModal from './TransferModal';
import MainLayout from '../layout/MainLayout';

const MyWallets = () => {
    const { accounts, addAccount, updateAccount, deleteAccount, updateBalance } = useAccounts();
    const formatMoney = useCurrencyFormatter();
    const [isAdding, setIsAdding] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);

    const [editingId, setEditingId] = useState(null);

    // Form State
    const [name, setName] = useState('');
    const [type, setType] = useState('Bank');
    const [balance, setBalance] = useState('');
    const [creditLimit, setCreditLimit] = useState(''); // Only for Credit Card

    // Separation
    const creditCards = accounts.filter(a => a.type === 'Credit Card');
    const cashAndBank = accounts.filter(a => a.type !== 'Credit Card');

    // Totals
    const totalCash = cashAndBank.reduce((sum, a) => sum + a.balance, 0);
    const totalDebt = creditCards.reduce((sum, a) => sum + (a.creditLimit - a.balance), 0);
    const netWorth = totalCash - totalDebt;

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
            // For updates, we blindly accept the new balance if provided.
        }

        if (editingId) {
            await updateAccount(editingId, accountData);
        } else {
            await addAccount(accountData);
        }

        setIsAdding(false);
        resetForm();
    };

    const resetForm = () => {
        setName('');
        setType('Bank');
        setBalance('');
        setCreditLimit('');
        setEditingId(null);
    };

    const handleEdit = (acc) => {
        setEditingId(acc.id);
        setName(acc.name);
        setType(acc.type);
        setBalance(acc.balance);
        if (acc.type === 'Credit Card') {
            setCreditLimit(acc.creditLimit);
        }
        setIsAdding(true);
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

    const AccountCard = ({ acc }) => (
        <Card key={acc.id} className="relative overflow-hidden group hover:shadow-md transition-shadow">
            {/* ... card content ... */}
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
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    {acc.type === 'Credit Card' ? 'Available Credit' : 'Balance'}
                </span>
                <div className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
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
            </div>
        </Card>
    );

    return (
        <MainLayout>
            <div className="space-y-8">
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

                {/* Net Worth Summary */}
                <div className="grid grid-cols-3 gap-4">
                    <Card className="bg-slate-900 text-white border-none">
                        <div className="text-slate-400 text-sm mb-1">Total Net Worth</div>
                        <div className="text-2xl font-bold">{formatMoney(netWorth)}</div>
                    </Card>
                    <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800">
                        <div className="text-emerald-600 dark:text-emerald-400 text-sm mb-1">Total Assets</div>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatMoney(totalCash)}</div>
                    </Card>
                    <Card className="bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800">
                        <div className="text-red-600 dark:text-red-400 text-sm mb-1">Total Debt (Used Credit)</div>
                        <div className="text-2xl font-bold text-red-700 dark:text-red-300">{formatMoney(totalDebt)}</div>
                    </Card>
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

                {/* Accounts Section */}
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Banknote size={20} className="text-emerald-500" /> Appeals & Cash
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
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingId ? 'Edit Wallet' : 'Add New Wallet'}</h3>
                                <button onClick={() => { setIsAdding(false); resetForm(); }}><X size={20} className="text-slate-400" /></button>
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
                                            label="Total Credit Limit"
                                            type="number"
                                            placeholder="0.00"
                                            value={creditLimit}
                                            onChange={(e) => setCreditLimit(e.target.value)}
                                        />
                                    )}
                                    <Input
                                        label={type === 'Credit Card' ? "Current Available Balance (Remaining)" : "Current Balance"}
                                        type="number"
                                        placeholder="0.00"
                                        value={balance}
                                        onChange={(e) => setBalance(e.target.value)}
                                        helperText={type === 'Credit Card' ? "How much you can currently spend." : ""}
                                    />
                                </div>

                                <Button type="submit" className="w-full mt-2">
                                    {editingId ? 'Save Changes' : 'Create Wallet'}
                                </Button>
                            </form>
                        </Card>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default MyWallets;
