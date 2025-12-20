import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import AccountPicker from './AccountPicker';
import { useAccounts } from '../../context/AccountContext';
import { useTransactions } from '../../hooks/useTransactions';
import { ArrowRight, X } from 'lucide-react';

const TransferModal = ({ isOpen, onClose }) => {
    const { updateBalance } = useAccounts();
    const { addTransaction } = useTransactions();

    const [fromAccount, setFromAccount] = useState('');
    const [toAccount, setToAccount] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('Transfer');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const transferAmount = parseFloat(amount);

        if (!fromAccount || !toAccount || !transferAmount) {
            alert('Please fill in all fields');
            return;
        }

        if (fromAccount === toAccount) {
            alert('Source and Destination accounts must be different');
            return;
        }

        try {
            // 1. Deduct from Source
            await updateBalance(fromAccount, -transferAmount);

            // 2. Add to Destination
            await updateBalance(toAccount, transferAmount);

            // 3. Record Transactions (Optional: One 'Transfer' record or two?)
            // For simplicity and history tracking, let's record one 'Transfer' transaction 
            // but usually transfers shouldn't affect "Income/Expense" totals if it's internal.
            // However, currently our Transaction model is simple. 
            // We'll mark it as a type 'transfer' if possible, or just 'expense' for now but category 'Transfer'.
            // Better strategy: Create a record so user sees it in history.

            await addTransaction({
                text: `${description} (to Destination)`,
                amount: -transferAmount, // Shows as outflow
                category: 'Transfer',
                type: 'expense', // Or 'transfer' if supported
                accountId: fromAccount,
                date: new Date(date).toISOString()
            });

            await addTransaction({
                text: `${description} (from Source)`,
                amount: transferAmount, // Shows as inflow
                category: 'Transfer',
                type: 'income',
                accountId: toAccount,
                date: new Date(date).toISOString()
            });

            onClose();
            resetForm();
        } catch (error) {
            console.error("Transfer failed", error);
            alert("Transfer failed");
        }
    };

    const resetForm = () => {
        setFromAccount('');
        setToAccount('');
        setAmount('');
        setDescription('Transfer');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Transfer Funds</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <AccountPicker
                                label="From"
                                selectedAccountId={fromAccount}
                                onSelect={setFromAccount}
                            />
                        </div>
                        <div className="pt-6 text-slate-400">
                            <ArrowRight size={20} />
                        </div>
                        <div className="flex-1">
                            <AccountPicker
                                label="To"
                                selectedAccountId={toAccount}
                                onSelect={setToAccount}
                            />
                        </div>
                    </div>

                    <Input
                        label="Amount"
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0"
                        step="0.01"
                    />

                    <Input
                        label="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Credit Card Payment"
                    />

                    <Input
                        label="Date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />

                    <Button type="submit" className="w-full mt-2">
                        Confirm Transfer
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default TransferModal;
