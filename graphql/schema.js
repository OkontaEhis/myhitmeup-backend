//graphql/schema.js
import { GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLList, GraphQLInt, GraphQLFloat, GraphQLScalarType, Kind, GraphQLBoolean } from 'graphql';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
//import { Timestamp } from 'firebase-admin/firestore'; 
import admin from 'firebase-admin'; // Firebase Admin SDK
import { sendMessage } from '../services/messagingService.js';
import { createNotification } from '../services/notificationService.js';
//import { getUserProfileFromMySQL, updateUserProfileInMySQL } from '../services/mysqlUserService.js';
//import { updateUserProfile } from '../services/firebaseUserService.js';
import { notifyNewMessage } from '../services/notificationService.js';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './typeDefs.js';
import { resolvers } from './resolvers.js';
import { gql } from 'apollo-server-express';

dotenv.config();

// Check environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
        throw new Error(`Missing environment variable: ${key}`);
    }
});

const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });
  
// Create a MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

const firestore = admin.firestore();

// Custom Timestamp Scalar
const Timestamp = new GraphQLScalarType({
    name: 'Timestamp',
    description: 'A custom scalar type for timestamps',
    parseValue(value) {
        // Convert incoming integer (timestamp) to Date
        return new Date(value); // value from the client
    },
    serialize(value) {
        // Convert outgoing Date to integer (timestamp)
        return value.getTime(); // value sent to the client
    },
    parseLiteral(ast) {
        if (ast.kind === Kind.INT) {
            return new Date(parseInt(ast.value, 10)); // ast value is always in string format
        }
        return null; // Invalid hard-coded value (not an integer)
    },
});
// User Type Definition
const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        user_id: { type: GraphQLInt },
        username: { type: GraphQLString },
        password: { type: GraphQLString },
        firstname: { type: GraphQLString },
        lastname: { type: GraphQLString },
        custom_status: { type: GraphQLString },
        user_type: { type: GraphQLString },
        status: { type: GraphQLString }, // Expecting 'active' or 'offline'
        profile:{type: GraphQLString},
        location: { type: GraphQLString },
        role_id:{type: GraphQLInt},
        NIN: { type: GraphQLString },
        birthDate: { type: GraphQLString },
        gender: { type: GraphQLString },
        phoneNumber: { type: GraphQLString },
        email: { type: GraphQLString },
        created_at: { type: Timestamp },
    }),
});

// Task Type Definition
const TaskType = new GraphQLObjectType({
    name: 'Task',
    fields: () => ({
        task_id: { type: GraphQLInt },
        title: { type: GraphQLString },
        description: { type: GraphQLString },
        price: { type: GraphQLFloat }, // For DECIMAL(10,2)
        status: { type: GraphQLString },
        created_at: { type: Timestamp },
        location: { type: GraphQLString },
        user_id: { type: GraphQLInt }, // Assuming a user owns the task
    }),
    
});

//bid type definition
const BidType = new GraphQLObjectType({
    name: 'Bid',
    fields: () => ({
        bid_id: { type: GraphQLInt },
        task_id: { type: GraphQLInt },
        user_id: { type: GraphQLInt },
        bid_amount: { type: GraphQLFloat },
        status: { type: GraphQLString },
        created_at: { type: Timestamp }, // Optional: if you want to track when the bid was created
    }),
});

//transaction type definition
const TransactionType = new GraphQLObjectType({
    name: 'Transaction',
    fields: () => ({
        transaction_id: { type: GraphQLInt },
        user_id: { type: GraphQLInt },
        task_id: { type: GraphQLInt }, // Assuming a task is associated with the transaction
        amount: { type: GraphQLFloat },
        transaction_type: { type: GraphQLString },
        status: { type: GraphQLString },
        Timestamp: { type: Timestamp }, // Optional: if you want to track when the transaction was created
    }),
});

//ratingstype 
const RatingType = new GraphQLObjectType({
    name: 'Rating',
    fields: () => ({
        rating_id: { type: GraphQLInt },
        task_id: { type: GraphQLInt }, // ID of the task being rated
        reviewer_id: { type: GraphQLInt }, // ID of the user who gave the rating
        reviewee_id: { type: GraphQLInt }, // ID of the user whom the review is about 
        rating: { type: GraphQLFloat }, // Rating score (e.g., 1 to 5)
        role: { type: GraphQLString }, // ID of the user who gave the rating
        review: { type: GraphQLString }, // Optional comment
        created_at: { type: Timestamp }, // Optional: timestamp of when the rating was created
    }),
});


