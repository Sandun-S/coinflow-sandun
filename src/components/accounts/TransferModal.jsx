import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import AccountPicker from './AccountPicker';
import Modal from '../common/Modal';
import { useAccounts } from '../../context/AccountContext';
import { useTransactions } from '../../hooks/useTransactions';
import { ArrowRight, X } from 'lucide-react';

const TransferModal = ({ isOpen, onClose }) => {
    const { accounts } = useAccounts();
    const { addTransaction } = useTransactions();
    const formatMoney = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'LKR' }).format(val);

    const [fromAccount, setFromAccount] = useState('');
    const [toAccount, setToAccount] = useState('');
    const [amount, setAmount] = useState('');
    const [serviceCharge, setServiceCharge] = useState('');
    const [description, setDescription] = useState('Transfer');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        const chargeAmount = parseFloat(serviceCharge) || 0;
        const totalDeduction = transferAmount + chargeAmount;

        if (!fromAccount || !toAccount || !transferAmount) {
            alert('Please fill in all fields');
            return;
        }

        if (fromAccount === toAccount) {
            alert('Source and Destination accounts must be different');
            return;
        }

        // VALIDATION 1: Insufficient Funds (Source)
        if (sourceAcc && sourceAcc.type !== 'Credit Card') {
            if (sourceAcc.balance < totalDeduction) {
                alert(`Insufficient funds in ${sourceAcc.name}. Needed: ${formatMoney(totalDeduction)} (Transfer + Fee). Available: ${formatMoney(sourceAcc.balance)}`);
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

        setIsSubmitting(true);
        try {
            // Determine Categories
            let sourceCategory = 'Transfer';
            let destCategory = 'Transfer';

            // Special Case: Investment -> Bank/Cash (Count as Income/Realized Gain)
            if (sourceAcc.type === 'Investment' && (destAcc.type === 'Bank' || destAcc.type === 'Cash')) {
                destCategory = 'Investment Return';
            }

            // ISO Date Helper
            const getIsoDate = () => {
                const selected = new Date(date);
                const now = new Date();
                if (selected.toDateString() === now.toDateString()) {
                    return now.toISOString();
                }
                return selected.toISOString();
            };

            // 1. Record Transaction (Source Expense)
            await addTransaction({
                text: `${description} (to ${destAcc?.name || 'Destination'})`,
                amount: -transferAmount,
                category: sourceCategory,
                type: 'expense',
                accountId: fromAccount,
                date: getIsoDate()
            });

            // 2. Record Service Charge (If Applicable)
            if (chargeAmount > 0) {
                await addTransaction({
                    text: `Service Charge (Transfer to ${destAcc?.name})`,
                    amount: -chargeAmount,
                    category: 'Fees & Charges',
                    type: 'expense',
                    accountId: fromAccount,
                    date: getIsoDate() // Same time as transfer
                });
            }

            // 3. Record Transaction (Dest Income)
            await addTransaction({
                text: `${description} (from ${sourceAcc?.name || 'Source'})`,
                amount: transferAmount,
                category: destCategory,
                type: 'income',
                accountId: toAccount,
                date: getIsoDate()
            });

            onClose();
            resetForm();
        } catch (error) {
            console.error("Transfer failed", error);
            alert("Transfer failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFromAccount('');
        setToAccount('');
        setAmount('');
        setServiceCharge('');
        setDescription('Transfer');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Transfer Funds"
        >
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
                    label="Service Charge (Optional)"
                    type="number"
                    placeholder="0.00"
                    value={serviceCharge}
                    onChange={(e) => setServiceCharge(e.target.value)}
                    min="0"
                    step="0.01"
                    helperText="Fee deducted from Source account (e.g. ATM fee)"
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

                <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : 'Confirm Transfer'}
                </Button>
            </form>
        </Modal>
    );
};

export default TransferModal;
