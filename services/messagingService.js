import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./config/firebaseServiceAccount.json', 'utf8'));
// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount), // Replace with your path
  });
}

// Initialize Firestore
const firestore = getFirestore();

/**
 * Send a message to Firestore
 * @param {string} document_id - The ID of the conversation
 * @param {string} senderId - The ID of the sender
 * @param {string} receiverId - The ID of the receiver
 * @param {string} text - The message text
 */
export async function sendMessage(document_id, senderId, receiverId, text) {
  try {
    const messageRef = firestore
      .collection('messages')
      .doc(document_id)
      .collection('messages')
      .doc();

    await messageRef.set({
      message_id: messageRef.id,
      sender_id: senderId,
      receiver_id: receiverId,
      content: text,
      timestamp: admin.firestore.Timestamp.now(),
    });

    console.log('Message sent!');
    return messageRef.id; // Return the message ID
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
}

