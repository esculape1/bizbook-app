import admin from 'firebase-admin';

if (!admin.apps.length) {
  console.log("Tentative d'initialisation de Firebase Admin...");
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountString) {
      console.error("ERREUR: La variable d'environnement FIREBASE_SERVICE_ACCOUNT_JSON est vide ou non définie.");
      throw new Error('La variable d\'environnement FIREBASE_SERVICE_ACCOUNT_JSON n\'est pas définie.');
    }
    console.log("Clé de service trouvée dans l'environnement. Tentative de parsing...");

    const serviceAccount = JSON.parse(serviceAccountString);
    console.log("Clé de service parsée avec succès.");

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialisé avec succès !");
  } catch (error: any) {
    console.error('❌ ERREUR FATALE D\'INITIALISATION FIREBASE ADMIN:', error.message);
    if (error.message.includes('Unexpected token')) {
      console.error("💡 PISTE: L'erreur de parsing suggère que la clé dans .env.local n'est pas un JSON valide ou n'est pas correctement entourée de guillemets simples ('').");
    }
    // This will now crash the app, which is what we want if it can't initialize.
    throw new Error('Impossible d\'initialiser Firebase Admin SDK. Vérifiez les logs du serveur pour les détails.');
  }
}

// These lines will now only be reached if initialization was successful.
export const auth = admin.auth();
export const db = admin.firestore();
