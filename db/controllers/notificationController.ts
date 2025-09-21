import { and, count, desc, eq, sql } from 'drizzle-orm';
import { db } from '../index';
import { notifications, type NewNotification, type Notification } from '../schema';

// Maximum number of notifications to keep per type (rolling buffer)
const MAX_NOTIFICATIONS_PER_TYPE = 50;

export class NotificationController {
  
  // Get all notifications with optional filtering
  static async getAll(filters?: {
    type?: 'location' | 'emergency' | 'device';
    isRead?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Notification[]> {
    try {
      // Handle different query combinations to avoid TypeScript issues
      if (!filters) {
        return await db.select().from(notifications).orderBy(desc(notifications.timestamp));
      }
      
      const { type, isRead, limit, offset } = filters;
      
      // Base query with conditions
      let baseQuery;
      if (type && isRead !== undefined) {
        baseQuery = db.select().from(notifications).where(
          and(eq(notifications.type, type), eq(notifications.isRead, isRead))
        );
      } else if (type) {
        baseQuery = db.select().from(notifications).where(eq(notifications.type, type));
      } else if (isRead !== undefined) {
        baseQuery = db.select().from(notifications).where(eq(notifications.isRead, isRead));
      } else {
        baseQuery = db.select().from(notifications);
      }
      
      // Apply ordering
      let orderedQuery = baseQuery.orderBy(desc(notifications.timestamp));
      
      // Apply pagination
      if (limit && offset) {
        return await orderedQuery.limit(limit).offset(offset);
      } else if (limit) {
        return await orderedQuery.limit(limit);
      } else if (offset) {
        return await orderedQuery.offset(offset);
      } else {
        return await orderedQuery;
      }
    } catch (error) {
      console.error('❌ Error getting notifications:', error);
      return [];
    }
  }
  
  // Get notifications by type
  static async getByType(type: 'location' | 'emergency' | 'device'): Promise<Notification[]> {
    console.log(`🔍 Getting ${type} notifications...`);
    const result = await this.getAll({ type });
    console.log(`📋 Found ${result.length} ${type} notifications`);
    return result;
  }
  
  // Get unread notifications
  static async getUnread(type?: 'location' | 'emergency' | 'device'): Promise<Notification[]> {
    return this.getAll({ type, isRead: false });
  }
  
  // Get unread count
  static async getUnreadCount(type?: 'location' | 'emergency' | 'device'): Promise<number> {
    try {
      if (type) {
        const result = await db
          .select({ count: count() })
          .from(notifications)
          .where(and(eq(notifications.isRead, false), eq(notifications.type, type)));
        return result[0]?.count || 0;
      } else {
        const result = await db
          .select({ count: count() })
          .from(notifications)
          .where(eq(notifications.isRead, false));
        return result[0]?.count || 0;
      }
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return 0;
    }
  }
  
  // Get all unread counts by type
  static async getAllUnreadCounts(): Promise<{
    location: number;
    emergency: number;
    device: number;
    total: number;
  }> {
    try {
      const [locationCount, emergencyCount, deviceCount] = await Promise.all([
        this.getUnreadCount('location'),
        this.getUnreadCount('emergency'),
        this.getUnreadCount('device'),
      ]);
      
      return {
        location: locationCount,
        emergency: emergencyCount,
        device: deviceCount,
        total: locationCount + emergencyCount + deviceCount,
      };
    } catch (error) {
      console.error('❌ Error getting all unread counts:', error);
      return { location: 0, emergency: 0, device: 0, total: 0 };
    }
  }
  
  // Add a new notification with rolling buffer
  static async add(notification: Omit<NewNotification, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      
      const newNotification: NewNotification = {
        ...notification,
        id,
        timestamp: notification.timestamp || now,
        createdAt: now,
        updatedAt: now,
      };
      
      // Insert the new notification
      await db.insert(notifications).values(newNotification);
      
      // Implement rolling buffer: keep only the latest notifications per type
      await this.enforceRollingBuffer(notification.type);
      
      console.log(`✅ Added ${notification.type} notification:`, id);
      return id;
    } catch (error) {
      console.error('❌ Error adding notification:', error);
      throw error;
    }
  }
  
  // Mark notification as read
  static async markAsRead(id: string): Promise<boolean> {
    try {
      const result = await db
        .update(notifications)
        .set({ isRead: true, updatedAt: new Date() })
        .where(eq(notifications.id, id));
      
      return result.changes > 0;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      return false;
    }
  }
  
  // Mark all notifications as read
  static async markAllAsRead(type?: 'location' | 'emergency' | 'device'): Promise<number> {
    try {
      if (type) {
        const result = await db
          .update(notifications)
          .set({ isRead: true, updatedAt: new Date() })
          .where(eq(notifications.type, type));
        return result.changes;
      } else {
        const result = await db
          .update(notifications)
          .set({ isRead: true, updatedAt: new Date() });
        return result.changes;
      }
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      return 0;
    }
  }
  
  // Delete a notification
  static async delete(id: string): Promise<boolean> {
    try {
      const result = await db.delete(notifications).where(eq(notifications.id, id));
      return result.changes > 0;
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      return false;
    }
  }
  
  // Clear all notifications of a type
  static async clearByType(type: 'location' | 'emergency' | 'device'): Promise<number> {
    try {
      const result = await db.delete(notifications).where(eq(notifications.type, type));
      return result.changes;
    } catch (error) {
      console.error('❌ Error clearing notifications by type:', error);
      return 0;
    }
  }
  
  // Clear all notifications
  static async clearAll(): Promise<number> {
    try {
      const result = await db.delete(notifications);
      return result.changes;
    } catch (error) {
      console.error('❌ Error clearing all notifications:', error);
      return 0;
    }
  }
  
  // Private method to enforce rolling buffer
  private static async enforceRollingBuffer(type: 'location' | 'emergency' | 'device'): Promise<void> {
    try {
      // Get count of notifications for this type
      const countResult = await db
        .select({ count: count() })
        .from(notifications)
        .where(eq(notifications.type, type));
      
      const currentCount = countResult[0]?.count || 0;
      
      if (currentCount > MAX_NOTIFICATIONS_PER_TYPE) {
        // Get the oldest notifications to delete
        const toDelete = await db
          .select({ id: notifications.id })
          .from(notifications)
          .where(eq(notifications.type, type))
          .orderBy(notifications.timestamp)
          .limit(currentCount - MAX_NOTIFICATIONS_PER_TYPE);
        
        if (toDelete.length > 0) {
          // Delete the oldest notifications one by one to avoid SQL injection issues
          for (const notification of toDelete) {
            await db.delete(notifications).where(eq(notifications.id, notification.id));
          }
          console.log(`🗑️ Cleaned up ${toDelete.length} old ${type} notifications`);
        }
      }
    } catch (error) {
      console.error('❌ Error enforcing rolling buffer:', error);
    }
  }
  
  // Get notification by ID
  static async getById(id: string): Promise<Notification | null> {
    try {
      const result = await db.select().from(notifications).where(eq(notifications.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('❌ Error getting notification by ID:', error);
      return null;
    }
  }
  
  // Cleanup old notifications (older than specified days)
  static async cleanupOld(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const result = await db
        .delete(notifications)
        .where(sql`${notifications.timestamp} < ${cutoffDate.getTime()}`);
      
      console.log(`🧹 Cleaned up ${result.changes} notifications older than ${daysOld} days`);
      return result.changes;
    } catch (error) {
      console.error('❌ Error cleaning up old notifications:', error);
      return 0;
    }
  }
}