import React, { useState } from 'react';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';
import { useTransactions } from '../../hooks/useTransactions';
import { PlusCircle } from 'lucide-react';

const AddTransactionForm = ({ onSuccess }) => {
    const { addTransaction } = useTransactions();
    const [text, setText] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('General');
    const [type, setType] = useState('expense'); // 'income' or 'expense'

    const onSubmit = (e) => {
        e.preventDefault();

        if (!text || !amount) {
            alert("Please fill in all fields");
            return;
        }

        const finalAmount = type === 'expense' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount));

        const newTransaction = {
            id: Math.floor(Math.random() * 100000000),
            text,
            amount: finalAmount,
            category,
            date: new Date().toISOString()
        };

        addTransaction(newTransaction);
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
                <label htmlFor="category" className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-all duration-200"
                >
                    <option value="General">General</option>
                    <option value="Food">Food</option>
                    <option value="Transport">Transport</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Salary">Salary</option>
                    <option value="Health">Health</option>
                    <option value="Shopping">Shopping</option>
                </select>
            </div>
            <Button variant={type === 'expense' ? 'danger' : 'primary'} type="submit" className="mt-2 flex items-center justify-center gap-2 py-2.5">
                <PlusCircle size={18} /> {type === 'expense' ? 'Add Expense' : 'Add Income'}
            </Button>
        </form>
    );
};

export default AddTransactionForm;
