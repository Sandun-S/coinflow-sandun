import React from 'react';
import Modal from '../common/Modal';
import { Play, CreditCard, DollarSign, PieChart, Calendar, Wallet, LayoutDashboard } from 'lucide-react';
import { useTour } from '../../context/TourContext';

const TourSelectionModal = ({ isOpen, onClose }) => {
    const { startSpecificTour } = useTour();

    const tours = [
        {
            id: 'full',
            title: 'Full App Tour',
            desc: 'Complete walkthrough of all features.',
            icon: Play,
            color: 'bg-indigo-100 text-indigo-600',
            borderColor: 'border-indigo-200'
        },
        {
            id: 'wallets',
            title: 'Wallets & Accounts',
            desc: 'Learn to add banks, cash, and cards.',
            icon: Wallet,
            color: 'bg-blue-100 text-blue-600',
            borderColor: 'border-blue-200'
        },
        {
            id: 'transactions',
            title: 'Adding Transactions',
            desc: 'How to log income and expenses.',
            icon: DollarSign,
            color: 'bg-emerald-100 text-emerald-600',
            borderColor: 'border-emerald-200'
        },
        {
            id: 'budgets',
            title: 'Setting Budgets',
            desc: 'Control spending with monthly limits.',
            icon: PieChart,
            color: 'bg-amber-100 text-amber-600',
            borderColor: 'border-amber-200'
        },
        {
            id: 'subscriptions',
            title: 'Subscriptions',
            desc: 'Track recurring bills and payments.',
            icon: Calendar,
            color: 'bg-purple-100 text-purple-600',
            borderColor: 'border-purple-200'
        }
    ];

    const handleSelect = (id) => {
        startSpecificTour(id);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="App Guide & Demos">
            <div className="space-y-3">
                <p className="text-sm text-slate-500 mb-4">
                    Select a topic to start an interactive walkthrough. We'll guide you step-by-step.
                </p>

                <div className="grid grid-cols-1 gap-3">
                    {tours.map(tour => (
                        <button
                            key={tour.id}
                            onClick={() => handleSelect(tour.id)}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 text-left group ${tour.borderColor} dark:border-slate-700`}
                        >
                            <div className={`p-3 rounded-lg ${tour.color} dark:bg-slate-800 dark:text-slate-300 group-hover:scale-110 transition-transform`}>
                                <tour.icon size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white">{tour.title}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{tour.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

export default TourSelectionModal;
