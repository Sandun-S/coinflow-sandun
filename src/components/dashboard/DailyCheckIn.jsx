import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { Bell, CheckCircle, Plus } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';

const DailyCheckIn = ({ onAddTransaction }) => {
    const { transactions } = useTransactions();
    const [isVisible, setIsVisible] = useState(false);
    const [status, setStatus] = useState('pending'); // pending, reviewed
    const [notificationPermission, setNotificationPermission] = useState('default');

    useEffect(() => {
        checkVisibility();
        // Check permission status
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    }, [transactions]);

    const checkVisibility = () => {
        const now = new Date();
        const hour = now.getHours();
        const dateKey = now.toLocaleDateString();

        // TEMPORARY: FORCE VISIBILITY FOR USER TESTING
        // We are bypassing all checks (Time, Existing Tx, Review Status) so the card is ALWAYS visible.

        // 1. Check Local Storage Status
        // const dailyStatus = localStorage.getItem(`daily_status_${dateKey}`);
        // if (dailyStatus === 'reviewed') {
        //     setIsVisible(false);
        //     return;
        // }

        // 2. Check Time (5 PM - 11:59 PM)
        // if (hour < 17) {
        //     setIsVisible(false);
        //     return;
        // }

        // 3. Check for Existing Transactions TODAY
        // const hasTransactionToday = transactions.some(t => {
        //     const tDate = new Date(t.date);
        //     return tDate.toLocaleDateString() === dateKey;
        // });

        // if (hasTransactionToday) {
        //     setIsVisible(false);
        //     return;
        // }

        // If all checks pass, show it
        setIsVisible(true);
        setStatus('pending');

        // Trigger Notification if allowed
        if (Notification.permission === 'granted') {
            // ... notification logic ...
        }
    };

    const handleNothingSpent = () => {
        const now = new Date();
        const dateKey = now.toLocaleDateString();
        localStorage.setItem(`daily_status_${dateKey}`, 'reviewed');
        setIsVisible(false);
        // Maybe show confetti or toast? For now just hide.
    };

    const enableNotifications = async () => {
        if (!('Notification' in window)) {
            alert("This browser does not support desktop notifications");
            return;
        }
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
            new Notification("Notifications Enabled", { body: "We'll remind you at 5 PM if you haven't logged expenses." });
        }
    };

    if (!isVisible) return null;

    return (
        <Card className="mb-6 border-l-4 border-indigo-500 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white dark:bg-slate-700 rounded-full shadow-sm text-indigo-500 animate-pulse">
                        <Bell size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Daily Check-In</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            It's evening! Did you spend any money today?
                        </p>
                        {notificationPermission === 'default' && (
                            <div>
                                {!window.isSecureContext && window.location.hostname !== 'localhost' ? (
                                    <p className="text-xs text-red-500 font-medium mt-1">
                                        ⚠️ Notifications require HTTPS. (Not working on IP)
                                    </p>
                                ) : (
                                    <button
                                        onClick={enableNotifications}
                                        className="text-xs text-indigo-600 underline mt-1 hover:text-indigo-800 dark:text-indigo-400"
                                    >
                                        Enable Notifications
                                    </button>
                                )}
                            </div>
                        )}
                        {notificationPermission === 'granted' && (
                            <button
                                onClick={() => {
                                    alert("Waiting 5 seconds... Close/Minimize the app now!");
                                    setTimeout(async () => {
                                        if ('serviceWorker' in navigator) {
                                            const reg = await navigator.serviceWorker.ready;
                                            reg.showNotification("Test Reminder", {
                                                body: "This is a test from the Service Worker! 🚀",
                                                icon: '/pwa-192x192.png',
                                                tag: 'test-notification',
                                                vibrate: [200, 100, 200]
                                            });
                                        } else {
                                            new Notification("Test Reminder", {
                                                body: "This is a test (Main Thread)! 🚀",
                                                icon: '/pwa-192x192.png'
                                            });
                                        }
                                    }, 5000);
                                }}
                                className="text-xs text-emerald-600 underline mt-1 ml-4 hover:text-emerald-800 dark:text-emerald-400"
                            >
                                Test Notification (5s)
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                    <Button
                        variant="secondary"
                        onClick={handleNothingSpent}
                        className="flex-1 sm:flex-none justify-center whitespace-nowrap"
                    >
                        <CheckCircle size={18} className="mr-2" />
                        Nothing Spent
                    </Button>
                    <Button
                        onClick={onAddTransaction}
                        className="flex-1 sm:flex-none justify-center whitespace-nowrap"
                    >
                        <Plus size={18} className="mr-2" />
                        Add Transaction
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export default DailyCheckIn;
