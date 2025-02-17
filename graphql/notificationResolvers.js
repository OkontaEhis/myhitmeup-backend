import {
  getNotifications,
  getNotificationById,
  createNotification,
  markNotificationAsRead,
} from './services/notificationService.js';

const resolvers = {
  Query: {
    getNotifications: async (_, { userId }) => {
      return await getNotifications(userId);
    },
    getNotificationById: async (_, { userId, notificationId }) => {
      return await getNotificationById(userId, notificationId);
    },
  },
  Mutation: {
    createNotification: async (_, { userId, message, type, additionalData }) => {
      return await createNotification(userId, message, type, additionalData);
    },
    markNotificationAsRead: async (_, { userId, notificationId }) => {
      await markNotificationAsRead(userId, notificationId);
      return true;
    },
  },
};

export default resolvers;
