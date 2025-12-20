import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { Lightbulb, Wifi, Tv, Smartphone, Gamepad, Home, Coffee, Gift, Activity, Shield, TrendingUp, ShoppingBag, Truck, GraduationCap, DollarSign } from 'lucide-react';

const CategoryContext = createContext();

export const DEFAULT_CATEGORIES = [
    {
        name: 'Bills & Utilities',
        type: 'expense',
        icon: 'Lightbulb',
        color: 'bg-yellow-100 text-yellow-600',
        subcategories: ['Internet Bill', 'Phone Bill', 'Television Bill', 'Electricity', 'Water']
    },
    {
        name: 'Food & Beverage',
        type: 'expense',
        icon: 'Coffee',
        color: 'bg-orange-100 text-orange-600',
        subcategories: ['Groceries', 'Restaurants', 'Cafe', 'Delivery']
    },
    {
        name: 'Transport',
        type: 'expense',
        icon: 'Truck',
        color: 'bg-blue-100 text-blue-600',
        subcategories: ['Petrol', 'Public Transport', 'Maintenance', 'Parking']
    },
    {
        name: 'Shopping',
        type: 'expense',
        icon: 'ShoppingBag',
        color: 'bg-pink-100 text-pink-600',
        subcategories: ['Houseware', 'Personal Items', 'Clothing', 'Electronics']
    },
    {
        name: 'Entertainment',
        type: 'expense',
        icon: 'Gamepad',
        color: 'bg-purple-100 text-purple-600',
        subcategories: ['Gaming', 'Movies', 'Music', 'Streaming']
    },
    {
        name: 'Health & Fitness',
        type: 'expense',
        icon: 'Activity',
        color: 'bg-green-100 text-green-600',
        subcategories: ['Gym', 'Hygiene', 'Medical Check-up', 'Pharmacy']
    },
    {
        name: 'Education',
        type: 'expense',
        icon: 'GraduationCap',
        color: 'bg-indigo-100 text-indigo-600',
        subcategories: ['Tuition', 'Books', 'Courses']
    },
    {
        name: 'Family',
        type: 'expense',
        icon: 'Home',
        color: 'bg-teal-100 text-teal-600',
        subcategories: ['Home Services', 'Kids', 'Pets']
    },
    {
        name: 'Gifts & Donations',
        type: 'expense',
        icon: 'Gift',
        color: 'bg-red-100 text-red-600',
        subcategories: ['Family Gift', 'Charity', 'Events']
    },
    {
        name: 'Insurance',
        type: 'expense',
        icon: 'Shield',
        color: 'bg-cyan-100 text-cyan-600',
        subcategories: ['Life', 'Health', 'Vehicle']
    },
    {
        name: 'Investment',
        type: 'expense',
        icon: 'TrendingUp',
        color: 'bg-emerald-100 text-emerald-600',
        subcategories: ['Stocks', 'Savings', 'Crypto']
    },
    {
        name: 'Salary',
        type: 'income',
        icon: 'DollarSign',
        color: 'bg-emerald-100 text-emerald-600',
        subcategories: ['Full-time', 'Freelance']
    }
];

export const CategoryProvider = ({ children }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            setCategories([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'categories'),
            where('userId', '==', user.id)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const cats = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // If no categories exist, seed defaults
            if (cats.length === 0 && !snapshot.metadata.fromCache) {
                seedDefaults(user.id);
            } else {
                setCategories(cats);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [user]);

    const seedDefaults = async (userId) => {
        const batch = writeBatch(db);

        DEFAULT_CATEGORIES.forEach(cat => {
            const docRef = doc(collection(db, 'categories'));
            batch.set(docRef, {
                ...cat,
                userId: userId,
                createdAt: new Date().toISOString()
            });
        });

        try {
            await batch.commit();
            console.log("Seeded default categories");
            // Local state update handled by snapshot listener
        } catch (error) {
            console.error("Error seeding categories:", error);
            setLoading(false);
        }
    };

    const addCategory = async (categoryData) => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'categories'), {
                ...categoryData,
                userId: user.id,
                createdAt: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            console.error("Error adding category:", error);
            return { success: false, error };
        }
    };

    const updateCategory = async (id, data) => {
        if (!user) return;
        try {
            const docRef = doc(db, 'categories', id);
            await updateDoc(docRef, data);
            return { success: true };
        } catch (error) {
            console.error("Error updating category:", error);
            return { success: false, error };
        }
    };

    const deleteCategory = async (id) => {
        try {
            await deleteDoc(doc(db, 'categories', id));
            return { success: true };
        } catch (error) {
            console.error("Error deleting category:", error);
            return { success: false, error };
        }
    }

    return (
        <CategoryContext.Provider value={{
            categories,
            loading,
            addCategory,
            updateCategory,
            deleteCategory
        }}>
            {children}
        </CategoryContext.Provider>
    );
};

export const useCategories = () => {
    return useContext(CategoryContext);
};
