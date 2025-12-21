import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import { useSubscriptions } from '../../context/SubscriptionContext';
import { useCurrencyFormatter } from '../../utils';
import { Calendar, AlertCircle } from 'lucide-react';

const UpcomingSubscriptions = () => {
    const { subscriptions } = useSubscriptions();
    const formatMoney = useCurrencyFormatter();
    const navigate = useNavigate();

    const upcoming = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Look ahead 7 days
        const limitDate = new Date(today);
        limitDate.setDate(today.getDate() + 7);

        return subscriptions
            .filter(sub => {
                const dueDate = new Date(sub.nextBillingDate);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate >= today && dueDate <= limitDate;
            })
            .sort((a, b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate));
    }, [subscriptions]);

    if (upcoming.length === 0) return null;

    const getDaysDue = (dateStr) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dateStr);
        due.setHours(0, 0, 0, 0);
        const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Tomorrow';
        return `in ${diff} days`;
    };

    return (
        <Card className="mb-8 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-600">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <AlertCircle size={20} className="text-amber-500" />
                    Upcoming Bills
                </h3>
                <button
                    onClick={() => navigate('/subscriptions')}
                    className="text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400"
                >
                    View All
                </button>
            </div>
            <div className="space-y-3">
                {upcoming.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                        <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-white text-sm">{sub.name}</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar size={10} /> {getDaysDue(sub.nextBillingDate)}
                            </span>
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                            {formatMoney(sub.amount)}
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );
};

export default UpcomingSubscriptions;
