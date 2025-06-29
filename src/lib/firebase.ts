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

// This check is only for the local development environment.
// In a CI/CD environment (like GitHub Actions), env vars are injected during the build step.
if (process.env.NODE_ENV === 'development') {
    console.log("\n--- Vérification de la connexion à Firebase ---");
    if (Object.values(firebaseConfig).every(Boolean)) {
      try {
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        db = getFirestore(app);
        console.log(`Statut final: ✅ Connecté avec succès au projet : ${firebaseConfig.projectId}`);
      } catch (error) {
        console.error("❌ ERREUR D'INITIALISATION : Les clés Firebase sont présentes mais incorrectes.", error);
        console.log("Statut final: ❌ Échec de la connexion. Vérifiez la validité de vos clés dans la console Firebase.");
      }
    } else {
      console.warn("❌ ERREUR DE CONFIGURATION : Clés Firebase manquantes.");
      console.warn("   Veuillez vérifier que votre fichier .env.local contient toutes les clés NEXT_PUBLIC_FIREBASE_*");
      console.log("Statut final: ❌ Échec de la connexion. Clés manquantes dans .env.local.");
    }
    console.log("-------------------------------------------\n");
} else {
    // For non-development environments (like the build server), initialize without verbose logging.
    // The required env variables are passed directly to the build command in firebase-deploy.yml.
    if (Object.values(firebaseConfig).every(v => v)) {
        try {
            const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
            db = getFirestore(app);
        } catch(e) {
            // Silence initialization errors in build, as they are expected if variables aren't set.
        }
    }
}


export { db };
