import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../../hooks/useTransactions';
import Card from '../common/Card';
import { useCurrencyFormatter } from '../../utils';
import { Trash2, Pencil } from 'lucide-react';

const TransactionList = ({ onEdit }) => {
    const { transactions, deleteTransaction } = useTransactions();
    const formatMoney = useCurrencyFormatter();
    const navigate = useNavigate();

    // Ensure Newest First (Descending Order)
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <Card className="h-96 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Transactions</h3>
                <button
                    onClick={() => navigate('/transactions')}
                    className="text-sm text-indigo-500 hover:text-indigo-600 font-medium hover:underline"
                >
                    View All
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {sortedTransactions.length === 0 ? (
                    <p className="text-slate-400 text-center mt-10">No transactions recorded.</p>
                ) : (
                    <ul className="space-y-3">
                        {sortedTransactions.map((transaction) => (
                            <li
                                key={transaction.id}
                                className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600 group"
                            >
                                <div className="flex flex-col min-w-0 flex-1 mr-4">
                                    <span className="font-medium text-slate-800 dark:text-white truncate">{transaction.text}</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(transaction.date).toLocaleDateString()} • {transaction.category}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span
                                        className={`font-bold ${parseFloat(transaction.amount) < 0 ? 'text-red-500' : 'text-green-500'}`}
                                    >
                                        {parseFloat(transaction.amount) < 0 ? '-' : '+'}{formatMoney(Math.abs(transaction.amount))}
                                    </span>
                                    <div className="flex opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEdit && onEdit(transaction)}
                                            className="text-slate-400 hover:text-indigo-500 transition-colors p-1"
                                            title="Edit"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            onClick={() => deleteTransaction(transaction.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
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
