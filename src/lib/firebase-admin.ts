
import admin from 'firebase-admin';

let db: admin.firestore.Firestore | null = null;

if (!admin.apps.length) {
  console.log("Tentative d'initialisation de Firebase Admin...");
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    
    if (!serviceAccountString) {
      console.error("AVERTISSEMENT: La variable d'environnement FIREBASE_SERVICE_ACCOUNT_JSON n'est pas définie. L'application ne pourra pas se connecter à la base de données.");
    } else {
        const serviceAccount = JSON.parse(serviceAccountString);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log("✅ Firebase Admin initialisé avec succès !");
    }
  } catch (error: any) {
    console.error('❌ ERREUR D\'INITIALISATION FIREBASE ADMIN:', error.message);
    if (error.message.includes('Unexpected token')) {
      console.error("💡 PISTE: L'erreur de parsing suggère que la clé dans .env.local n'est pas un JSON valide ou n'est pas correctement entourée de guillemets simples ('').");
    }
    console.error("L'application ne pourra pas se connecter à la base de données.");
  }
}

// Always assign db instance if admin is initialized, even if it's not the first time.
if (admin.apps.length > 0) {
  db = admin.firestore();
}

export { db };
