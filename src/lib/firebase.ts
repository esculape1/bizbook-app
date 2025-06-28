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

// --- START: Enhanced Debugging ---
console.log("================ VÉRIFICATION DE LA CONFIGURATION FIREBASE ================");
console.log("Les valeurs suivantes sont lues depuis votre environnement (.env.local) :");

let allKeysPresent = true;
for (const [key, value] of Object.entries(firebaseConfig)) {
    if (value) {
        // Hide sensitive keys in the log
        const displayValue = key === 'apiKey' ? `***${value.slice(-4)}` : value;
        console.log(`✅ ${key}: ${displayValue}`);
    } else {
        console.log(`❌ ${key}: NON DÉFINIE`);
        allKeysPresent = false;
    }
}
console.log("========================================================================");
// --- END: Enhanced Debugging ---


if (allKeysPresent) {
  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    console.log("✅ Connexion à Firebase initialisée avec succès.");
  } catch (error) {
    console.error("********************************************************************************");
    console.error("❌ ERREUR LORS DE L'INITIALISATION DE FIREBASE :");
    console.error("   Même si toutes les clés sont présentes, une erreur s'est produite.");
    console.error("   Veuillez vérifier que les valeurs de vos clés sont correctes dans la console Firebase.");
    console.error("   Erreur détaillée :", error);
    console.error("********************************************************************************");
  }
} else {
  console.warn("********************************************************************************");
  console.warn("⚠️ AVERTISSEMENT : Connexion à la base de données échouée.");
  console.warn("   Certaines variables d'environnement sont manquantes.");
  console.warn("   Veuillez vérifier votre fichier .env.local à la racine du projet.");
  console.warn("   Assurez-vous d'avoir redémarré le serveur après avoir modifié le fichier.");
  console.warn("********************************************************************************");
}

export { db };
