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
