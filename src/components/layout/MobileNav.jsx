import React from 'react';
import { Home, PieChart, Wallet, Settings, Calendar, CreditCard } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const MobileNav = () => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 md:hidden pb-safe">
            <nav className="flex justify-around items-center h-16 px-2">
                <NavLink
                    to="/"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                        }`
                    }
                    data-tour="dashboard-nav"
                >
                    <Home size={20} />
                    <span className="text-[10px] font-medium">Home</span>
                </NavLink>

                <NavLink
                    to="/wallets"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                        }`
                    }
                    data-tour="wallets-nav"
                >
                    <CreditCard size={20} />
                    <span className="text-[10px] font-medium">Wallets</span>
                </NavLink>

                <NavLink
                    to="/analytics"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                        }`
                    }
                    data-tour="analytics-nav"
                >
                    <PieChart size={20} />
                    <span className="text-[10px] font-medium">Analytics</span>
                </NavLink>

                <NavLink
                    to="/budgets"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                        }`
                    }
                >
                    <Wallet size={20} />
                    <span className="text-[10px] font-medium">Budgets</span>
                </NavLink>

                <NavLink
                    to="/subscriptions"
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                        }`
                    }
                >
                    <Calendar size={20} />
                    <span className="text-[10px] font-medium">Subs</span>
                </NavLink>


            </nav>
        </div>
    );
};

export default MobileNav;
