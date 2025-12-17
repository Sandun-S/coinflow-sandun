import React, { createContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';

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
            // Sort by date desc (optional, or do in query)
            transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

            dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
        });

        return () => unsubscribe();
    }, [user]);

    // Delete Transaction
    async function deleteTransaction(id) {
        try {
            await deleteDoc(doc(db, 'transactions', id));
            // Dispatch is handled by onSnapshot
        } catch (error) {
            console.error("Error deleting transaction:", error);
        }
    }

    // Add Transaction
    async function addTransaction(transaction) {
        try {
            const { id, ...data } = transaction; // Exclude local ID if present
            await addDoc(collection(db, 'transactions'), {
                ...data,
                userId: user.id
            });
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
            await updateDoc(transactionRef, updatedTransaction);
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
