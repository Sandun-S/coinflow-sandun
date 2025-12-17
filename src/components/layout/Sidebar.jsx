import React from 'react';
import { Home, PieChart, Settings, User, LogOut, MessageCircle, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const Sidebar = () => {
    const { user, logout } = useAuth();

    return (
        <div className="bg-slate-900 text-white w-full h-full flex flex-col border-r border-slate-800">
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <PieChart size={20} className="text-white" />
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">CoinFlow</h1>
            </div>
            <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-1">
                    <li>
                        <Link to="/" className="flex items-center gap-3 p-3 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all duration-200 group">
                            <Home size={20} className="group-hover:text-indigo-400 transition-colors" />
                            <span className="font-medium">Dashboard</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/analytics" className="flex items-center gap-3 p-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 group">
                            <PieChart size={20} className="group-hover:text-indigo-400 transition-colors" />
                            <span className="font-medium">Analytics</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/budgets" className="flex items-center gap-3 p-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 group">
                            <Wallet size={20} className="group-hover:text-indigo-400 transition-colors" />
                            <span className="font-medium">Budgets</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/settings" className="flex items-center gap-3 p-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 group">
                            <Settings size={20} className="group-hover:text-indigo-400 transition-colors" />
                            <span className="font-medium">Settings</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/contact" className="flex items-center gap-3 p-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200 group">
                            <MessageCircle size={20} className="group-hover:text-indigo-400 transition-colors" />
                            <span className="font-medium">Contact & Support</span>
                        </Link>
                    </li>
                </ul>
            </nav>
            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                    <Link to="/profile" className="flex items-center gap-3 overflow-hidden flex-1 group">
                        {user?.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-600 group-hover:border-indigo-500 transition-colors"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 border border-transparent group-hover:border-indigo-400 transition-colors">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate text-white group-hover:text-indigo-300 transition-colors">{user?.name || 'User'}</span>
                            <span className="text-xs text-slate-500 truncate">View Profile</span>
                        </div>
                    </Link>
                    <button onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors p-1" title="Log out">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
