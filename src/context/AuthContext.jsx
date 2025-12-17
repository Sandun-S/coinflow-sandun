import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, storage } from '../lib/firebase';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    signInWithPopup,
    updateProfile
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                // Map Firebase user to our app user structure
                setUser({
                    id: currentUser.uid,
                    name: currentUser.displayName,
                    email: currentUser.email,
                    photoURL: currentUser.photoURL
                });
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
            await signInWithPopup(auth, googleProvider);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const signup = async (firstName, lastName, email, password, profileImage) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            let photoURL = null;

            // Upload Profile Image if provided
            if (profileImage) {
                try {
                    const storageRef = ref(storage, `profile_images/${user.uid}`);
                    const snapshot = await uploadBytes(storageRef, profileImage);
                    photoURL = await getDownloadURL(snapshot.ref);
                } catch (uploadError) {
                    console.error("Image upload failed:", uploadError);
                    // Continue without image
                }
            }

            // Update profile with name and photo
            await updateProfile(user, {
                displayName: `${firstName} ${lastName}`,
                photoURL: photoURL
            });

            return { success: true };
        } catch (error) {
            console.error("Signup Error:", error.code, error.message);
            return { success: false, error: error.message };
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
        <AuthContext.Provider value={{ user, login, signup, logout, googleLogin, loading }}>
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
