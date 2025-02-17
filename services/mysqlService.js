import db from '../db.js';
import dotenv from 'dotenv';

dotenv.config();

export const saveUserToMySQL = async (userData) => {
  try {
    const { firebase_uid, username, phoneNumber, email, first_name, last_name, NIN, birthDate, gender, user_type, password } = userData;

    if (!firebase_uid) {
      throw new Error("firebase_uid is undefined or missing!");
    }

    // Check for undefined values and set them to null if necessary
    const values = [
      firebase_uid || null,
      username || null,
      phoneNumber || null,
      email || null,
      first_name || null,
      last_name || null,
      NIN || null,
      birthDate || null,
      gender || null,
      user_type || null,
      password || null
    ];
    const sql = `
      INSERT INTO users (firebase_uid, username, phone_number, email, first_name, last_name, NIN, birthDate, gender, user_type, password) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    

    await db.execute(sql, values);
    
    console.log("User saved to MySQL:", firebase_uid);
  } catch (error) {
    console.error("Error saving user to MySQL:", error);
    throw error;
  }
};
