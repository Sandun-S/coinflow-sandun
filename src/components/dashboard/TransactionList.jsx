
import React from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import Card from '../common/Card';
import Button from '../common/Button';
import { useCurrencyFormatter } from '../../utils';
import { Trash2 } from 'lucide-react';

const TransactionList = () => {
    const { transactions, deleteTransaction } = useTransactions();
    const formatMoney = useCurrencyFormatter();

    return (
        <Card className="h-96 overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Recent Transactions</h3>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {transactions.length === 0 ? (
                    <p className="text-slate-400 text-center mt-10">No transactions recorded.</p>
                ) : (
                    <ul className="space-y-3">
                        {transactions.map((transaction) => (
                            <li
                                key={transaction.id}
                                className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium text-slate-800 dark:text-white">{transaction.text}</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(transaction.date).toLocaleDateString()} • {transaction.category}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span
                                        className={`font-bold ${parseFloat(transaction.amount) < 0 ? 'text-red-500' : 'text-green-500'}`}
                                    >
                                        {parseFloat(transaction.amount) < 0 ? '-' : '+'}{formatMoney(Math.abs(transaction.amount))}
                                    </span>
                                    <button
                                        onClick={() => deleteTransaction(transaction.id)}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </Card>
    );
};

export default TransactionList;
