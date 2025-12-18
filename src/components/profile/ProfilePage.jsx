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

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                            <Mail className="text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Email Address</p>
                                <p className="text-slate-800 dark:text-slate-200 font-medium">{user?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                            <Calendar className="text-slate-400" />
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Member Since</p>
                                <p className="text-slate-800 dark:text-slate-200 font-medium">{new Date().getFullYear()}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Settings & Preferences */}
                <div className="mb-6">
                    <Link to="/settings" className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group">
                        <div className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            <Settings size={22} />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-slate-800 dark:text-white">Settings & Preferences</p>
                            <p className="text-xs text-slate-500">Theme, Currency, Export</p>
                        </div>
                        <div className="text-slate-300">
                            &rarr;
                        </div>
                    </Link>
                </div>

                {/* Logout Action */}
                <Card className="mb-6 border-slate-200 dark:border-slate-700">
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 font-bold py-2 transition-colors"
                    >
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </Card>

                {/* Mobile Only: Contact Support */}
                <div className="md:hidden mb-6">
                    <Link to="/contact" className="flex items-center gap-4 p-4 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-colors">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <MessageCircle size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold">Contact Support</p>
                            <p className="text-xs text-indigo-100">Need help? Chat with us.</p>
                        </div>
                    </Link>
                </div>

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
