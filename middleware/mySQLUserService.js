import { updateUserProfileInMySQL } from '../services/mysqlUserService.js';

/**
 * Middleware to sync Firebase updates with MySQL
 */
export async function syncFirebaseToMySQL(userId, profileData) {
  try {
    await updateUserProfileInMySQL(userId, profileData);
    console.log('Synchronized Firebase with MySQL');
  } catch (error) {
    console.error('Error synchronizing Firebase with MySQL:', error);
  }
}
