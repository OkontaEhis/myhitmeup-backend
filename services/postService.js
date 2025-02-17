import multer from 'multer';
import { uploadFileToCloudStorage } from './utils/cloudStorage.js'; // Utility for uploading to Firebase/Cloudinary/etc.

// Multer setup for file uploads
const storage = multer.memoryStorage();
export const upload = multer({ storage });

/**
 * Create a post with media attachments
 * @param {Object} postData - Post data (userId, content, media files)
 */
export async function createPostWithMedia(postData, mediaFiles) {
  try {
    const mediaUrls = [];

    // Upload media files to storage and get URLs
    for (const file of mediaFiles) {
      const url = await uploadFileToCloudStorage(file);
      mediaUrls.push(url);
    }

    // Save post data to database (example for Firestore)
    const postRef = admin.firestore().collection('posts').doc();
    await postRef.set({
      postId: postRef.id,
      userId: postData.userId,
      content: postData.content,
      mediaUrls,
      createdAt: admin.firestore.Timestamp.now(),
    });

    return postRef.id;
  } catch (error) {
    console.error('Error creating post with media:', error);
    throw new Error('Failed to create post');
  }
}
export async function addReaction(postId, userId, reactionType) {
  try {
    // Update reactions in Firestore
    const postRef = admin.firestore().collection('posts').doc(postId);
    await postRef.collection('reactions').doc(userId).set({ reactionType });

    return { success: true };
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw new Error('Failed to add reaction');
  }
}
export async function getReactionCount(postId) {
  try {
    const reactionsSnapshot = await admin.firestore()
      .collection('posts')
      .doc(postId)
      .collection('reactions')
      .get();

    const reactionCounts = {};
    reactionsSnapshot.forEach(doc => {
      const { reactionType } = doc.data();
      reactionCounts[reactionType] = (reactionCounts[reactionType] || 0) + 1;
    });

    return reactionCounts;
  } catch (error) {
    console.error('Error fetching reactions:', error);
    throw new Error('Failed to fetch reactions');
  }
}
export async function tagUsersInPost(postId, taggedUserIds) {
  try {
    const postRef = admin.firestore().collection('posts').doc(postId);
    await postRef.update({
      tags: admin.firestore.FieldValue.arrayUnion(...taggedUserIds),
    });

    return { success: true };
  } catch (error) {
    console.error('Error tagging users:', error);
    throw new Error('Failed to tag users');
  }
}
export async function notifyTaggedUsers(taggedUserIds, postId) {
  for (const userId of taggedUserIds) {
    // Fetch FCM token for each tagged user
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const fcmToken = userDoc.data()?.fcmToken;

    if (fcmToken) {
      await sendPushNotification(
        fcmToken,
        'You were tagged in a post!',
        `Check out the post here: ${postId}`
      );
    }
  }
}
