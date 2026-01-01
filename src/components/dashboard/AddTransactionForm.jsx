import React, { useState } from 'react';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';
import { useTransactions } from '../../hooks/useTransactions';
import { useAccounts } from '../../context/AccountContext'; // Import useAccounts
import { useTour } from '../../context/TourContext';
import CategoryPicker from '../categories/CategoryPicker';
import AccountPicker from '../accounts/AccountPicker'; // Import AccountPicker
import { PlusCircle, Split, Trash2, Plus } from 'lucide-react'; // Added icons

const AddTransactionForm = ({ onSuccess, initialData = null }) => {
    const { addTransaction, updateTransaction } = useTransactions();
    const { accounts } = useAccounts();
    const { nextStep } = useTour();
    const [text, setText] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [accountId, setAccountId] = useState('');
    const [type, setType] = useState('expense');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Split Mode State
    const [isSplit, setIsSplit] = useState(false);
    const [splits, setSplits] = useState([{ category: '', amount: '' }, { category: '', amount: '' }]);

    // Load initial data
    React.useEffect(() => {
        if (initialData) {
            setText(initialData.text);
            setAmount(Math.abs(initialData.amount).toString());
            setCategory(initialData.category);
            setType(initialData.amount < 0 ? 'expense' : 'income');
            setAccountId(initialData.accountId || '');
            setIsSplit(false); // Edit mode doesn't support converting back to split easily yet
        } else {
            setText('');
            setAmount('');
            setCategory('');
            setType('expense');
            setIsSplit(false);
            setSplits([{ category: '', amount: '' }, { category: '', amount: '' }]);
            if (accounts && accounts.length > 0 && !accountId) {
                setAccountId(accounts[0].id);
            }
        }
    }, [initialData, accounts]);

    const handleAddSplit = () => {
        setSplits([...splits, { category: '', amount: '' }]);
    };

    const handleRemoveSplit = (index) => {
        if (splits.length > 1) {
            setSplits(splits.filter((_, i) => i !== index));
        }
    };

    const handleSplitChange = (index, field, value) => {
        const newSplits = [...splits];
        newSplits[index][field] = value;
        setSplits(newSplits);
    };

    // Auto-calculate total amount from splits if in split mode
    const totalSplitAmount = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);

    const onSubmit = async (e) => {
        e.preventDefault();

        if (!accountId) {
            alert("Please select a Wallet");
            return;
        }

        setIsSubmitting(true);
        try {
            if (isSplit) {
                // Validate Splits
                if (splits.some(s => !s.category || !s.amount)) {
                    alert("Please fill in all split categories and amounts.");
                    setIsSubmitting(false); // Early return needs manual reset
                    return;
                }
                if (text === '') {
                    alert("Please enter a main title for these transactions.");
                    setIsSubmitting(false);
                    return;
                }

                // Create Multiple Transactions
                for (const split of splits) {
                    const splitAmount = parseFloat(split.amount);
                    const finalAmount = type === 'expense' ? -Math.abs(splitAmount) : Math.abs(splitAmount); // Fixed: Removed redeclaration const finalAmount

                    const transactionData = {
                        text: `${text} (${split.category})`,
                        amount: finalAmount,
                        category: split.category,
                        accountId,
                        date: new Date().toISOString()
                    };

                    await addTransaction(transactionData);
                }
            } else {
                // Standard Single Transaction
                if (!text || !amount || !category) {
                    alert("Please fill in all fields");
                    setIsSubmitting(false);
                    return;
                }

                const finalAmount = type === 'expense' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount));

                const transactionData = {
                    text,
                    amount: finalAmount,
                    category,
                    accountId,
                    date: initialData ? initialData.date : new Date().toISOString()
                };

                if (initialData) {
                    updateTransaction(initialData.id, transactionData);
                } else {
                    await addTransaction(transactionData);
                }
            }

            // Reset Form
            setText('');
            setAmount('');
            setCategory('');
            setIsSplit(false);
            setSplits([{ category: '', amount: '' }, { category: '', amount: '' }]);

            if (onSuccess) {
                onSuccess();
            }
            nextStep();
        } catch (error) {
            console.error("Transaction Error:", error);
            alert("Failed to save transaction.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
            {/* Type Toggle */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-xl" data-tour="tx-type-toggle">
                <button
                    type="button"
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${type === 'expense' ? 'bg-white dark:bg-slate-600 text-red-500 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    onClick={() => setType('expense')}
                >
                    Expense
                </button>
                <button
                    type="button"
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${type === 'income' ? 'bg-white dark:bg-slate-600 text-green-500 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    onClick={() => setType('income')}
                >
                    Income
                </button>
            </div>

            <div className="flex flex-col gap-1.5" data-tour="tx-wallet-picker">
                <AccountPicker
                    selectedAccountId={accountId}
                    onSelect={setAccountId}
                    label="Wallet / Account"
                />
            </div>

            <Input
                label="Title (Description)"
                id="text"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. Grocery Trip"
                data-tour="tx-text-input"
            />

            {!isSplit ? (
                <>
                    <Input
                        label="Amount"
                        id="amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        data-tour="tx-amount-input"
                    />
                    <div className="flex flex-col gap-1.5" data-tour="category-picker">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                            <button
                                type="button"
                                onClick={() => setIsSplit(true)}
                                className="text-xs flex items-center gap-1 text-indigo-500 hover:text-indigo-600"
                            >
                                <Split size={12} /> Split Category
                            </button>
                        </div>
                        <CategoryPicker
                            selectedCategory={category}
                            onSelect={setCategory}
                            type={type}
                        />
                    </div>
                </>
            ) : (
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Split size={14} className="text-indigo-500" /> Split Transaction
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsSplit(false)}
                            className="text-xs text-slate-500 hover:text-slate-700 underline"
                        >
                            Switch to Single
                        </button>
                    </div>

                    {splits.map((split, index) => (
                        <div key={index} className="flex gap-2 items-start">
                            <div className="flex-1 min-w-0">
                                <CategoryPicker
                                    selectedCategory={split.category}
                                    onSelect={(cat) => handleSplitChange(index, 'category', cat)}
                                    type={type}
                                />
                            </div>
                            <div className="w-24">
                                <input
                                    type="number"
                                    value={split.amount}
                                    onChange={(e) => handleSplitChange(index, 'amount', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveSplit(index)}
                                className="p-2 text-slate-400 hover:text-red-500"
                                disabled={splits.length <= 1}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={handleAddSplit}
                        className="text-sm text-indigo-500 hover:text-indigo-600 flex items-center gap-1 font-medium mt-2"
                    >
                        <Plus size={14} /> Add another split
                    </button>

                    <div className="text-right text-sm font-bold text-slate-700 dark:text-white mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        Total: {totalSplitAmount.toFixed(2)}
                    </div>
                </div>
            )}

            <Button variant={type === 'expense' ? 'danger' : 'primary'} type="submit" className="mt-2 flex items-center justify-center gap-2 py-2.5" disabled={isSubmitting} data-tour="tx-submit-btn">
                {isSubmitting ? 'Saving...' : (initialData ? 'Update Transaction' : (type === 'expense' || isSplit ? 'Add Transaction(s)' : 'Add Income'))}
            </Button>
        </form>
    );
};

export default AddTransactionForm;
