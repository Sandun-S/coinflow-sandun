import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';

const BudgetContext = createContext();

const initialState = {
    budgets: []
};

const budgetReducer = (state, action) => {
    switch (action.type) {
        case 'SET_BUDGETS':
            return { ...state, budgets: action.payload };
        default:
            return state;
    }
};

export const BudgetProvider = ({ children }) => {
    const [state, dispatch] = useReducer(budgetReducer, initialState);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            dispatch({ type: 'SET_BUDGETS', payload: [] });
            return;
        }

        const q = query(collection(db, 'budgets'), where('userId', '==', user.id));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const budgets = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            dispatch({ type: 'SET_BUDGETS', payload: budgets });
        });

        return () => unsubscribe();
    }, [user]);

    // Set or Update Budget for a Category
    // We use category as the unique key logic, so usually we'd upsert.
    // However, to keep it simple with ID, we can Query by category or just loop.
    // Better: Helper function to find existing budget or create new.

    const setBudget = async (category, limit) => {
        if (!user) return;

        // Check if budget exists for this category
        const existingBudget = state.budgets.find(b => b.category === category);

        try {
            if (existingBudget) {
                await setDoc(doc(db, 'budgets', existingBudget.id), {
                    userId: user.id,
                    category,
                    limit: parseFloat(limit)
                }, { merge: true });
            } else {
                await addDoc(collection(db, 'budgets'), {
                    userId: user.id,
                    category,
                    limit: parseFloat(limit)
                });
            }
        } catch (error) {
            console.error("Error setting budget:", error);
        }
    };

    const deleteBudget = async (id) => {
        try {
            await deleteDoc(doc(db, 'budgets', id));
        } catch (error) {
            console.error("Error deleting budget:", error);
        }
    }

    return (
        <BudgetContext.Provider value={{
            budgets: state.budgets,
            setBudget,
            deleteBudget
        }}>
            {children}
        </BudgetContext.Provider>
    );
};

export const useBudgets = () => {
    const context = useContext(BudgetContext);
    if (!context) {
        throw new Error('useBudgets must be used within a BudgetProvider');
    }
    return context;
};
