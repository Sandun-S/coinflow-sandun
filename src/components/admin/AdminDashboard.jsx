import React, { useState, useEffect } from 'react';
import MainLayout from '../layout/MainLayout';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, getCountFromServer, orderBy } from 'firebase/firestore';
import { Search, Shield, ShieldAlert, Clock, CheckCircle, XCircle } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Card from '../common/Card';

const AdminDashboard = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const usersRef = collection(db, 'users');
            // Order by CreatedAt desc if possible, otherwise just get all
            const q = query(usersRef, orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);

            let fetchedUsers = [];
            querySnapshot.forEach((doc) => {
                fetchedUsers.push({ id: doc.id, ...doc.data() });
            });

            // Fetch Transaction Counts for each user
            const usersWithCounts = await Promise.all(fetchedUsers.map(async (user) => {
                try {
                    const txRef = collection(db, 'transactions');
                    const qTx = query(txRef, where('userId', '==', user.id));
                    const snapshot = await getCountFromServer(qTx);
                    return { ...user, txCount: snapshot.data().count };
                } catch (e) {
                    console.error(`Failed to count tx for ${user.id}`, e);
                    return { ...user, txCount: 0 };
                }
            }));

            setUsers(usersWithCounts);
        } catch (err) {
            console.error("Error fetching users:", err);
            // Fallback if index missing or error
            if (err.message.includes("requires an index")) {
                console.warn("Index missing for sorting, fetching without sort");
                // ... fallback fetch without sort ...
            }
            setError('Failed to load users.');
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

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none">
                    <h3 className="text-indigo-100 font-medium mb-1">Total Users</h3>
                    <p className="text-3xl font-bold">{users.length}</p>
                </Card>
                <Card className="bg-white dark:bg-slate-800">
                    <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">Total Activities</h3>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white">
                        {users.reduce((acc, u) => acc + (u.txCount || 0), 0)}
                    </p>
                </Card>
                <Card className="bg-white dark:bg-slate-800">
                    <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">Pro Users</h3>
                    <p className="text-3xl font-bold text-slate-800 dark:text-white">
                        {users.filter(u => u.plan !== 'free').length}
                    </p>
                </Card>
            </div>

            <Card className="mb-8">
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <Input
                            label="Filter Users"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </Card>

            <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                            <th className="p-4">User</th>
                            <th className="p-4">Activity</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Plan Status</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {users
                            .filter(u =>
                                u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                u.email?.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map(u => {
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
                                    <tr key={u.id} className="text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold">{u.name}</div>
                                            <div className="text-xs text-slate-500">{u.email}</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">Joined: {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'N/A'}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="font-bold text-lg">{u.txCount || 0}</div>
                                                <span className="text-xs text-slate-500">txns</span>
                                            </div>
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
                                                    💎 Lifetime
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
                {users.length === 0 && !loading && (
                    <div className="p-8 text-center text-slate-500">
                        No users found.
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default AdminDashboard;
