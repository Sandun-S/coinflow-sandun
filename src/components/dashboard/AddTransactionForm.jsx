import React, { useState } from 'react';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';
import { useTransactions } from '../../hooks/useTransactions';
import CategoryPicker from '../categories/CategoryPicker';
import { PlusCircle } from 'lucide-react';

const AddTransactionForm = ({ onSuccess, initialData = null }) => {
    const { addTransaction, updateTransaction } = useTransactions();
    const [text, setText] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('General');
    const [type, setType] = useState('expense'); // 'income' or 'expense'

    // Load initial data if editing
    React.useEffect(() => {
        if (initialData) {
            setText(initialData.text);
            setAmount(Math.abs(initialData.amount).toString());
            setCategory(initialData.category);
            setType(initialData.amount < 0 ? 'expense' : 'income');
        } else {
            setText('');
            setAmount('');
            setCategory('General');
            setType('expense');
        }
    }, [initialData]);

    const onSubmit = (e) => {
        e.preventDefault();

        if (!text || !amount) {
            alert("Please fill in all fields");
            return;
        }

        const finalAmount = type === 'expense' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount));

        const transactionData = {
            text,
            amount: finalAmount,
            category,
            date: initialData ? initialData.date : new Date().toISOString() // Keep original date if editing
        };

        if (initialData) {
            updateTransaction(initialData.id, transactionData);
        } else {
            addTransaction(transactionData);
        }

        setText('');
        setAmount('');
        setCategory('General');

        if (onSuccess) {
            onSuccess();
        }
    };

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
            {/* Type Toggle */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
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

            <Input
                label="Title"
                id="text"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. Grocery, Salary"
            />
            <Input
                label="Amount"
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
            />
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                <CategoryPicker
                    selectedCategory={category}
                    onSelect={setCategory}
                    type={type}
                />
            </div>
            <Button variant={type === 'expense' ? 'danger' : 'primary'} type="submit" className="mt-2 flex items-center justify-center gap-2 py-2.5">
                <PlusCircle size={18} /> {initialData ? 'Update Transaction' : (type === 'expense' ? 'Add Expense' : 'Add Income')}
            </Button>
        </form>
    );
};

export default AddTransactionForm;
