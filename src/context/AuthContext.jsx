import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../lib/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    signInWithPopup,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const isPro = (user) => {
        if (!user) return false;
        if (user.plan === 'lifetime') return true;

        // Check if expiry date is in the future
        if (user.subscriptionExpiry) {
            // Handle Firestore Timestamp or JS Date
            const expiry = user.subscriptionExpiry?.toMillis ? user.subscriptionExpiry.toMillis() : new Date(user.subscriptionExpiry).getTime();
            return expiry > Date.now();
        }

        return false;
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Fetch additional data from Firestore
                try {
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    let userData = {
                        id: currentUser.uid,
                        name: currentUser.displayName,
                        email: currentUser.email,
                        photoURL: currentUser.photoURL,
                        role: 'user', // Default
                        plan: 'free'  // Default
                    };

                    if (userDoc.exists()) {
                        const firestoreData = userDoc.data();
                        userData = { ...userData, ...firestoreData };
                    } else {
                        // Migration: Create doc for existing user if missing
                        const trialExpiry = new Date();
                        trialExpiry.setDate(trialExpiry.getDate() + 90);

                        const newUserData = {
                            name: currentUser.displayName || 'User',
                            email: currentUser.email,
                            role: 'user',
                            plan: 'pro',
                            subscriptionExpiry: Timestamp.fromDate(trialExpiry),
                            createdAt: Timestamp.now()
                        };

                        await setDoc(userDocRef, newUserData);
                        userData = { ...userData, ...newUserData };
                    }

                    setUser(userData);
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    // Fallback to basic auth user
                    setUser({
                        id: currentUser.uid,
                        name: currentUser.displayName,
                        email: currentUser.email,
                        photoURL: currentUser.photoURL,
                        role: 'user',
                        plan: 'free'
                    });
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error) {
            let msg = "Failed to login.";
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                msg = "Invalid email or password.";
            } else if (error.code === 'auth/too-many-requests') {
                msg = "Too many failed attempts. Please try again later.";
            }
            return { success: false, error: msg };
        }
    };

    const googleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Check if user doc exists
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                // New Google User - Give Trial
                const trialExpiry = new Date();
                trialExpiry.setDate(trialExpiry.getDate() + 90);

                await setDoc(userDocRef, {
                    name: user.displayName,
                    email: user.email,
                    role: 'user',
                    plan: 'pro',
                    subscriptionExpiry: Timestamp.fromDate(trialExpiry),
                    createdAt: Timestamp.now()
                });
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const signup = async (firstName, lastName, email, password) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const fullName = `${firstName} ${lastName}`;

            // Update profile with name
            await updateProfile(user, {
                displayName: fullName
            });

            // Create Firestore Document - Give Trial
            const trialExpiry = new Date();
            trialExpiry.setDate(trialExpiry.getDate() + 90);

            await setDoc(doc(db, 'users', user.uid), {
                name: fullName,
                email: email,
                role: 'user',
                plan: 'pro',
                subscriptionExpiry: Timestamp.fromDate(trialExpiry),
                createdAt: Timestamp.now()
            });

            return { success: true };
        } catch (error) {
            console.error("Signup Error:", error.code, error.message);
            let msg = "Failed to create account.";
            if (error.code === 'auth/email-already-in-use') msg = "Email is already in use.";
            if (error.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
            if (error.code === 'auth/invalid-email') msg = "Invalid email address.";
            return { success: false, error: msg };
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, googleLogin, loading, isPro }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
