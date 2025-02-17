import { sendPushNotification } from './notificationService.js';
import admin from 'firebase-admin'; // Ensure you have imported firebase-admin

/**
 * Notify user about a new gig
 * @param {string} userId - The user's ID
 * @param {string} taskTitle - The title of the task
 */
export async function notifyNewTask(userId, taskTitle) {
  try {
    // Fetch the user's FCM token from Firebase
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const fcmToken = userDoc.data()?.fcmToken;

    if (!fcmToken) {
      console.error(`FCM token not found for userId: ${userId}`);
      return;
    }

    // Send notification
    await sendPushNotification(
      fcmToken,
      'New Task Opportunity!',
      `A new task "${taskTitle}" is available. Check it out now!`,
      { task_id: 'exampleGigId123' } // Additional data
    );
    console.log(`Notification sent to userId: ${userId}`);
  } catch (error) {
    console.error('Error notifying user about new gig:', error);
  }
}