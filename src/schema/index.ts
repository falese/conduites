import { createSchema } from 'graphql-yoga';
import { userResolvers } from './resolvers/user.js';
import { productResolvers } from './resolvers/product.js';
import { notificationResolvers } from './resolvers/notification.js';

// GraphQL Type Definitions
const typeDefs = `
  # User Types
  type User {
    id: ID!
    email: String!
    name: String!
    avatar: String
    createdAt: String!
    updatedAt: String!
  }

  input UserInput {
    email: String!
    name: String!
    avatar: String
  }

  # Product Types
  type Product {
    id: ID!
    name: String!
    description: String
    price: Float!
    category: String!
    imageUrl: String
    inStock: Boolean!
    createdAt: String!
  }

  input ProductInput {
    name: String!
    description: String
    price: Float!
    category: String!
    imageUrl: String
    inStock: Boolean = true
  }

  # Notification Types
  type Notification {
    id: ID!
    userId: ID!
    type: NotificationType!
    title: String!
    message: String!
    read: Boolean!
    createdAt: String!
  }

  enum NotificationType {
    INFO
    WARNING
    SUCCESS
    ERROR
  }

  input NotificationInput {
    userId: ID!
    type: NotificationType!
    title: String!
    message: String!
  }

  # Root Types
  type Query {
    # User queries
    user(id: ID!): User
    users(limit: Int = 10, offset: Int = 0): [User!]!
    
    # Product queries
    product(id: ID!): Product
    products(category: String, limit: Int = 10, offset: Int = 0): [Product!]!
    
    # Notification queries
    notifications(userId: ID!, limit: Int = 10, offset: Int = 0): [Notification!]!
    unreadNotificationCount(userId: ID!): Int!
  }

  type Mutation {
    # User mutations
    createUser(input: UserInput!): User!
    updateUser(id: ID!, input: UserInput!): User!
    deleteUser(id: ID!): Boolean!
    
    # Product mutations
    createProduct(input: ProductInput!): Product!
    updateProduct(id: ID!, input: ProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
    
    # Notification mutations
    createNotification(input: NotificationInput!): Notification!
    markNotificationAsRead(id: ID!): Notification!
    deleteNotification(id: ID!): Boolean!
  }

  # Health check query for K8s readiness/liveness probes
  type HealthCheck {
    status: String!
    timestamp: String!
    services: [ServiceHealth!]!
  }

  type ServiceHealth {
    name: String!
    status: String!
    responseTime: Float
  }

  extend type Query {
    health: HealthCheck!
  }
`;

// Combine all resolvers
const resolvers = {
  Query: {
    ...userResolvers.Query,
    ...productResolvers.Query,
    ...notificationResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...productResolvers.Mutation,
    ...notificationResolvers.Mutation,
  },
};

export const schema = createSchema({
  typeDefs,
  resolvers,
});