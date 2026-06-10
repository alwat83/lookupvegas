"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                try {
                    // Admin Override for UI
                    if (firebaseUser.email === 'albertlwatson@gmail.com') {
                        setUserProfile({
                            email: firebaseUser.email,
                            tier: 'Enterprise',
                            isAdmin: true
                        });
                        setLoading(false);
                        return;
                    }

                    // Fetch or create user profile in Firestore
                    const userDocRef = doc(db, "users", firebaseUser.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    
                    if (userDocSnap.exists()) {
                        setUserProfile(userDocSnap.data());
                    } else {
                        const newProfile = {
                            email: firebaseUser.email,
                            tier: "Free", // Default tier
                            subscriptionStatus: "active",
                            createdAt: new Date().toISOString()
                        };
                        await setDoc(userDocRef, newProfile);
                        setUserProfile(newProfile);
                    }
                } catch (error) {
                    console.warn("Firestore access denied or failed. Defaulting to Free tier.", error);
                    setUserProfile({
                        email: firebaseUser.email,
                        tier: "Free"
                    });
                }
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, userProfile, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