//messaging type
//const sendMessage = new GraphQLObjectType({
    //name: 'Message',
    //fields: {
     //   message_id: { type: GraphQLString },
     //   sender_id: { type: GraphQLString },
     //   receiver_id: { type: GraphQLString },
     //   content: { type: GraphQLString },
     //   timestamp: { type: GraphQLString },
   // },
//});



// Root Query
const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        //getUserProfile: async (_, { firebaseUid }) => {
          //  return await getUserProfileFromMySQL(firebaseUid);
          //},
        user: {
            type: UserType,
            args: { user_id: { type: GraphQLInt } },
            resolve: async (_, args) => {
                try {
                    const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [args.user_id]);
                    return rows[0]; // Return the first user found
                } catch (error) {
                    console.error('Database query error:', error);
                    throw new Error('Database query failed');
                }
            },
        },
        users: {
            type: new GraphQLList(UserType),
            resolve: async () => {
                try {
                    const [rows] = await pool.query('SELECT * FROM users');
                    return rows; // Return all users
                } catch (error) {
                    console.error('Database query error:', error);
                    throw new Error('Database query failed');
                }
            },
        },
        task: {
            type: TaskType,
            args: { task_id: { type: GraphQLInt } },
            resolve: async (_, args) => {
                try {
                    const [rows] = await pool.query('SELECT * FROM task WHERE task_id = ?', [args.task_id]);
                    return rows[0];
                } catch (error) {
                    console.error('Database query error:', error);
                    throw new Error('Database query failed');
                }
            },
        },
        tasks: {
            type: new GraphQLList(TaskType),
            resolve: async () => {
                try {
                    const [rows] = await pool.query('SELECT * FROM task');
                    return rows;
                } catch (error) {
                    console.error('Database query error:', error);
                    throw new Error('Database query failed');
                }
            },
        },
        bid: {
            type: BidType,
            args: { bid_id: { type: GraphQLInt } },
            resolve: async (_, args) => {
                // Logic to fetch a bid by ID from the database
                const [rows] = await pool.query('SELECT * FROM bid WHERE bid_id = ?', [args.bid_id]);
                return rows[0]; // Return the first bid found
            },
        },
        bidsByTask: {
            type: new GraphQLList(BidType),
            args: { task_id: { type: GraphQLInt } },
            resolve: async (_, args) => {
                // Logic to fetch all bids for a specific task
                const [rows] = await pool.query('SELECT * FROM bid WHERE task_id = ?', [args.task_id]);
                return rows; // Return all bids for the task
            },
        },
        bids: {
            type: new GraphQLList(BidType),
            resolve: async () => {
                // Logic to fetch all bids
                const [rows] = await pool.query('SELECT * FROM bid');
                return rows; // Return all bids
            },
        },

        transaction: {
            type: TransactionType,
            args: { transaction_id: { type: GraphQLInt } },
            resolve: async (_, args) => {
                // Logic to fetch a transaction by ID from the database
                const [rows] = await pool.query('SELECT * FROM transaction WHERE transaction_id = ?', [args.transaction_id]);
                return rows[0]; // Return the first transaction found
            },
        },
        transactions: {
            type: new GraphQLList(TransactionType),
            resolve: async () => {
                // Logic to fetch all transactions
                const [rows] = await pool.query('SELECT * FROM transaction');
                return rows; // Return all transactions
            },
        },
        rating: {
            type: RatingType,
            args: { rating_id: { type: GraphQLInt } },
            resolve: async (_, args) => {
                // Logic to fetch a rating by ID from the database
                const [rows] = await pool.query('SELECT * FROM ratings WHERE rating_id = ?', [args.rating_id]);
                return rows[0]; // Return the first rating found
            },
        },
        ratingsByTask: {
            type: new GraphQLList(RatingType),
            args: { task_id: { type: GraphQLInt } },
            resolve: async (_, args) => {
                // Logic to fetch all ratings for a specific task
                const [rows] = await pool.query('SELECT * FROM ratings WHERE task_id = ?', [args.task_id]);
                return rows; // Return all ratings for the task
            },
        },
        ratings: {
            type: new GraphQLList(RatingType),
            resolve: async () => {
                // Logic to fetch all ratings
                const [rows] = await pool.query('SELECT * FROM ratings');
                return rows; // Return all ratings
            },
        },
       
  
    },
});

