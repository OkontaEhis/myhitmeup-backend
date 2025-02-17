//import { gql } from 'graphql-tag';
import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  enum ContentType {
    POST
    COMMENT
  }

  enum ReportStatus {
    PENDING
    REVIEWED
    REJECTED
  }
  type Post {
    id: ID!
    userId: ID!
    content: String!
    mediaUrls: [String]
    reactions: [Reaction]
    createdAt: String!
    updatedAt: String!
  }

  type Reaction {
    id: ID!
    postId: ID!
    userId: ID!
    type: String!
    createdAt: String!
  }

  type Report {
    id: ID!
    status: ReportStatus!
    createdBy: User!
    createdAt: String!
    updatedAt: String!
  }

  type User {
    user_id: ID!
    username: String!
    phoneNumber: String!
    gender: String!
    birthDate: String!
    first_name: String!
    last_name: String!
    email: String!
    createdAt: String!
    updatedAt: String!
    firebaseUid: String!
    role: String
    profileViews: Int
  }

  type Task {
    task_id: ID!
    title: String!
    description: String!
    createdBy: User!
    createdAt: String!
    updatedAt: String!
  }

  type Review {
    review_id: ID!
    task_id: ID!
    reviewerId: ID!
    rating_id: ID!
    comment: String
    created_at: String
  }
    
  type Bid {
    id: ID!
    bid_id: ID!
    user_id: ID!
    message: String!
    attachments: [String]
  }

  type AnalyticsProvider {
    profileViews: Int!
    tasksCompleted: Int!
  }

  type AnalyticsSeeker {
    taskerHired: Int!
    totalSpent: Float!
    savedTasks: [Task!]
  }
type AuthResponse {
    success: Boolean!
    message: String!
  }

  input CreatePostInput {
    title: String!
    content: String!
    authorId: ID!
  }

  input AddReactionInput {
    postId: ID!
    reaction: String!
  }

  input CreateReportInput {
    status: ReportStatus!
    createdBy: ID!
  }

  input UpdateReportStatusInput {
    reportId: ID!
    status: ReportStatus!
  }

  input CreateReviewInput {
    task_id: ID!
    reviewerId: ID!
    rating_id: ID!
    comment: String
  }
 input CreateBidInput {
    bid_id: ID!
    user_id: ID!
    message: String!
    attachments: [String]
  }
  type Query {
    getPosts: [Post]
    getPostById(id: ID!): Post
    getReports(status: ReportStatus): [Report!]
    getUsersByRole(role: String!): [User!]
    recommendTask(user_id: ID!): [Task!]!
    getReviews(task_id: ID!): [Review]
    getProviderAnalytics(user_id: ID!): AnalyticsProvider
    getSeekerAnalytics(user_id: ID!): AnalyticsSeeker
    getUserbyId(user_id: ID!): User 
    getUser(firebase_uid: ID!): User
  }

  type Mutation {
    createPost(input: CreatePostInput!): Post
    addReaction(input: AddReactionInput!): Post
    tagUsers(postId: ID!, taggedUserIds: [ID]!): Post
    createReport(input: CreateReportInput!): Report!
    updateReportStatus(input: UpdateReportStatusInput!): Report!
    createReview(input: CreateReviewInput!): Review!
    incrementProfileView(user_id: ID!): String!
    registerUser(username: String!, phoneNumber: String!, password: String!, email: String!, NIN: Float!, gender: String!, user_type: String!, birthDate: String!, first_name: String!, last_name:String!): AuthResponse
    assignUserRole(userId: ID!, role: String!): User
    incrementProfileViews(firebase_uid: ID!): AuthResponse
    createBid(input: CreateBidInput!): Bid!  
  }
`;
