import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, updateDoc, doc, writeBatch, increment } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { Wallet, CreditCard, Banknote } from 'lucide-react';

const AccountContext = createContext();

export const DEFAULT_ACCOUNTS = [
    {
        name: 'Cash',
        type: 'Cash',
        icon: 'Banknote',
        color: 'bg-green-100 text-green-600',
        balance: 0
    }
];

export const AccountProvider = ({ children }) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setAccounts([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'accounts'),
            where('userId', '==', user.id)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const accs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            if (accs.length === 0 && !snapshot.metadata.fromCache) {
                seedDefaults(user.id);
            } else {
                setAccounts(accs);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [user]);

    const seedDefaults = async (userId) => {
        const batch = writeBatch(db);

        DEFAULT_ACCOUNTS.forEach(acc => {
            const docRef = doc(collection(db, 'accounts'));
            batch.set(docRef, {
                ...acc,
                userId: userId,
                createdAt: new Date().toISOString()
            });
        });

        try {
            await batch.commit();
            console.log("Seeded default accounts");
        } catch (error) {
            console.error("Error seeding accounts:", error);
            setLoading(false);
        }
    };

    const addAccount = async (accountData) => {
        if (!user) return;
        try {
            const docRef = await addDoc(collection(db, 'accounts'), {
                ...accountData,
                userId: user.id,
                createdAt: new Date().toISOString()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error("Error adding account:", error);
            return { success: false, error };
        }
    };

    const updateAccount = async (id, data) => {
        if (!user) return;
        try {
            const docRef = doc(db, 'accounts', id);
            await updateDoc(docRef, data);
            return { success: true };
        } catch (error) {
            console.error("Error updating account:", error);
            return { success: false, error };
        }
    };

    const deleteAccount = async (id) => {
        try {
            await deleteDoc(doc(db, 'accounts', id));
            return { success: true };
        } catch (error) {
            console.error("Error deleting account:", error);
            return { success: false, error };
        }
    }

    const updateBalance = async (accountId, amount) => {
        if (!accountId) return;
        try {
            // We need to read the current balance first to be safe, or use increment
            // Firestore increment is safer for concurrent updates
            const docRef = doc(db, 'accounts', accountId);
            await updateDoc(docRef, {
                balance: increment(Number(amount))
            });
        } catch (error) {
            console.error("Error updating balance:", error);
        }
    };

    return (
        <AccountContext.Provider value={{
            accounts,
            loading,
            addAccount,
            updateAccount,
            deleteAccount,
            updateBalance
        }}>
            {children}
        </AccountContext.Provider>
    );
};

export const useAccounts = () => {
    return useContext(AccountContext);
};
