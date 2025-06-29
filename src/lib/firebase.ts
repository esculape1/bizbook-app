import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let db: Firestore | null = null;

// Only run the detailed connection check in a local development environment.
// In CI/CD (like GitHub Actions), env variables are injected differently and this check can give false negatives.
// The build process on the deployment server is not a 'development' environment.
if (process.env.NODE_ENV === 'development') {
    let connectionStatus: string;
    console.log("\n--- Vérification de la connexion à Firebase ---");

    const allKeysPresent = Object.values(firebaseConfig).every(Boolean);

    if (allKeysPresent) {
      try {
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        db = getFirestore(app);
        connectionStatus = `✅ Connecté avec succès au projet : ${firebaseConfig.projectId}`;
      } catch (error) {
        console.error("❌ ERREUR D'INITIALISATION : Les clés Firebase sont présentes mais incorrectes.", error);
        connectionStatus = "❌ Échec de la connexion. Vérifiez la validité de vos clés dans la console Firebase.";
      }
    } else {
      console.warn("❌ ERREUR DE CONFIGURATION : Clés Firebase manquantes.");
      console.warn("   Veuillez vérifier que votre fichier .env.local contient toutes les clés NEXT_PUBLIC_FIREBASE_*");
      connectionStatus = "❌ Échec de la connexion. Clés manquantes dans .env.local.";
    }

    console.log(`Statut final: ${connectionStatus}`);
    console.log("-------------------------------------------\n");
} else {
    // For production/build environments, just initialize without logging.
    if (Object.values(firebaseConfig).every(v => v)) {
        try {
            const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
            db = getFirestore(app);
        } catch(e) {
            console.error("Firebase initialization failed in production-like environment:", e);
        }
    }
}


export { db };
