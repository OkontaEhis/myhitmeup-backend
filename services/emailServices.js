import nodemailer from 'nodemailer';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firestore
const firestore = getFirestore();

// Nodemailer Transporter Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can replace this with another provider (e.g., SMTP, SendGrid, etc.)
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or app-specific password
  },
});

/**
 * Send an email and save its details to Firestore
 * @param {string} userId - The ID of the user sending the email
 * @param {string} to - Recipient's email address
 * @param {string} subject - Email subject
 * @param {string} body - Email content
 */
export async function sendEmail(userId, to, subject, body) {
  try {
    // Send email using Nodemailer
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      text: body,
    };

    const emailInfo = await transporter.sendMail(mailOptions);
    console.log('Email sent:', emailInfo.messageId);

    // Save email details to Firestore
    const emailDocRef = await firestore.collection('email_services').add({
      userId,
      to,
      subject,
      body,
      status: 'sent', // Update based on success/failure
      createdAt: admin.firestore.Timestamp.now(),
    });

    console.log('Email saved to Firestore:', emailDocRef.id);
    return emailDocRef.id; // Return the email document ID
  } catch (error) {
    console.error('Error sending email:', error);

    // Log failed email to Firestore
    await firestore.collection('email_services').add({
      userId,
      to,
      subject,
      body,
      status: 'failed',
      createdAt: admin.firestore.Timestamp.now(),
    });

    throw new Error('Failed to send email');
  }
}

/**
 * Fetch emails for a specific user.
 * @param {string} userId - The ID of the user
 * @returns {Array<Object>} - List of emails
 */
export async function fetchUserEmails(userId) {
  try {
    const snapshot = await firestore.collection('email_services').where('userId', '==', userId).get();

    if (snapshot.empty) {
      console.log(`No emails found for userId: ${userId}`);
      return [];
    }

    const emails = [];
    snapshot.forEach(doc => emails.push({ id: doc.id, ...doc.data() }));

    console.log('Fetched emails from Firebase:', emails);
    return emails;
  } catch (error) {
    console.error('Error fetching emails from Firestore:', error);
    throw new Error('Failed to fetch emails');
  }
}
