import admin from "firebase-admin";
import mysql from "mysql2/promise"; 
import * as functions from "firebase-functions";

// Initialize MySQL Connection
const db = await mysql.createConnection({
  host: "192.168.56.1",
  user: "ehijesumuan",
  password: "Ohis2005",
  database: "hitmeup_marketplace_db",
});

// Firebase Admin SDK initialization (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert("./config/firebaseServiceAccount.json"),
  });
}
exports.syncUserToMySQL = functions.firestore
  .document("users/{userId}")
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const newData = change.after.exists ? change.after.data() : null;

    if (!newData) {
      // If document is deleted, remove user from MySQL
      await db.execute(`DELETE FROM users WHERE firebase_uid = ?`, [userId]);
      console.log(`User ${userId} deleted from MySQL`);
    } else {
      // Insert or update user in MySQL
      await db.execute(
        `INSERT INTO users (firebase_uid, username, phoneNumber) VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE username = VALUES(username), phoneNumber = VALUES(phoneNumber)`,
        [userId, newData.username, newData.phoneNumber]
      );
      console.log(`User ${userId} synced with MySQL`);
    }
  });

export const resolvers = {
  Mutation: {
    async registerUser(_, { username, phoneNumber, password }) {
      try {
        // Create user in Firebase Authentication
        const userRecord = await admin.auth().createUser({
          phoneNumber,
          password,
          displayName: username,
        });

        // Insert user data into MySQL
        const [result] = await db.execute(
          `INSERT INTO users (firebase_uid, username, phoneNumber) VALUES (?, ?, ?)`,
          [userRecord.uid, username, phoneNumber]
        );

        console.log("User successfully registered:", userRecord.uid);
        return { success: true, message: "User registered successfully" };
      } catch (error) {
        console.error("Error registering user:", error);
        return { success: false, message: "Registration failed" };
      }
    },
  },
  
    Query: {
      async getUser(_, { user_id }) {
        try {
          // Get user from MySQL
          const [rows] = await db.execute(`SELECT * FROM users WHERE firebase_uid = ?`, [user_id]);
          if (rows.length === 0) throw new Error("User not found in MySQL");
  
          // Get user from Firebase
          const userRecord = await admin.auth().getUser(user_id);
  
          return {
            id: userRecord.uid,
            username: rows[0].username,
            phoneNumber: userRecord.phoneNumber,
            role: rows[0].role || "User",
          };
        } catch (error) {
          console.error("Error fetching user:", error);
          return null;
        }
      },
    },
};

