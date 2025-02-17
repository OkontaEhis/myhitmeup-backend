import express from 'express';
import { createHandler } from 'graphql-http/lib/use/express';
import schema from './graphql/schema.js';
import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./graphql/schema.js";
//Import all resolvers, including notifications    
import dotenv from 'dotenv';
import logger from './middleware/logger.js';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
//import { syncFirebaseToMySQL } from './middleware/syncMiddleware.js';
import { resolvers } from './graphql/resolvers.js';

// Load environment variables
dotenv.config();

try {
  // Initialize Firebase Admin SDK
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(readFileSync('./config/firebaseServiceAccount.json', 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
    console.log('Firebase initialized!');
  }

  // Debug: Log initialized Firebase apps
  console.log('Firebase apps:', admin.apps);

} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1); // Exit the process if Firebase initialization fails
}

// Initialize Firestore
const firestore = admin.firestore();

// Fetch Firestore data for testing
async function fetchFirebaseData() {
  try {
    const notificationsSnapshot = await firestore.collection('notifications').get();
    const messagesSnapshot = await firestore.collection('messages').get();
    const EmailSnapshot = await firestore.collection('email_services').get();

    const notificationsData = [];
    for (const doc of notificationsSnapshot.docs) {
      const userNotificationsSnapshot = await doc.ref.collection('user_notifications').get();
      const userNotificationsData = [];
      userNotificationsSnapshot.forEach(userDoc => {
        userNotificationsData.push({ notificationId: userDoc.id, ...userDoc.data() });
      });
      notificationsData.push({ id: doc.id, userNotifications: userNotificationsData });
    }

    const messagesData = [];
    messagesSnapshot.forEach(doc => {
      messagesData.push({ id: doc.id, ...doc.data() });
    });

    const EmailData = [];
    EmailSnapshot.forEach(doc => {
      EmailData.push({ id: doc.id, ...doc.data() });
    });

    console.log('Fetched notifications from Firebase:', JSON.stringify(notificationsData, null, 2));
    console.log('Fetched messages from Firebase:', messagesData);
    console.log('Fetched messages from Firebase:', EmailData);
  } catch (error) {
    console.error('Error fetching data from Firestore:', error);
  }
}

// Call the fetchFirebaseData function
fetchFirebaseData();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
if (logger) app.use(logger); // Logger middleware
// Setup Apollo Server
const server = new ApolloServer({ typeDefs, resolvers });
await server.start();
server.applyMiddleware({ app });

app.use('/graphql', createHandler({
  schema: {
    typeDefs,
    resolvers,
  },
  graphiql: true, // Enable GraphiQL for testing
}));

// GraphQL Endpoint
app.use('/graphql', createHandler({
  schema: schema,
  graphiql: true, // Enable GraphiQL for testing
}));

app.post('/syncProfile', async (req, res) => {
  const { firebase_uid, profileData } = req.body;

  try {
    await syncFirebaseToMySQL(firebase_uid, profileData);
    res.status(200).send('Profile synchronized successfully!');
  } catch (error) {
    res.status(500).send('Failed to synchronize profile');
  }
});

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}/graphql`));