
// This is a one-time script to migrate users to Firebase Authentication.
// Run it with: npm run migrate-users
import admin from 'firebase-admin';
import { db } from './firebase-admin';

// Initialize a separate admin app for auth operations if not already done
if (!admin.apps.find(app => app?.name === 'auth-migration')) {
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountString) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set.");
    }
    const serviceAccount = JSON.parse(serviceAccountString);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    }, 'auth-migration');
  } catch (error: any) {
    console.error('Error initializing Firebase for migration:', error.message);
    process.exit(1);
  }
}

const auth = admin.app('auth-migration').auth();

async function migrateUsers() {
  if (!db) {
    console.error("Database connection is not available.");
    return;
  }

  console.log("Starting user migration...");
  const usersSnapshot = await db.collection('users').get();
  
  if (usersSnapshot.empty) {
    console.log("No users found in Firestore to migrate.");
    return;
  }

  for (const doc of usersSnapshot.docs) {
    const user = doc.data();
    const email = user.email.toLowerCase();
    const password = `password_${Math.random().toString(36).slice(-8)}`; // Generate a secure random password

    try {
      let existingAuthUser;
      try {
        existingAuthUser = await auth.getUserByEmail(email);
      } catch (error: any) {
        if (error.code !== 'auth/user-not-found') {
          throw error; // Re-throw other errors
        }
      }

      if (existingAuthUser) {
        console.log(`User ${email} already exists in Firebase Auth (UID: ${existingAuthUser.uid}). Updating claims...`);
        // Set custom claims for the role
        await auth.setCustomUserClaims(existingAuthUser.uid, { role: user.role || 'User' });

        // Update the user document in Firestore with the new UID
        await db.collection('users').doc(doc.id).update({
            uid: existingAuthUser.uid,
            password: FieldValue.delete(), // Remove the old password hash
        });
        console.log(`Updated claims and UID for ${email}.`);
      } else {
        console.log(`Creating user ${email} in Firebase Auth...`);
        const userRecord = await auth.createUser({
          email: email,
          password: password,
          displayName: user.name,
        });

        console.log(`Successfully created new user: ${userRecord.uid}`);

        // Set custom claims for the role
        await auth.setCustomUserClaims(userRecord.uid, { role: user.role || 'User' });
        console.log(`Set custom claims for ${email}: { role: '${user.role || 'User'}' }`);

        // Update the user document in Firestore with the new UID and remove the old password
        const { FieldValue } = await import('firebase-admin/firestore');
        await db.collection('users').doc(doc.id).update({
            uid: userRecord.uid,
            password: FieldValue.delete(),
        });
        console.log(`Updated Firestore document for ${email}.`);
        console.log(`IMPORTANT: The new password for ${email} is: ${password}. Please save this securely and provide it to the user.`);
      }
    } catch (error: any) {
      console.error(`Failed to migrate user ${email}:`, error.message);
    }
  }

  console.log("User migration script finished.");
}

migrateUsers().catch(console.error);
