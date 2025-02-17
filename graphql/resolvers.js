import admin from 'firebase-admin';
//import admin from "./config/firebase.js";
import dotenv from 'dotenv';
//import { uploadFile } from './fileService'; // A utility function for handling file uploads
import db from '../db.js'; // Ensure you have the correct path to your db module
import { auth } from '../firebase/firebaseConfig.js'; // Ensure you have the correct path to your firebase config
import { saveUserToFirebase } from '../services/firebaseService.js';
import { saveUserToMySQL } from '../services/mysqlService.js';
import  bcrypt  from 'bcryptjs';
import validator from 'validator'; // Import validator.js// Import validation functions
//const auth = admin.auth();

const firestore = admin.firestore();
dotenv.config();

const isValidE164 = (phoneNumber) => {
  const regex = /^\+[1-9]\d{1,14}$/;
  return regex.test(phoneNumber);
};
export const isValidNIN = (NIN) => {
  const regex = /^\d{11}$/;
  return regex.test(NIN);
};

export const resolvers = {
  Query: {
    // Fetch all posts
    getPosts: async () => {
      const snapshot = await firestore.collection('posts').get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    },
    async getUsersByRole(_, { role }) {
      const usersRef = firestore.collection('users');
      const snapshot = await usersRef.where('role', '==', role).get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Fetch a single post by ID
    getPostById: async (_, { id }) => {
      const doc = await firestore.collection('posts').doc(id).get();
      if (!doc.exists) throw new Error('Post not found');
      return { id: doc.id, ...doc.data() };
    },
    recommendTask: async (_, { user_id}) => {
      try {
        // Fetch user skills and activity
        const user = await db.query('SELECT skills FROM users WHERE user_id = ?', [user_id]);
        if (!user.length) throw new Error('User not found');

        const userSkills = user[0].skills.split(',');

        // Fetch gigs matching user skills or past searches
        const recommendedTask = await db.query(`
          SELECT * FROM task
          WHERE title IN (?) 
          ORDER BY created_at DESC
          LIMIT 10
        `, [userSkills]);

        return recommendedTask;
      } catch (error) {
        console.error('Error fetching recommended task:', error);
        throw new Error('Could not fetch recommended task');
      }
    },
    getReviews: async (_, { task_id }) => {
      const reviews = await db.query('SELECT * FROM reviews WHERE task_id = ?', [task_id]);
      return reviews;
    },
     // Provider Analytics
     getProviderAnalytics: async (_, { user_id}) => {
      const profileViews = await db.query(
        'SELECT profile_views FROM users WHERE user_id = ?',
        [user_id]
      );

      const bidsSubmitted = await db.query(
        'SELECT COUNT(*) AS count FROM bid WHERE user_id = ?',
        [user_id]
      );

      const taskCompleted = await db.query(
        'SELECT COUNT(*) AS count FROM task WHERE client_id = ? AND status = "completed"',
        [user_id]
      );

      return {
        profileViews: profileViews[0]?.profile_views || 0,
        bidsSubmitted: bidsSubmitted[0]?.count || 0,
        taskCompleted: taskCompleted[0]?.count || 0,
      };
    },

    // Seeker Analytics
    getSeekerAnalytics: async (_, { user_id }) => {
      const taskerHired = await db.query(
        'SELECT COUNT(*) AS count FROM transaction WHERE tasker_id = ?',
        [user_id]
      );

      const totalSpent = await db.query(
        'SELECT SUM(amount) AS total FROM transaction WHERE tasker_id = ?',
        [user_id]
      );

      const savedTasks = await db.query(
        'SELECT t.* FROM saved_task s JOIN task t ON s.task_id = t.task_id WHERE s.tasker_id = ?',
        [user_id]
      );

      return {
        taskerHired: taskerHired[0]?.count || 0,
        totalSpent: totalSpent[0]?.total || 0.0,
        savedTasks,
      };
    },
    getUserbyId: async (_, { user_id }) => {
      try {
        const [rows] = await db.query('SELECT * FROM users WHERE user_id = ?', [user_id]);
        if (rows.length === 0) throw new Error('User not found');
        return rows[0];
      } catch (error) {
        console.error('Error fetching user:', error);
        throw new Error('Error fetching user.');
      }
    },
    async getUser(_, { firebase_uid}) {
      try {
        // Fetch user from MySQL
        const [rows] = await db.execute(`SELECT * FROM users WHERE firebase_uid = ?`, [firebaseUid]);
        if (rows.length === 0) throw new Error("User not found in MySQL");
        
        // Fetch user from Firebase
        const userRecord = await admin.auth().getUser(firebase_uid);

        return {
          id: userRecord.uid,
          firebase_uid: userRecord.uid,
          username: rows[0].username,
          phoneNumber: userRecord.phoneNumber,
          role: rows[0].role || "User",
          profileViews: rows[0].profile_views || 0,
        };
        
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    },
    async getUser(_, { userId }) {
      try {
        // Get user from MySQL
        const [rows] = await db.execute(`SELECT * FROM users WHERE firebase_uid = ?`, [userId]);
        if (rows.length === 0) throw new Error("User not found in MySQL");

        // Get user from Firebase
        const userRecord = await auth.getUser(userId);

        return {
          id: userRecord.uid,
          username: rows[0].username,
          email: userRecord.email,
          role: rows[0].role || "User",
        };
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    },
  },

  Mutation: {
    // Create a new post
    createPost: async (_, { userId, content, mediaUrls, tags }) => {
      const postRef = firestore.collection('posts').doc();
      const newPost = {
        userId,
        content,
        mediaUrls: mediaUrls || [],
        tags: tags || [],
        reactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await postRef.set(newPost);
      return { id: postRef.id, ...newPost };
    },

    // Add a reaction to a post
    addReaction: async (_, { postId, userId, reactionType }) => {
      const postRef = firestore.collection('posts').doc(postId);
      const postDoc = await postRef.get();

      if (!postDoc.exists) throw new Error('Post not found');

      const reactions = postDoc.data().reactions || [];
      reactions.push({ userId, reactionType });

      await postRef.update({ reactions, updatedAt: new Date().toISOString() });
      return { id: postRef.id, ...postDoc.data(), reactions };
    },

    // Tag users in a post
    tagUsers: async (_, { postId, taggedUserIds }) => {
      const postRef = firestore.collection('posts').doc(postId);
      const postDoc = await postRef.get();

      if (!postDoc.exists) throw new Error('Post not found');

      const tags = new Set(postDoc.data().tags || []);
      taggedUserIds.forEach((userId) => tags.add(userId));

      await postRef.update({ tags: Array.from(tags), updatedAt: new Date().toISOString() });
      return { id: postRef.id, ...postDoc.data(), tags: Array.from(tags) };
    },
    async createReport(_, { input }) {
      const { reporterId, reportedContentId, contentType, reason } = input;

      const reportRef = firestore.collection('reports').doc();
      const report = {
        reporterId,
        reportedContentId,
        contentType,
        reason,
        status: 'pending',
        createdAt: admin.firestore.Timestamp.now(),
        reviewedBy: null,
      };

      await reportRef.set(report);
      return { id: reportRef.id, ...report };
    },

    async updateReportStatus(_, { input }) {
      const { reportId, status, reviewedBy } = input;

      const reportRef = firestore.collection('reports').doc(reportId);
      const reportSnapshot = await reportRef.get();

      if (!reportSnapshot.exists) {
        throw new Error('Report not found');
      }

      await reportRef.update({ status, reviewedBy });
      return { id: reportId, ...reportSnapshot.data(), status, reviewedBy };
    },

    async assignUserRole(_, { userId, role }) {
      const userRef = firestore.collection('users').doc(userId);

      const userSnapshot = await userRef.get();
      if (!userSnapshot.exists) {
        throw new Error('User not found');
      }

      await userRef.update({ role });
      return { id: userId, ...userSnapshot.data(), role };
    },
    createBid: async (_, { input }) => {
      const { bid_id, user_id, message, attachments } = input;

      // Save attachments if provided
      let savedAttachments = [];
      if (attachments && attachments.length) {
        savedAttachments = await Promise.all(
          attachments.map(file => uploadFile(file))
        );
      }

      // Save the proposal to the database
      const result = await db.query(
        `INSERT INTO bid (bid_id, user_id, message, attachments, submitted_at) VALUES (?, ?, ?, ?, NOW())`,
        [bid_id, user_id, message, JSON.stringify(savedAttachments)]
      );

      return {
        id: result.insertId,
        bid_id: result.insertId,
        user_id,
        message,
        attachments: savedAttachments,
        submittedAt: new Date().toISOString(),
      };
    },
    createReview: async (_, { input }) => {
      const { task_id, reviewerId, rating_id, comment } = input;

      // Save the review to the database
      const result = await db.query(
        `INSERT INTO reviews (task_id, reviewer_id, rating_id, comment, created_at) VALUES (?, ?, ?, ?, NOW())`,
        [task_id, reviewerId, rating_id, comment]
      );

      return {
        review_id: result.insertId,
        task_id,
        reviewerId,
        rating_id,
        comment,
        createdAt: new Date().toISOString(),
      };
    },
    incrementProfileView: async (_, { user_id }) => {
      try {
        const result = await db.query(
          'UPDATE users SET profile_views = profile_views + 1 WHERE user_id = ?',
          [user_id]
        );

        if (result.affectedRows === 0) {
          throw new Error('User not found or no changes made.');
        }

        return 'Profile view count updated successfully.';
      } catch (error) {
        console.error('Error updating profile views:', error);
        throw new Error('Error updating profile views.');
      }
    },
    

    async incrementProfileViews(_, { firebaseUid }) {
      try {
        await db.execute(
          `UPDATE users SET profile_views = profile_views + 1 WHERE firebase_uid = ?`,
          [firebaseUid]
        );
        return { success: true, message: "Profile view count updated" };
      } catch (error) {
        console.error("Error updating profile views:", error);
        return { success: false, message: "Error updating profile views" };
      }
    },
    async assignUserRole(_, { userId, role }) {
      try {
        // Update user role in MySQL
        const [result] = await db.execute(
          `UPDATE users SET role = ? WHERE firebase_uid = ?`,
          [role, userId]
        );

        if (result.affectedRows === 0) {
          throw new Error("User not found");
        }

        console.log(`User ${userId} role updated to ${role}`);
        return { id: userId, role };
      } catch (error) {
        console.error("Error assigning user role:", error);
        return null;
      }
    },
    async registerUser(_, { username, phoneNumber, password, first_name, last_name, email, NIN, birthDate, gender, user_type  }) {
      try {
        // Validate phone number format
        if (!isValidE164(phoneNumber)) {
          return { success: false, message: "Invalid phone number format. It must be a non-empty E.164 standard compliant identifier string." };
        }
       // Validate NIN format
       if (!isValidNIN(NIN)) {
        return { success: false, message: "Invalid NIN format. It must be a valid 11-digit number." };
        }
 // Hash the password
 const hashedPassword = await bcrypt.hash(password, 10);

        // Create user in Firebase Authentication
        const userRecord = await auth.createUser({
          phoneNumber,
          password: hashedPassword,
          email,
          first_name,
          last_name,
          NIN,
          birthDate,
          gender,
          user_type,
          displayName: username,
        });
        
        const userData = {
          firebase_uid: userRecord.uid,
          username,
          phoneNumber,
          email,
          first_name,
          last_name,
          NIN,
          birthDate,
          gender,
          user_type,
          password: hashedPassword,
        };

         // Save user data to Firebase
         await saveUserToFirebase(userRecord.uid, userData);

         // Save user data to MySQL
         await saveUserToMySQL(userData);

        console.log("User successfully registered:", userRecord.uid);
        return { success: true, message: "User registered successfully" };
      } catch (error) {
        console.error("Error registering user:", error);
        return { success: false, message: "Registration failed" };
      }
    },
  },
};
export default resolvers;