import { HttpClient } from './httpClient.js';
import { appConfig } from '../config/index.js';

type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';

interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
}

interface GetNotificationsOptions {
  limit: number;
  offset: number;
}

class NotificationService {
  private client: HttpClient;

  constructor() {
    this.client = new HttpClient(appConfig.services.notificationService);
  }

  async getUserNotifications(userId: string, options: GetNotificationsOptions): Promise<Notification[]> {
    const { limit, offset } = options;
    const queryParams = new URLSearchParams({
      userId,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    const response = await this.client.get<Notification[]>(`/notifications?${queryParams}`);
    
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch notifications');
    }
    
    return response.data;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const response = await this.client.get<{ count: number }>(`/notifications/unread-count?userId=${userId}`);
    
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch unread notification count');
    }
    
    return response.data.count;
  }

  async createNotification(input: NotificationInput): Promise<Notification> {
    const response = await this.client.post<Notification>('/notifications', input);
    
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to create notification');
    }
    
    return response.data;
  }

  async markAsRead(id: string): Promise<Notification> {
    const response = await this.client.put<Notification>(`/notifications/${id}/read`);
    
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to mark notification as read');
    }
    
    return response.data;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const response = await this.client.delete(`/notifications/${id}`);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.status === 204;
  }

  async healthCheck() {
    return this.client.healthCheck();
  }
}

export const notificationService = new NotificationService();