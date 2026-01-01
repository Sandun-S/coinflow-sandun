import React, { useState, useEffect } from 'react';
import MainLayout from '../layout/MainLayout';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, getCountFromServer, orderBy, limit, startAfter, endBefore, limitToLast } from 'firebase/firestore';
import { Shield, ShieldAlert, CheckCircle, ChevronLeft, ChevronRight, UserPlus, Users } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [lastVisible, setLastVisible] = useState(null);
    const [firstVisible, setFirstVisible] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Metrics
    const [totalUsers, setTotalUsers] = useState(0);
    const [newUsers30d, setNewUsers30d] = useState(0);

    const USERS_PER_PAGE = 10;

    useEffect(() => {
        fetchMetrics();
        fetchUsers('initial');
    }, []);

    const fetchMetrics = async () => {
        try {
            const usersRef = collection(db, 'users');

            // 1. Total Users
            const totalSnapshot = await getCountFromServer(usersRef);
            setTotalUsers(totalSnapshot.data().count);

            // 2. New Users (Last 30 Days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const newUsersQuery = query(usersRef, where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)));
            const newSnapshot = await getCountFromServer(newUsersQuery);
            setNewUsers30d(newSnapshot.data().count);

        } catch (err) {
            console.error("Error fetching metrics:", err);
        }
    };

    const fetchUsers = async (direction) => {
        setLoading(true);
        try {
            const usersRef = collection(db, 'users');
            let q;

            if (direction === 'next' && lastVisible) {
                q = query(usersRef, orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(USERS_PER_PAGE));
            } else if (direction === 'prev' && firstVisible) {
                q = query(usersRef, orderBy('createdAt', 'desc'), endBefore(firstVisible), limitToLast(USERS_PER_PAGE));
            } else {
                // Initial load
                q = query(usersRef, orderBy('createdAt', 'desc'), limit(USERS_PER_PAGE));
            }

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setFirstVisible(querySnapshot.docs[0]);
                setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);

                let fetchedUsers = [];
                querySnapshot.forEach((doc) => {
                    fetchedUsers.push({ id: doc.id, ...doc.data() });
                });
                setUsers(fetchedUsers);
            } else if (direction === 'next') {
                // No more results
            }

        } catch (err) {
            console.error("Error fetching users:", err);
            setError('Failed to load users. Check console for index errors.');
        } finally {
            setLoading(false);
        }
    };

    const toggleAdminRole = async (userId, currentRole) => {
        setSuccessMsg('');
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { role: newRole });

            setSuccessMsg(`User updated to ${newRole}`);
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError('Failed to update role.');
            console.error(err);
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
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                updateData = { plan: 'pro', subscriptionExpiry: Timestamp.fromDate(yesterday) };
                msg = 'Revoked Pro Status.';
            } else if (action === 'extend_month') {
                const nextMonth = new Date();
                nextMonth.setDate(nextMonth.getDate() + 30);
                updateData = { plan: 'pro', subscriptionExpiry: Timestamp.fromDate(nextMonth) };
                msg = 'Extended by 1 Month.';
            }

            await updateDoc(userRef, updateData);
            setSuccessMsg(msg);
            setUsers(users.map(u => u.id === userId ? { ...u, ...updateData } : u));
            setTimeout(() => setSuccessMsg(''), 3000);

        } catch (err) {
            console.error(err);
            setError('Failed to update user.');
        }
    };

    return (
        <MainLayout>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <Shield size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Admin Dashboard</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage user plans and permissions.</p>
                </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="bg-white dark:bg-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">Total Users</h3>
                            <p className="text-3xl font-bold text-slate-800 dark:text-white">{totalUsers}</p>
                        </div>
                    </div>
                </Card>
                <Card className="bg-white dark:bg-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-green-100 text-green-600">
                            <UserPlus size={24} />
                        </div>
                        <div>
                            <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-1">New Users (30d)</h3>
                            <p className="text-3xl font-bold text-slate-800 dark:text-white">{newUsers30d}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}
            {successMsg && <p className="text-green-500 mb-4 font-bold flex items-center gap-1"><CheckCircle size={16} /> {successMsg}</p>}

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
                                <tr key={u.id} className="text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold">{u.name}</div>
                                        <div className="text-xs text-slate-500">{u.email}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">Joined: {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'N/A'}</div>
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => toggleAdminRole(u.id, u.role)}
                                            className={`px-2 py-1 rounded text-xs font-bold border ${u.role === 'admin' ? 'bg-red-100 text-red-600 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200'} hover:opacity-80 transition-opacity`}
                                        >
                                            {u.role === 'admin' ? 'Admin' : 'User'}
                                        </button>
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

            <div className="flex justify-between items-center mt-4">
                <Button variant="secondary" onClick={() => fetchUsers('prev')} disabled={loading || !firstVisible}>
                    <ChevronLeft size={16} className="mr-2" /> Previous
                </Button>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                    {loading ? 'Loading...' : 'Page Loaded'}
                </span>
                <Button variant="secondary" onClick={() => fetchUsers('next')} disabled={loading || users.length < USERS_PER_PAGE}>
                    Next <ChevronRight size={16} className="ml-2" />
                </Button>
            </div>
        </MainLayout>
    );
};

export default AdminDashboard;
