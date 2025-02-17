/**
 * Fetch user profile from MySQL
 * @param {string} firebaseUid - The Firebase UID of the user
 * @returns {Object} - The user's profile data
 */
export async function getUserProfileFromMySQL(firebaseUid) {
    try {
      const query = 'SELECT * FROM users WHERE firebase_uid = ?';
      const [rows] = await pool.query(query, [firebaseUid]);
  
      if (rows.length === 0) {
        throw new Error('User profile not found in MySQL');
      }
  
      const user = rows[0];
      user.skills = JSON.parse(user.skills || '[]');
      user.reviews = JSON.parse(user.reviews || '[]');
      user.portfolio = JSON.parse(user.portfolio || '[]');
  
      console.log('Fetched user profile from MySQL:', user);
      return user;
    } catch (error) {
      console.error('Error fetching user profile from MySQL:', error);
      throw new Error('Failed to fetch user profile from MySQL');
    }
  }
  