
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if all config keys are present
const areAllConfigKeysPresent = Object.values(firebaseConfig).every(Boolean);

let app: FirebaseApp | undefined;
let db: Firestore | null = null;

if (areAllConfigKeysPresent) {
    // Initialize Firebase only if not already initialized
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
} else {
    console.warn("❌ CONFIGURATION FIREBASE MANQUANTE: Veuillez vérifier que toutes les variables NEXT_PUBLIC_FIREBASE_* sont définies dans votre fichier .env.local. Les fonctionnalités Firestore seront désactivées.");
}

export { db };
