import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

const firestore = getFirestore();
// Like a post
export async function likePost(postId, userId) {
    try {
      const postRef = firestore.collection('community_posts').doc(postId);
      const postSnapshot = await postRef.get();
      if (!postSnapshot.exists) {
        throw new Error('Post not found');
      }
  
      const post = postSnapshot.data();
      if (!post.likes.includes(userId)) { 
        await postRef.update({
          likes: admin.firestore.FieldValue.arrayUnion(userId),
        });
        console.log('Post liked:', postId);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      throw new Error('Failed to like post');
    }
  }
  