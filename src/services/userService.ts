import { HttpClient } from './httpClient.js';
import { appConfig } from '../config/index.js';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserInput {
  email: string;
  name: string;
  avatar?: string;
}

interface GetUsersOptions {
  limit: number;
  offset: number;
}

class UserService {
  private client: HttpClient;

  constructor() {
    this.client = new HttpClient(appConfig.services.userService);
  }

  async getUserById(id: string): Promise<User> {
    const response = await this.client.get<User>(`/users/${id}`);
    
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch user');
    }
    
    return response.data;
  }

  async getUsers(options: GetUsersOptions): Promise<User[]> {
    const { limit, offset } = options;
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    const response = await this.client.get<User[]>(`/users?${queryParams}`);
    
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch users');
    }
    
    return response.data;
  }

  async createUser(input: UserInput): Promise<User> {
    const response = await this.client.post<User>('/users', input);
    
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to create user');
    }
    
    return response.data;
  }

  async updateUser(id: string, input: Partial<UserInput>): Promise<User> {
    const response = await this.client.put<User>(`/users/${id}`, input);
    
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to update user');
    }
    
    return response.data;
  }

  async deleteUser(id: string): Promise<boolean> {
    const response = await this.client.delete(`/users/${id}`);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.status === 204;
  }

  async healthCheck() {
    return this.client.healthCheck();
  }
}

export const userService = new UserService();