import { firestore } from '../firebase/firebaseConfig.js';

export const saveUserToFirebase = async (userId, userData) => {
  try {
    await firestore.collection('users').doc(userId).set({userId,...userData}, { merge: true });
    console.log(`User ${userId} saved to Firebase`);
  } catch (error) {
    console.error(`Error saving user ${userId} to Firebase:`, error);
    throw error;
  }
};