// Mutations
const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        //updateUserProfile: async (_, { firebaseUid, profileData }) => {
            // Update in Firebase
           // await updateUserProfile(firebaseUid, profileData);
      
            // Update in MySQL
           // await updateUserProfileInMySQL(firebaseUid, profileData);
      
           // return true;
          //},
        registerUser: {    //add or create user
            type: UserType,
            args: {
                username: { type: GraphQLString },
                firstname: { type: GraphQLString },
                lastname: { type: GraphQLString },
                phoneNumber: { type: GraphQLString },
                password: { type: GraphQLString },
                NIN: { type: GraphQLFloat},
                birthDate: { type: GraphQLString },
                email: { type: GraphQLString },
            },
            resolve: async (_, args) => {
                try {
                    const hashedPassword = await hash(args.password, 10); // Hash the password
                    const result = await pool.query('INSERT INTO users (username,first_name, last_name, phone_number, password, email, NIN, birtDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                         [args.username, args.firstname, args.lastname, args.phoneNumber, hashedPassword, args.email, args.NIN, args.birthDate]);
                    return { user_id: result[0].insertId, username: args.username, firstname: args.firstname, 
                           lastname: args.lastname, phoneNumber:args.phoneNumber, hashedPassword:hashedPassword, email:args.email, NIN:args.NIN,birthDate:args.birthDate }; // Return the newly created user
                } catch (error) {
                    console.error('Database query error:', error);
                    throw new Error('Database query failed');
                }
            },
        },
        async sendMessage(_, { senderId, receiverId, content }) {
      // Your existing logic to save the message
      await saveMessageToDatabase(senderId, receiverId, content);

      // Notify the receiver
      await notifyNewMessage(senderId, receiverId, content);

      return true; // Return success
    },
         
        updateUser:  {    //update user
            type: UserType,
            args: {
                user_id: { type: GraphQLInt },
                firstname: { type: GraphQLString },
                lastname: { type: GraphQLString },
                phoneNumber: { type: GraphQLString },
                email: { type: GraphQLString },
            },
            resolve: async (_, args) => {
                 // Step 1: Validate input
        if (!args.user_id) {
            throw new Error('User  ID is required');
        }
        // Step 2: Check if user exists
        const [existingUser ] = await pool.query('SELECT * FROM users WHERE user_id = ?', [args.user_id]);
        if (existingUser .length === 0) {
            throw new Error('User  not found');
        }
        // Step 3: Validate unique fields (e.g., email)
        if (args.email) {
            const [emailCheck] = await pool.query('SELECT * FROM users WHERE email = ? AND user_id != ?', [args.email, args.user_id]);
            if (emailCheck.length > 0) {
                throw new Error('Email is already in use');
            }
        }
                // Logic to update user information
                const [result] = await pool.query('UPDATE users SET firstname = ?, lastname = ?, phoneNumber = ?, email = ? WHERE user_id = ?', 
                [args.firstname, args.lastname, args.phoneNumber, args.email, args.user_id]);
                if (result.affectedRows === 0) {
                    throw new Error('User  not found');
                }
                return { user_id: args.user_id, firstname: args.firstname, 
                    lastname: args.lastname, phoneNumber: args.phoneNumber, email: args.email }; // Return the updated user
            },
        },

        deleteUser:  {    //delete user
            type: UserType, // You can return the deleted user or a success message
            args: {
                user_id: { type: GraphQLInt }, // Argument to specify which user to delete
            },
            resolve: async (_, args) => {
                // Step 1: Validate input
                if (!args.user_id) {
                    throw new Error('User  ID is required');
                }
                // Step 2: Check if user exists
                const [existingUser ] = await pool.query('SELECT * FROM users WHERE user_id = ?', [args.user_id]);
                if (existingUser .length === 0) {
                    throw new Error('User  not found');
                }
                // Step 3: Delete user from the database
                const [result] = await pool.query('DELETE FROM users WHERE user_id = ?', [args.user_id]);
                if (result.affectedRows === 0) {
                    throw new Error('Delete failed');
                }
                // Step 4: Return a success message or the deleted user data
                return { user_id: args.user_id }; // Optionally return the deleted user ID
            },
        },

        addTask: {   //create task
            type: TaskType,
            args: {
                title: { type: GraphQLString },
                description: { type: GraphQLString },
                price: { type: GraphQLFloat },
                status: { type: GraphQLString },
                user_id: { type: GraphQLInt },
            },
            resolve: async (_, args) => {
                try {
                    const result = await pool.query(
                        'INSERT INTO tasks (title, description, price, status, user_id) VALUES (?, ?, ?, ?, ?)',
                        [args.title, args.description, args.price, args.status, args.user_id]
                    );
                    return { task_id: result[0].insertId, ...args };
                } catch (error) {
                    console.error('Database query error:', error);
                    throw new Error('Database query failed');
                }
            },
        },
        updateTask: { //update user
            type: TaskType,
            args: {
                task_id: { type: GraphQLInt },
                title: { type: GraphQLString },
                description: { type: GraphQLString },
                status: { type: GraphQLString },
                price: { type: GraphQLFloat },
            },
            resolve: async (_, args) => {
                try {
                    await pool.query(
                        'UPDATE tasks SET title = ?, description = ?, status = ?, price = ? WHERE task_id = ?',
                        [args.title, args.description, args.status, args.price, args.task_id]
                    );
                    return args; // Return updated task data
                } catch (error) {
                    console.error('Database query error:', error);
                    throw new Error('Database query failed');
                }
            },
        },
        deleteTask: { //delete task
            type: TaskType,
            args: {
                task_id: { type: GraphQLInt },
            },
            resolve: async (_, args) => {
                try {
                    const [rows] = await pool.query('DELETE FROM tasks WHERE task_id = ?', [args.task_id]);
                    if (rows.affectedRows === 0) {
                        throw new Error('Task not found');
                    }
                    return { task_id: args.task_id };
                } catch (error) {
                    console.error('Database query error:', error);
                    throw new Error('Database query failed');
                }
            },
        },
        createBid: {
            type: BidType,
            args: {
                task_id: { type: GraphQLInt },
                user_id: { type: GraphQLInt },
                bid_amount: { type: GraphQLFloat },
            },
            resolve: async (_, args) => {
                // Logic to create a new bid in the database
                const [result] = await pool.query('INSERT INTO bid (task_id, user_id, bid_amount) VALUES (?, ?, ?)', [args.task_id, args.user_id, args.bid_amount]);
                return { bid_id: result.insertId, task_id:args.task_id,user_id:args.user_id, bid_amount:args.bid_amount }; // Return the newly created bid
            },
        },
        updateBid: {
            type: BidType,
            args: {
                bid_id: { type: GraphQLInt },
                bid_amount: { type: GraphQLFloat },
            },
            resolve: async (_, args) => { //update bid 
                // Logic to update a bid in the database
                const [result] = await pool.query('UPDATE bid SET bid_amount = ? WHERE bid_id = ?', [args.bid_amount, args.bid_id]);
                if (result.affectedRows === 0) {
                    throw new Error('Bid not found');
                }
                return { bid_id: args.bid_id, bid_amount: args.bid_amount }; // Return the updated bid
            },
        },
        deleteBid: {
            type: BidType,
            args: {
                bid_id: { type: GraphQLInt },
            },
            resolve: async (_, args) => {
                // Logic to delete a bid from the database
                const [result] = await pool.query('DELETE FROM bid WHERE bid_id = ?', [args.bid_id]);
                if (result.affectedRows === 0) {
                    throw new Error('Bid not found');
                }
                return { bid_id: args.bid_id }; // Return the deleted bid ID
            },
        },

        createTransaction: {
            type: TransactionType,
            args: {
                user_id: { type: GraphQLInt },
                task_id: { type: GraphQLInt },
                amount: { type: GraphQLFloat },
                transaction_type: { type: GraphQLString },
                status: { type: GraphQLString },
            },
            resolve: async (_, args) => {
                // Logic to create a new transaction in the database
                const [result] = await pool.query('INSERT INTO transaction (user_id, task_id, amount, transaction_type, status) VALUES (?, ?, ?, ?, ?)', 
                [args.user_id, args.task_id, args.amount, args.transaction_type, args.status]);
                return { transaction_id: result.insertId, user_id:args.user_id, task_id:args.task_id,
                     amount: args.amount, transaction_type:args.transaction_type, status:args.status }; // Return the newly created transaction
            },
        },
        updateTransaction: {
            type: TransactionType,
            args: {
                transaction_id: { type: GraphQLInt },
                amount: { type: GraphQLFloat },
                transaction_type: { type: GraphQLString },
                status: { type: GraphQLString },
            },
            resolve: async (_, args) => {
                // Logic to update a transaction in the database
                const [result] = await pool.query('UPDATE transaction SET amount = ?, transaction_type = ?, status = ? WHERE transaction_id = ?', 
                [args.amount, args.transaction_type, args.status, args.transaction_id]);
                if (result.affectedRows === 0) {
                    throw new Error('Transaction not found');
                }
                return { transaction_id: args.transaction_id, amount:args.amount, transaction_type:args.transaction_type, status:args.status }; // Return the updated transaction
            },
        },
        deleteTransaction: {
            type: TransactionType,
            args: {
                transaction_id: { type: GraphQLInt },
            },
            resolve: async (_, args) => {
                // Logic to delete a transaction from the database
                const [result] = await pool.query('DELETE FROM transaction WHERE transaction_id = ?', [args.transaction_id]);
                if (result.affectedRows === 0) {
                    throw new Error('Transaction not found');
                }
                return { transaction_id: args.transaction_id }; // Return the deleted transaction ID
            },
        },
        createRating: {
            type: RatingType,
            args: {
                user_id: { type: GraphQLInt },
                task_id: { type: GraphQLInt },
                score: { type: GraphQLFloat },
                comment: { type: GraphQLString },
            },
            resolve: async (_, args) => {
                // Logic to create a new rating in the database
                const [result] = await pool.query('INSERT INTO ratings (user_id, task_id, score, comment) VALUES (?, ?, ?, ?)', 
                [args.user_id, args.task_id, args.score, args.comment]);
                return { rating_id: result.insertId, ...args }; // Return the newly created rating
            },
        },
        updateRating: {
            type: RatingType,
            args: {
                rating_id: { type: GraphQLInt },
                score: { type: GraphQLFloat },
                comment: { type: GraphQLString },
            },
            resolve: async (_, args) => {
                // Logic to update a rating in the database
                const [result] = await pool.query('UPDATE ratings SET score = ?, comment = ? WHERE rating_id = ?', 
                [args.score, args.comment, args.rating_id]);
                if (result.affectedRows === 0) {
                    throw new Error('Rating not found');
                }
                return { rating_id: args.rating_id, ...args }; // Return the updated rating
            },
        },
        deleteRating: {
            type: RatingType,
            args: {
                rating_id: { type: GraphQLInt },
            },
            resolve: async (_, args) => {
                // Logic to delete a rating from the database
                const [result] = await pool.query('DELETE FROM ratings WHERE rating_id = ?', [args.rating_id]);
                if (result.affectedRows === 0) {
                    throw new Error('Rating not found');
                }
                return { rating_id: args.rating_id }; // Return the deleted rating ID
            },
        },
        sendMessage: {
            type: GraphQLString, // Return the message ID
            args: {
              document_id: { type: GraphQLString },
              senderId: { type: GraphQLString },
              receiverId: { type: GraphQLString },
              text: { type: GraphQLString },
            },
            resolve: async (_, { document_id, senderId, receiverId, text }) => {
              try {
                const messageId = await sendMessage(document_id, senderId, receiverId, text);
                return messageId; // Return the generated message ID
              } catch (error) {
                console.error('Error sending message:', error);
                throw new Error('Failed to send message');
              }
            },
          },
          createNotification: {
            type: GraphQLString, // Return the message ID
            args: {
              id: { type: GraphQLString },
              userId: { type: GraphQLString },
              message: { type: GraphQLString },
              type: { type: GraphQLString },
              read: { type: GraphQLBoolean },
            },
            resolve: async (_, { userId, type, message, additionalData, }) => {
              try {
                const notificationId = await createNotification(userId, message, type, additionalData);
                return notificationId; // Return the generated message ID
              } catch (error) {
                console.error('Error sending notification:', error);
                throw new Error('Failed to send  notification');
              }
            },
          },
    },
});

// Export Schema
export default new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation,
});
export { schema, pool, typeDefs, resolvers };
