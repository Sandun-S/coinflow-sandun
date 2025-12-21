import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import AccountPicker from './AccountPicker';
import { useAccounts } from '../../context/AccountContext';
import { useTransactions } from '../../hooks/useTransactions';
import { ArrowRight, X } from 'lucide-react';

const TransferModal = ({ isOpen, onClose }) => {
    const { updateBalance, accounts } = useAccounts();
    const { addTransaction } = useTransactions();
    const formatMoney = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'LKR' }).format(val);

    const [fromAccount, setFromAccount] = useState('');
    const [toAccount, setToAccount] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('Transfer');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Helper to get account objects
    const sourceAcc = accounts.find(a => a.id === fromAccount);
    const destAcc = accounts.find(a => a.id === toAccount);

    // Auto-fill Logic for Credit Cards
    React.useEffect(() => {
        if (destAcc && destAcc.type === 'Credit Card') {
            const debt = destAcc.creditLimit - destAcc.balance;
            // Only auto-fill if debt > 0
            if (debt > 0) {
                setAmount(debt.toString());
                setDescription(`Payment for ${destAcc.name}`);
            }
        }
    }, [toAccount, destAcc]); // Depend on Selected ID changes

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

        // VALIDATION 1: Insufficient Funds (Source)
        if (sourceAcc && sourceAcc.type !== 'Credit Card') { // Credit cards can go negative technically, but usually source is Bank/Cash
            if (sourceAcc.balance < transferAmount) {
                alert(`Insufficient funds in ${sourceAcc.name}. Available: ${formatMoney(sourceAcc.balance)}`);
                return;
            }
        }

        // VALIDATION 2: Overpaying Credit Card (Destination)
        if (destAcc && destAcc.type === 'Credit Card') {
            const currentDebt = destAcc.creditLimit - destAcc.balance;
            if (transferAmount > currentDebt) {
                alert(`You are trying to pay ${formatMoney(transferAmount)} but the used amount is only ${formatMoney(currentDebt)}. You cannot overpay.`);
                return;
            }
        }
        // VALIDATION 3: Restrict Credit Card Usage (Can't transfer FROM Credit Card to others)
        if (sourceAcc && sourceAcc.type === 'Credit Card' && destAcc.type !== 'Credit Card') {
            alert("Transfers from Credit Cards to Bank/Cash/Investment are not allowed.");
            return;
        }

        try {
            // Determine Categories
            let sourceCategory = 'Transfer';
            let destCategory = 'Transfer';

            // Special Case: Investment -> Bank/Cash (Count as Income/Realized Gain)
            if (sourceAcc.type === 'Investment' && (destAcc.type === 'Bank' || destAcc.type === 'Cash')) {
                destCategory = 'Investment Return';
            }

            // 1. Deduct from Source
            await updateBalance(fromAccount, -transferAmount);

            // 2. Add to Destination
            await updateBalance(toAccount, transferAmount);

            // 3. Record Transactions
            await addTransaction({
                text: `${description} (to ${destAcc?.name || 'Destination'})`,
                amount: -transferAmount,
                category: sourceCategory,
                type: 'expense',
                accountId: fromAccount,
                date: new Date(date).toISOString()
            });

            await addTransaction({
                text: `${description} (from ${sourceAcc?.name || 'Source'})`,
                amount: transferAmount,
                category: destCategory,
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
                            {sourceAcc && (
                                <div className="text-xs text-slate-400 mt-1">
                                    Bal: {formatMoney(sourceAcc.balance)}
                                </div>
                            )}
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
                            {destAcc && destAcc.type === 'Credit Card' && (
                                <div className="text-xs text-red-400 mt-1">
                                    Due: {formatMoney(destAcc.creditLimit - destAcc.balance)}
                                </div>
                            )}
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
                        helperText={destAcc?.type === 'Credit Card' ? "Auto-filled with total due amount" : ""}
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
