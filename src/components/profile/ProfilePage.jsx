import React from 'react';
import MainLayout from '../layout/MainLayout';
import Card from '../common/Card';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useTransactions } from '../../hooks/useTransactions'; // Using context directly to trigger resets if needed
import { User, Trash2, Mail, Calendar } from 'lucide-react';

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
                        <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-4xl font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{user?.name}</h3>
                            <p className="text-gray-500 dark:text-gray-400">Free Member</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <Mail className="text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Email Address</p>
                                <p className="text-gray-800 dark:text-gray-200 font-medium">{user?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <Calendar className="text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Member Since</p>
                                <p className="text-gray-800 dark:text-gray-200 font-medium">{new Date().getFullYear()}</p>
                            </div>
                        </div>
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
