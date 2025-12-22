import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MobileHeader = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between transition-colors duration-200">
            {/* Logo Section */}
            <div className="flex items-center gap-2" onClick={() => navigate('/')}>
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Wallet className="text-white" size={18} />
                </div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    CoinFlow
                </h1>
            </div>

            {/* Profile Section */}
            <button
                onClick={() => navigate('/profile')}
                className="relative group focus:outline-none"
            >
                {user?.photoURL ? (
                    <img
                        src={user.photoURL}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover border-2 border-slate-100 dark:border-slate-800 group-hover:border-indigo-500 transition-colors"
                    />
                ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center border-2 border-slate-100 dark:border-slate-800 group-hover:border-indigo-500 transition-colors">
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </span>
                    </div>
                )}
            </button>
        </header>
    );
};

export default MobileHeader;
