import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

const firestore = getFirestore();
/**
 * Add a comment to a specific post
 * @param {string} postId - The ID of the post to add a comment to
 * @param {string} userId - The ID of the user making the comment
 * @param {string} content - The content of the comment
 */

// Add a comment to a post
export async function addComment(postId, userId, content) {
    try {
      const commentRef = firestore.collection('community_comment').doc();
      const commentId = commentRef.id; // Get the auto-generated ID

      const commentData = {
        comment_id: commentId,
        post_id: postId,
        user_id: userId,
        content,
        created_at: admin.firestore.Timestamp.now(),
      };
      await commentRef.set(commentData);
      console.log('Comment added:', commentData);
      return commentData;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  }
  
  // Get comments for a post
  export async function getComments(postId) {
    try {
      const commentsSnapshot = await firestore
        .collection('community_comment')
        .where('post_id', '==', postId)
        .get();
      const comments = [];
      commentsSnapshot.forEach(doc => comments.push(doc.data()));
      return comments;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw new Error('Failed to fetch comments');
    }
  }
  