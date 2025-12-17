import React, { createContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';

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
            // Remove local ID generation, let Firestore handle it or keep it if needed for local opt logic, 
            // but for now we trust the snapshot.
            // But wait, the form generates an ID. We should probably remove that ID or ignore it 
            // and let Firestore generate the doc ID. 
            // However, to match the UI immediately, we could keep optimistic UI? 
            // For this phase, let's rely on the real-time listener for simplicity.

            const { id, ...data } = transaction; // Exclude local ID if present
            await addDoc(collection(db, 'transactions'), {
                ...data,
                userId: user.id
            });
        } catch (error) {
            console.error("Error adding transaction:", error);
        }
    }

    return (
        <TransactionContext.Provider value={{
            transactions: state.transactions,
            deleteTransaction,
            addTransaction
        }}>
            {children}
        </TransactionContext.Provider>
    );
}
