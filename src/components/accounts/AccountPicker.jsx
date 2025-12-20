import React, { useState } from 'react';
import { useAccounts } from '../../context/AccountContext';
import { ChevronDown, Check, X, Wallet, Banknote, CreditCard, Plus } from 'lucide-react';

const AccountPicker = ({ selectedAccountId, onSelect, label = "Wallet / Account" }) => {
    const { accounts } = useAccounts();
    const [isOpen, setIsOpen] = useState(false);

    const selectedAccount = accounts.find(a => a.id === selectedAccountId);

    const getIcon = (type) => {
        switch (type) {
            case 'Cash': return <Banknote size={20} />;
            case 'Bank': return <Wallet size={20} />;
            case 'Mobile Wallet': return <CreditCard size={20} />; // Placeholder
            default: return <Wallet size={20} />;
        }
    };

    const handleSelect = (accountId) => {
        onSelect(accountId);
        setIsOpen(false);
    };

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            >
                {selectedAccount ? (
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${selectedAccount.color || 'bg-slate-100 dark:bg-slate-600'}`}>
                            {getIcon(selectedAccount.type)}
                        </div>
                        <span className="font-medium">{selectedAccount.name}</span>
                    </div>
                ) : (
                    <span className="text-slate-400">Select Account</span>
                )}
                <ChevronDown size={16} className="text-slate-400" />
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm max-h-[70vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Select Wallet</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {accounts.map(acc => (
                                <button
                                    key={acc.id}
                                    type="button"
                                    onClick={() => handleSelect(acc.id)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${selectedAccountId === acc.id ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-200 dark:ring-indigo-800' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-slate-100 dark:border-slate-700'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${acc.color || 'bg-slate-100 text-slate-600'}`}>
                                            {getIcon(acc.type)}
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium text-slate-800 dark:text-white">{acc.name}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{acc.type}</span>
                                        </div>
                                    </div>
                                    {selectedAccountId === acc.id && <Check size={18} className="text-indigo-500" />}
                                </button>
                            ))}
                            {accounts.length === 0 && (
                                <p className="text-center py-4 text-slate-400">No accounts found.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountPicker;
