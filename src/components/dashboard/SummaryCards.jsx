import React, { useMemo } from 'react';
import Card from '../common/Card';
import { useTransactions } from '../../hooks/useTransactions';
import { useAccounts } from '../../context/AccountContext';
import { useCurrencyFormatter } from '../../utils';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'; // Changed DollarSign to Wallet

const SummaryCards = () => {
    const { transactions } = useTransactions();
    const { accounts } = useAccounts();
    const formatMoney = useCurrencyFormatter();

    const cashAndBankBalance = useMemo(() => {
        return accounts
            .filter(a => a.type === 'Cash' || a.type === 'Bank')
            .reduce((sum, a) => sum + parseFloat(a.balance), 0);
    }, [accounts]);

    const { income, expense } = useMemo(() => {
        let inc = 0;
        let exp = 0;
        transactions.forEach(t => {
            const amount = parseFloat(t.amount);
            if (amount > 0) {
                if (t.category !== 'Transfer') inc += amount;
            }
            else exp += Math.abs(amount);
        });
        return { income: inc, expense: exp };
    }, [transactions]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="flex items-center p-6 border-l-4 border-blue-500 dark:border-blue-600">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
                    <Wallet size={24} />
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Cash & Bank</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatMoney(cashAndBankBalance)}</p>
                </div>
            </Card>

            <Card className="flex items-center p-6 border-l-4 border-green-500 dark:border-green-600">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4">
                    <TrendingUp size={24} />
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Income</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatMoney(income)}</p>
                </div>
            </Card>

            <Card className="flex items-center p-6 border-l-4 border-red-500 dark:border-red-600">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mr-4">
                    <TrendingDown size={24} />
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Expenses</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatMoney(expense)}</p>
                </div>
            </Card>
        </div>
    );
};

export default SummaryCards;

