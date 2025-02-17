async function notifyCommunityUpdate(userId, postTitle) {
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const fcmToken = userDoc.data()?.fcmToken;
  
    if (!fcmToken) {
      console.error(`FCM token not found for userId: ${userId}`);
      return;
    }
  
    await sendPushNotification(
      fcmToken,
      'Community Post Update!',
      `A new comment was added to "${postTitle}".`,
      { postId: 'examplePostId456' }
    );
  }
  