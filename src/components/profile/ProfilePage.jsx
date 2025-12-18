import React from 'react';
import MainLayout from '../layout/MainLayout';
import Card from '../common/Card';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../hooks/useTransactions'; // Using context directly to trigger resets if needed
import { User, Trash2, Mail, Calendar, MessageCircle, LogOut, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
    const { user, logout } = useAuth();

    // We access localStorage directly for the "Nuclear" option or better, expose a 'clearData' method in TransactionContext.
    // However, simplest is to clear the key.

    const handleDeleteData = () => {
        if (confirm("Are you sure? This will delete ALL your transaction data permanently.")) {
            localStorage.removeItem(`transactions_${user.id}`);
            // Force reload to reset state
            window.location.reload();
        }
    };

    return (
        <MainLayout>
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Profile</h2>
                <p className="text-gray-500 dark:text-gray-400">Manage your account and data.</p>
            </div>

            <div className="max-w-2xl">
                <Card className="mb-6">
                    <div className="flex items-center gap-6 mb-8">
                        {user?.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt={user.name}
                                className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 dark:border-slate-700 shadow-md"
                            />
                        ) : (
                            <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-slate-100 dark:border-slate-700 shadow-md">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{user?.name}</h3>
                            <p className="text-slate-500 dark:text-slate-400">Free Member</p>
                        </div>
                    </div>

                    {/* Unified Action Menu */}
                    <Card className="mb-6 overflow-hidden !p-0">
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                            {/* Email Info (Read Only) */}
                            <div className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                                    <Mail size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-800 dark:text-white">Email</p>
                                    <p className="text-xs text-slate-500">{user?.email}</p>
                                </div>
                            </div>

                            {/* Settings */}
                            <Link to="/settings" className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                                    <Settings size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-800 dark:text-white">Settings & Preferences</p>
                                    <p className="text-xs text-slate-500">Theme, Currency, Export</p>
                                </div>
                                <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
                                    &rarr;
                                </div>
                            </Link>

                            {/* Contact Support */}
                            <Link to="/contact" className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                                    <MessageCircle size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-800 dark:text-white">Contact Support</p>
                                    <p className="text-xs text-slate-500">Get help with CoinFlow</p>
                                </div>
                                <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
                                    &rarr;
                                </div>
                            </Link>

                            {/* Sign Out */}
                            <button
                                onClick={logout}
                                className="w-full p-4 flex items-center gap-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group text-left"
                            >
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 group-hover:text-red-500 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                                    <LogOut size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-800 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400">Sign Out</p>
                                </div>
                            </button>
                        </div>
                    </Card>

                    <Card className="border-red-100 dark:border-red-900/30">
                        <h3 className="text-red-600 font-bold mb-2 flex items-center gap-2">
                            <Trash2 size={20} /> Danger Zone
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Once you delete your data, there is no going back. Please be certain.
                        </p>
                        <Button variant="danger" onClick={handleDeleteData}>
                            Delete All My Data
                        </Button>
                    </Card>
            </div>
        </MainLayout>
    );
};

export default ProfilePage;
