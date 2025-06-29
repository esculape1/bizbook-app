import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountString) {
      throw new Error('La variable d\'environnement FIREBASE_SERVICE_ACCOUNT_JSON n\'est pas définie. Assurez-vous qu\'elle est présente dans votre fichier .env.local.');
    }
    const serviceAccount = JSON.parse(serviceAccountString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    // This will crash the server if the service account is invalid, which is better than failing silently.
    console.error('ERREUR FATALE D\'INITIALISATION FIREBASE ADMIN:', error.message);
    throw new Error('Impossible d\'initialiser Firebase Admin SDK. Vérifiez le format de votre clé de service dans .env.local.');
  }
}

// These lines will now only be reached if initialization was successful.
export const auth = admin.auth();
export const db = admin.firestore();
