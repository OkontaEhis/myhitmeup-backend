import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

const firestore = getFirestore();

export async function createPost(userId, content, media) {
  try {
    // Create a new document reference without specifying an ID
    const postRef = firestore.collection('community_posts').doc();
    const postId = postRef.id; // Get the auto-generated ID

    const postData = {
      post_id: postId, // Use the auto-generated ID as the `post_id`
      user_id: userId,
      content: content,
      media: media || null,
      created_at: admin.firestore.Timestamp.now(),
      likes: [], // Initialize likes as an empty array
    };

    // Save the post data to Firestore
    await postRef.set(postData);

    console.log('Post created with ID:', postId);
    return postData;
  } catch (error) {
    console.error('Error creating post:', error);
    throw new Error('Failed to create post');
  }
}
// Get all posts
export async function getAllPosts() {
    try {
      const postsSnapshot = await firestore.collection('community_posts').get();
      const posts = [];
      postsSnapshot.forEach(doc => posts.push(doc.data()));
      return posts;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw new Error('Failed to fetch posts');
    }
  }