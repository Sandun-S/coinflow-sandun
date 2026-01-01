import React, { createContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, updateDoc, doc, getDoc, getDocs } from 'firebase/firestore';
import { useAccounts } from './AccountContext';

// Initial state
const initialState = {
    transactions: []
};

// Create context
export const TransactionContext = createContext(initialState);

// Reducer
const AppReducer = (state, action) => {
    switch (action.type) {
        case 'SET_TRANSACTIONS':
            return {
                ...state,
                transactions: action.payload
            }
        case 'DELETE_TRANSACTION':
            return {
                ...state,
                transactions: state.transactions.filter(transaction => transaction.id !== action.payload)
            }
        case 'ADD_TRANSACTION':
            return {
                ...state,
                transactions: [action.payload, ...state.transactions]
            }
        default:
            return state;
    }
}

// Provider Component
export const TransactionProvider = ({ children }) => {
    const [state, dispatch] = useReducer(AppReducer, initialState);
    const { user } = useAuth();
    const { updateBalance } = useAccounts(); // Consume Account Context

    // Load transactions from Firestore
    useEffect(() => {
        if (!user) {
            dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
            return;
        }

        const q = query(collection(db, 'transactions'), where('userId', '==', user.id));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const transactions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort by date desc, then by createdAt desc for same-day items
            transactions.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                if (dateB.getTime() !== dateA.getTime()) {
                    return dateB - dateA;
                }
                // Tie-breaker: Created At
                const createdA = new Date(a.createdAt || 0);
                const createdB = new Date(b.createdAt || 0);
                return createdB - createdA;
            });

            dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
        });

        return () => unsubscribe();
    }, [user]);

    // Delete Transaction
    // Delete Transaction
    async function deleteTransaction(id) {
        try {
            // 1. Get the transaction to know what to revert
            const transactionRef = doc(db, 'transactions', id);
            const transactionSnap = await getDoc(transactionRef);

            if (!transactionSnap.exists()) return;

            const transaction = transactionSnap.data();

            // Check for Linked Group (Cascading Delete)
            if (transaction.transferGroupId) {
                const groupQuery = query(collection(db, 'transactions'), where('transferGroupId', '==', transaction.transferGroupId));
                const groupSnap = await getDocs(groupQuery);

                const deletePromises = groupSnap.docs.map(async (docSnapshot) => {
                    const t = docSnapshot.data();
                    // Revert Balance
                    await updateBalance(t.accountId, -Number(t.amount));
                    // Delete Doc
                    await deleteDoc(docSnapshot.ref);
                });

                await Promise.all(deletePromises);
            } else {
                // Standard Single Delete
                // Revert Balance (Opposite operation)
                await updateBalance(transaction.accountId, -Number(transaction.amount));

                // Delete Doc
                await deleteDoc(transactionRef);
            }
        } catch (error) {
            console.error("Error deleting transaction:", error);
        }
    }

    // Add Transaction
    async function addTransaction(transaction, options = {}) {
        try {
            const { id, ...data } = transaction; // Exclude local ID if present

            // 1. Add Doc
            // data includes text, amount, category, accountId, date, and optionally subscriptionId
            await addDoc(collection(db, 'transactions'), {
                ...data,
                userId: user.id,
                createdAt: new Date().toISOString()
            });

            // 2. Update Balance (Skip if requested, e.g., during import)
            if (!options.skipBalanceUpdate) {
                await updateBalance(transaction.accountId, transaction.amount);
            }

            return { success: true };
        } catch (error) {
            console.error("Error adding transaction:", error);
            return { success: false, error };
        }
    }

    // Update Transaction (needed for Edit feature)
    async function updateTransaction(id, updatedTransaction) {
        try {
            const transactionRef = doc(db, 'transactions', id);

            // 1. Get Old Transaction
            const oldTransactionSnap = await getDoc(transactionRef);
            if (oldTransactionSnap.exists()) {
                const oldTransaction = oldTransactionSnap.data();

                // 2. Revert Old Balance
                await updateBalance(oldTransaction.accountId, -oldTransaction.amount);
            }

            // 3. Update Doc
            await updateDoc(transactionRef, updatedTransaction);

            // 4. Apply New Balance
            await updateBalance(updatedTransaction.accountId, updatedTransaction.amount);

            return { success: true };
        } catch (error) {
            console.error("Error updating transaction:", error);
            return { success: false, error };
        }
    }

    return (
        <TransactionContext.Provider value={{
            transactions: state.transactions,
            deleteTransaction,
            addTransaction,
            updateTransaction
        }}>
            {children}
        </TransactionContext.Provider>
    );
}

export const useTransactions = () => {
    return React.useContext(TransactionContext);
};
