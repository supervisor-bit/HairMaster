import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Authentication
import { getFirestore } from 'firebase/firestore'; // Database

// ⚠️ PLACEHOLDER CONFIGURATION ⚠️
// User has not provided keys yet. Please update this object with keys from Firebase Console.
const firebaseConfig = {
    apiKey: "AIzaSyCLk0A5m1UL3P8_l3L0cvsa_SIqVAxpmHc",
    authDomain: "kadernictvi-app.firebaseapp.com",
    projectId: "kadernictvi-app",
    storageBucket: "kadernictvi-app.firebasestorage.app",
    messagingSenderId: "492480227328",
    appId: "1:492480227328:web:23814e0a9a30fdb0ecd0e5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
