import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

let app;
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
} else {
  app = admin.app(); // Use the already initialized app
}

const auth = app.auth();
const firestore = app.firestore();

export { auth, firestore };