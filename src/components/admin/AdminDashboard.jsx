import React, { useState } from 'react';
import MainLayout from '../layout/MainLayout';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { Search, Shield, ShieldAlert, Clock, CheckCircle, XCircle } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Card from '../common/Card';

const AdminDashboard = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;

        setLoading(true);
        setError('');
        setUsers([]);

        try {
            const usersRef = collection(db, 'users');
            // Simple search by email equality (Firestore doesn't do partial text search easily without external services)
            // We'll try finding by exact email match first
            const qEmail = query(usersRef, where('email', '==', searchTerm.trim()));
            const querySnapshot = await getDocs(qEmail);

            let foundUsers = [];
            querySnapshot.forEach((doc) => {
                foundUsers.push({ id: doc.id, ...doc.data() });
            });

            if (foundUsers.length === 0) {
                setError('No user found with that exact email.');
            }

            setUsers(foundUsers);
        } catch (err) {
            console.error(err);
            setError('Error searching users.');
        } finally {
            setLoading(false);
        }
    };

    const updateUserPlan = async (userId, action) => {
        setSuccessMsg('');
        try {
            const userRef = doc(db, 'users', userId);
            let updateData = {};
            let msg = '';

            if (action === 'grant_lifetime') {
                updateData = { plan: 'lifetime', subscriptionExpiry: null };
                msg = 'Granted Lifetime Pro!';
            } else if (action === 'revoke') {
                // Set expiry to yesterday
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                updateData = { plan: 'pro', subscriptionExpiry: Timestamp.fromDate(yesterday) };
                msg = 'Revoked Pro Status.';
            } else if (action === 'extend_month') {
                // Add 30 days to current expiry or now
                // We need to fetch current user data first to be safe, or just assume from table
                // For simplicity, let's just set it to Now + 30 days (effectively re-enabling or extending)
                const nextMonth = new Date();
                nextMonth.setDate(nextMonth.getDate() + 30);
                updateData = { plan: 'pro', subscriptionExpiry: Timestamp.fromDate(nextMonth) };
                msg = 'Extended by 1 Month.';
            }

            await updateDoc(userRef, updateData);
            setSuccessMsg(msg);

            // Refresh local state
            setUsers(users.map(u => u.id === userId ? { ...u, ...updateData } : u));

            // Clear message after 3s
            setTimeout(() => setSuccessMsg(''), 3000);

        } catch (err) {
            console.error(err);
            setError('Failed to update user.');
        }
    };

    return (
        <MainLayout>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                    <ShieldAlert size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Admin Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage user plans and permissions.</p>
                </div>
            </div>

            <Card className="mb-8">
                <form onSubmit={handleSearch} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <Input
                            label="Search User by Email"
                            placeholder="user@example.com"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Searching...' : <><Search size={18} className="mr-2" /> Search</>}
                    </Button>
                </form>
                {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
                {successMsg && <p className="text-green-500 mt-2 text-sm font-bold flex items-center gap-1"><CheckCircle size={16} /> {successMsg}</p>}
            </Card>

            {users.length > 0 && (
                <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                                <th className="p-4">User</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Plan Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {users.map(u => {
                                let statusText = 'Free/Refused';
                                let isExpired = false;

                                if (u.plan === 'lifetime') {
                                    statusText = '💎 Lifetime';
                                } else if (u.subscriptionExpiry) {
                                    const expiryDate = u.subscriptionExpiry.toDate ? u.subscriptionExpiry.toDate() : new Date(u.subscriptionExpiry.seconds * 1000);
                                    isExpired = expiryDate < new Date();
                                    statusText = isExpired ? 'Expired' : `Trial ends ${expiryDate.toLocaleDateString()}`;
                                }

                                return (
                                    <tr key={u.id} className="text-sm text-slate-700 dark:text-slate-300">
                                        <td className="p-4">
                                            <div className="font-bold">{u.name}</div>
                                            <div className="text-xs text-slate-500">{u.email}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${u.plan === 'lifetime' ? 'bg-indigo-100 text-indigo-600' : (isExpired ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600')}`}>
                                                {statusText}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={() => updateUserPlan(u.id, 'grant_lifetime')}
                                                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded text-xs font-medium transition-colors border border-indigo-200"
                                                >
                                                    💎 Grant Lifetime
                                                </button>
                                                <button
                                                    onClick={() => updateUserPlan(u.id, 'extend_month')}
                                                    className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded text-xs font-medium transition-colors border border-emerald-200"
                                                >
                                                    +1 Month
                                                </button>
                                                <button
                                                    onClick={() => updateUserPlan(u.id, 'revoke')}
                                                    className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-medium transition-colors border border-red-200"
                                                >
                                                    🚫 Revoke
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </MainLayout>
    );
};

export default AdminDashboard;
