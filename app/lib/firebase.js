import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
    apiKey: "AIzaSyD3j5hjRexrArKTRlF0n7Rij-74P_cLG4A",
    authDomain: "lookupvegas-337b3.firebaseapp.com",
    projectId: "lookupvegas-337b3",
    storageBucket: "lookupvegas-337b3.firebasestorage.app",
    messagingSenderId: "346092081359",
    appId: "1:346092081359:web:905dad3ebb7164c34627ba",
    measurementId: "G-LHTRWF0BYG"
};

// Initialize Firebase only if it hasn't been initialized already
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
