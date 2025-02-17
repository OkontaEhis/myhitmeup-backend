import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';

const storage = getStorage();

/**
 * Upload a profile picture for a user
 * @param {string} userId - The ID of the user
 * @param {Buffer} fileBuffer - The profile picture file buffer
 * @param {string} mimeType - The MIME type of the file
 * @returns {string} - The URL of the uploaded profile picture
 */
export async function uploadProfilePicture(userId, fileBuffer, mimeType) {
  try {
    const bucket = storage.bucket();
    const fileName = `profilePictures/${userId}_${uuidv4()}`;
    const file = bucket.file(fileName);

    // Upload the file
    await file.save(fileBuffer, { contentType: mimeType });
    await file.makePublic();

    const publicUrl = file.publicUrl();
    console.log('Profile picture uploaded successfully:', publicUrl);

    // Update user's profile with the picture URL
    await updateUserProfile(userId, { profilePicture: publicUrl });

    return publicUrl;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw new Error('Failed to upload profile picture');
  }
}
