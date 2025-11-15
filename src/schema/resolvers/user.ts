import { userService } from '../../services/userService.js';

export const userResolvers = {
  Query: {
    // Get single user by ID - pass-through to user service
    async user(_: any, { id }: { id: string }) {
      return await userService.getUserById(id);
    },

    // Get list of users with pagination - pass-through to user service
    async users(_: any, { limit, offset }: { limit: number; offset: number }) {
      return await userService.getUsers({ limit, offset });
    },
  },

  Mutation: {
    // Create new user - pass-through to user service
    async createUser(_: any, { input }: { input: any }) {
      return await userService.createUser(input);
    },

    // Update user - pass-through to user service
    async updateUser(_: any, { id, input }: { id: string; input: any }) {
      return await userService.updateUser(id, input);
    },

    // Delete user - pass-through to user service
    async deleteUser(_: any, { id }: { id: string }) {
      return await userService.deleteUser(id);
    },
  },
};