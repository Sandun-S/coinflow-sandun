import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    updateDoc
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useTransactions } from './TransactionContext';

const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setSubscriptions([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'subscriptions'),
            where('userId', '==', user.id)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const subsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSubscriptions(subsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching subscriptions:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const [processingAutoPay, setProcessingAutoPay] = useState(false);
    const { addTransaction } = useTransactions();

    // Check for Auto-Pay on Load and Updates
    useEffect(() => {
        if (!user || loading || subscriptions.length === 0 || processingAutoPay) return;

        const checkAutoPay = async () => {
            // Filter for candidates first to avoid unnecessary processing
            const candidates = subscriptions.filter(sub => sub.autoPay && sub.walletId);
            if (candidates.length === 0) return;

            setProcessingAutoPay(true);
            let updatesMade = false;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (const sub of candidates) {
                let nextDate = new Date(sub.nextBillingDate);
                nextDate.setHours(0, 0, 0, 0);

                // Catch-Up Logic: Loop while date is in past or today
                // Safety: Limit loop to 12 iterations (1 year) to prevent infinite loops if dates are broken
                let iterations = 0;
                let modified = false;

                while (nextDate <= today && iterations < 12) {
                    console.log(`Auto-paying ${sub.name} for ${nextDate.toLocaleDateString()}`);

                    // 1. Pay
                    const amount = parseFloat(sub.amount);
                    await addTransaction({
                        text: `Auto-Pay: ${sub.name}`,
                        amount: (sub.type === 'income' ? 1 : -1) * Math.abs(amount),
                        category: sub.category || 'Bills & Utilities',
                        accountId: sub.walletId,
                        date: new Date().toISOString(), // Transaction happens NOW
                        subscriptionId: sub.id
                    });

                    // 2. Advance Date
                    if (sub.billingCycle === 'Monthly') {
                        nextDate.setMonth(nextDate.getMonth() + 1);
                    } else {
                        nextDate.setFullYear(nextDate.getFullYear() + 1);
                    }

                    modified = true;
                    iterations++;
                }

                if (modified) {
                    // Update Subscription with new future date
                    await updateSubscription(sub.id, {
                        nextBillingDate: nextDate.toISOString()
                    });
                    updatesMade = true;
                }
            }

            setProcessingAutoPay(false);
        };

        checkAutoPay();
    }, [user, loading, subscriptions]);

    const addSubscription = async (subscriptionData) => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'subscriptions'), {
                ...subscriptionData,
                userId: user.id,
                createdAt: new Date()
            });
            return { success: true };
        } catch (error) {
            console.error("Error adding subscription:", error);
            return { success: false, error: error.message };
        }
    };

    const updateSubscription = async (id, updatedData) => {
        if (!user) return;
        try {
            const docRef = doc(db, 'subscriptions', id);
            await updateDoc(docRef, updatedData);
            return { success: true };
        } catch (error) {
            console.error("Error updating subscription:", error);
            return { success: false, error: error.message };
        }
    };

    const deleteSubscription = async (id) => {
        try {
            await deleteDoc(doc(db, 'subscriptions', id));
            return { success: true };
        } catch (error) {
            console.error("Error deleting subscription:", error);
            return { success: false, error: error.message };
        }
    };

    return (
        <SubscriptionContext.Provider value={{
            subscriptions,
            loading,
            addSubscription,
            updateSubscription,
            deleteSubscription
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscriptions = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscriptions must be used within a SubscriptionProvider');
    }
    return context;
};
