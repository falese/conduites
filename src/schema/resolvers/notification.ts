import { notificationService } from '../../services/notificationService.js';

export const notificationResolvers = {
  Query: {
    // Get notifications for a user with pagination
    async notifications(_: any, { userId, limit, offset }: { 
      userId: string; 
      limit: number; 
      offset: number; 
    }) {
      return await notificationService.getUserNotifications(userId, { limit, offset });
    },

    // Get count of unread notifications for a user
    async unreadNotificationCount(_: any, { userId }: { userId: string }) {
      return await notificationService.getUnreadCount(userId);
    },

    // Health check for K8s probes
    async health() {
      const timestamp = new Date().toISOString();
      
      try {
        // Check health of downstream services
        const services = await Promise.allSettled([
          notificationService.healthCheck(),
          // Add other service health checks as needed
        ]);

        const serviceHealths = services.map((result, index) => {
          const serviceName = ['notification-service'][index];
          if (result.status === 'fulfilled') {
            return {
              name: serviceName!,
              status: 'healthy',
              responseTime: result.value.responseTime || 0,
            };
          } else {
            return {
              name: serviceName!,
              status: 'unhealthy',
              responseTime: null,
            };
          }
        });

        return {
          status: 'healthy',
          timestamp,
          services: serviceHealths,
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          timestamp,
          services: [],
        };
      }
    },
  },

  Mutation: {
    // Create new notification - pass-through to notification service
    async createNotification(_: any, { input }: { input: any }) {
      return await notificationService.createNotification(input);
    },

    // Mark notification as read
    async markNotificationAsRead(_: any, { id }: { id: string }) {
      return await notificationService.markAsRead(id);
    },

    // Delete notification
    async deleteNotification(_: any, { id }: { id: string }) {
      return await notificationService.deleteNotification(id);
    },
  },
};