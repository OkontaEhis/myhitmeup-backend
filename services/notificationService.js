import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firestore
const firestore = getFirestore();

/**
 * Create a notification for a specific user.
 * @param {string} userId - The ID of the user receiving the notification.
 * @param {string} notificationId - The notificationID of the user receiving the notification.
 * @param {string} message - The notification message.
 * @param {string} type - The type of notification (e.g., "info", "warning").
 * @param {object} additionalData - Any extra information related to the notification.
 * @returns {Promise<object>} The created notification object.
 */
export async function createNotification(userId, notificationId, message, type, additionalData = {}) {
  try {
    // Reference to the user's notifications sub-collection
    const notificationRef = firestore
      .collection('notifications') // Main collection
      .doc(userId) // Document ID for the user
      .collection('user_notifications') // Sub-collection
      .doc(notificationId); // Auto-generate a new document ID

    // Notification object to be stored
    const notification = {
      id: notificationRef.id,
      userId,
      message,
      type,
      additionalData,
      read: false, // Default state: unread
      createdAt: admin.firestore.Timestamp.now(),
    };

    // Save the notification to Firestore
    await notificationRef.set(notification); 
    console.log('Notification created:', notification);

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification');
  }
}

/**
 * Get all notifications for a specific user by userId.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array>} - Returns a list of notifications.
 */
export async function getNotifications(userId) {
  try {
    // Reference the user_notifications subcollection
    const userNotificationsRef = firestore
      .collection('notifications')
      .doc(userId)
      .collection('user_notifications');

    // Fetch all documents in the subcollection
    const snapshot = await userNotificationsRef.get();

    if (snapshot.empty) {
      console.log(`No notifications found for userId: ${userId}`);
      return [];
    }

    // Transform Firestore documents into a plain array
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Safely log the notifications array
    console.log("Fetched notifications from Firebase:", JSON.stringify(notifications, null, 2));
    return notifications; // Return the transformed data
  } catch (error) {
    console.error('Error fetching notifications:', error.message);
    throw new Error('Failed to fetch notifications');
  }
}

/**
 * Get a specific notification by userId and notificationId.
 * @param {string} userId - The ID of the user.
 * @param {string} notificationId - The ID of the notification.
 * @returns {Promise<Object>} - Returns the notification data.
 */
export async function getNotificationById(userId, notificationId) {
  try {
    const notificationRef = firestore
      .collection('notifications')
      .doc(userId)
      .collection('user_notifications')
      .doc(notificationId);

    const doc = await notificationRef.get();

    if (!doc.exists) {
      console.log('Notification not found.');
      return null;
    }

    const notification = { id: doc.id, ...doc.data() };
    console.log('Fetched notification by ID:', notification);

    return notification;
  } catch (error) {
    console.error('Error fetching notification by ID:', error);
    throw new Error('Failed to fetch notification');
  }
}

/**
 * Mark a specific notification as read.
 * @param {string} userId - The ID of the user.
 * @param {string} notificationId - The ID of the notification to mark as read.
 * @returns {Promise<void>}
 */
export async function markNotificationAsRead(userId, notificationId) {
  try {
    const notificationRef = firestore
      .collection('notifications')
      .doc(userId)
      .collection('user_notifications')
      .doc(notificationId);

    await notificationRef.update({ read: true });
    console.log(`Notification ${notificationId} marked as read for user ${userId}`);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
}

/**
 * Mark all notifications as read for a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<void>}
 */
export async function markAllNotificationsAsRead(userId) {
  try {
    const snapshot = await firestore
      .collection('notifications')
      .doc(userId)
      .collection('user_notifications')
      .get();

    const batch = firestore.batch();

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
    console.log(`All notifications marked as read for user ${userId}`);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
}
/**
 * Send a Push Notification
 * @param {string} fcmToken - The device FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} [data] - Additional data to send with the notification
 */
export async function sendPushNotification(fcmToken, title, body, data = {}) {
  try {
    const message = {
      token: fcmToken,
      notification: {
        title: title,
        body: body,
      },
      data: data, // Optional key-value pairs for additional data
    };

    const response = await admin.messaging().send(message);
    console.log('Push notification sent successfully:', response);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
export async function notifyNewMessage(senderId, receiverId, messageContent) {
  const receiverDoc = await admin.firestore().collection('users').doc(receiverId).get();
  const fcmToken = receiverDoc.data()?.fcmToken;

  if (!fcmToken) {
    console.error(`FCM token not found for userId: ${receiverId}`);
    return;
  }

  await sendPushNotification(
    fcmToken,
    'New Message Received!',
    `You have a new message from ${senderId}: "${messageContent}"`,
    { senderId: senderId }
  );
}