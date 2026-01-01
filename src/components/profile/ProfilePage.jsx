import React from 'react';
import MainLayout from '../layout/MainLayout';
import Card from '../common/Card';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../hooks/useTransactions'; // Using context directly to trigger resets if needed
import { User, Trash2, Mail, Calendar, MessageCircle, LogOut, Settings, Zap, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import TourSelectionModal from '../onboarding/TourSelectionModal';

const ProfilePage = () => {
    const { user, logout } = useAuth();
    const [isTourOpen, setIsTourOpen] = React.useState(false);

    // Plan Logic
    const isLifetime = user?.plan === 'lifetime';
    const isPro = user?.plan === 'pro';

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
                <Card className="mb-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-none shadow-lg relative overflow-hidden">
                    <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-8 text-center sm:text-left">
                        {user?.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt={user.name}
                                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-xl"
                            />
                        ) : (
                            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white dark:border-slate-700 shadow-xl">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="flex flex-col items-center sm:items-start w-full">
                            <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{user?.name}</h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-gray-400 break-all">{user?.email}</p>
                            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase tracking-wide">
                                Member
                            </div>
                        </div>
                    </div>
                    {/* Subtle decorative circle */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
                </Card>

                <div className="md:col-span-2 space-y-6 mb-6">
                    {/* Plan Status Card */}
                    {/* Plan Status Card */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <div className="relative z-10">
                            <div className="text-slate-400 text-sm font-medium mb-1 uppercase tracking-wider">Current Plan</div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-3xl font-bold">
                                    {isLifetime ? 'Lifetime Pro' : isPro ? 'Monthly Pro' : 'Free Plan'}
                                </h2>
                                {isLifetime && <Sparkles className="text-yellow-400" size={24} />}
                            </div>

                            {!isLifetime && (
                                <div className="mt-6 pt-6 border-t border-white/10">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-white">Upgrade to Lifetime 💎</div>
                                            <div className="text-sm text-slate-400">One-time payment for specific features.</div>
                                        </div>
                                        <a
                                            href="https://shop.sandunsiwantha.com/products/coinflow-pro-plan"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors"
                                        >
                                            Buy Now
                                        </a>
                                    </div>
                                </div>
                            )}

                            {isPro && !isLifetime && user?.subscriptionExpiry && (
                                <div className="mt-2 text-xs text-slate-500">
                                    Trial ends on {user.subscriptionExpiry.toDate().toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* App Tour & Guide Trigger */}
                    <Card
                        className="cursor-pointer bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none relative overflow-hidden shadow-xl group hover:shadow-2xl transition-all duration-300"
                        onClick={() => setIsTourOpen(true)}
                    >
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 text-white rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform">
                                    <Zap size={24} fill="currentColor" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">App Demos & Guides</h3>
                                    <p className="text-sm text-amber-100">Restart tours for wallets, budgets.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm bg-white px-4 py-2 rounded-lg shadow-sm group-hover:scale-105 transition-transform">
                                Start <span className="hidden sm:inline">Tour</span> <span>&rarr;</span>
                            </div>
                        </div>
                        {/* Decorative glow */}
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-yellow-400/30 rounded-full blur-2xl"></div>
                    </Card>

                    <Card>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Account Details</h3>
                        <p className="text-slate-500 dark:text-slate-400">This section can be used for additional account details if needed.</p>
                    </Card>
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

            <TourSelectionModal isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
        </MainLayout>
    );
};

export default ProfilePage;
