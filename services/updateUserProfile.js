import { pool } from 'config.js'; // MySQL connection pool

/**
 * Add or update user profile in MySQL
 * @param {string} firebaseUid - The Firebase UID of the user
 * @param {Object} profileData - The user's profile data
 */
export async function updateUserProfileInMySQL(firebaseUid, profileData) {
  try {
    const { profile, skills, ratings, reviews, portfolio, profilePicture } = profileData;

    const query = `
      INSERT INTO users (firebase_uid, profile, skills, ratings, reviews, portfolio, profile_picture, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        profile = VALUES(profile),
        skills = VALUES(skills),
        ratings = VALUES(ratings),
        reviews = VALUES(reviews),
        portfolio = VALUES(portfolio),
        profile_picture = VALUES(profile_picture),
        updated_at = NOW();
    `;

    const values = [
      firebaseUid,
      profile || null,
      JSON.stringify(skills || []),
      ratings || 0,
      JSON.stringify(reviews || []),
      JSON.stringify(portfolio || []),
      profilePicture || null,
    ];

    await pool.query(query, values);
    console.log('User profile updated in MySQL!');
  } catch (error) {
    console.error('Error updating user profile in MySQL:', error);
    throw new Error('Failed to update user profile in MySQL');
  }
}
