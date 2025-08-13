import * as SecureStore from 'expo-secure-store';

// Storage keys for different notification types
export const NOTIFICATION_KEYS = {
  LOCATION_UPDATES: 'notification_location_updates',
  EMERGENCY_ALERTS: 'notification_emergency_alerts',
  DEVICE_STATUS: 'notification_device_status',
} as const;

// Maximum number of notifications to store for each type
export const MAX_NOTIFICATIONS = 50;

// Base notification interface
export interface BaseNotification {
  id: string;
  timestamp: number;
  isRead: boolean;
}

// Location update notification
export interface LocationNotification extends BaseNotification {
  type: 'location';
  latitude: number;
  longitude: number;
}

// Emergency alert notification
export interface EmergencyNotification extends BaseNotification {
  type: 'emergency';
  alertType: 'sos' | 'panic' | 'medical' | 'fall_detection';
  status: 'active' | 'resolved' | 'acknowledged';
  details?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Device status notification
export interface DeviceNotification extends BaseNotification {
  type: 'device';
  deviceName: string;
  deviceId: string;
  status: 'connected' | 'disconnected' | 'connection_failed' | 'pairing_started' | 'pairing_completed';
  details?: string;
}

// Union type for all notifications
export type Notification = LocationNotification | EmergencyNotification | DeviceNotification;

// Utility function to generate unique IDs
export const generateNotificationId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Generic function to get notifications from secure storage
export const getNotifications = async <T extends Notification>(
  storageKey: string
): Promise<T[]> => {
  try {
    const stored = await SecureStore.getItemAsync(storageKey);
    if (!stored) return [];
    
    const notifications: T[] = JSON.parse(stored);
    // Sort by timestamp (newest first)
    return notifications.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error(`Error getting notifications from ${storageKey}:`, error);
    return [];
  }
};

// Generic function to store notifications with rolling buffer
export const storeNotifications = async <T extends Notification>(
  storageKey: string,
  notifications: T[]
): Promise<void> => {
  try {
    // Ensure we don't exceed the maximum limit
    const limitedNotifications = notifications.slice(0, MAX_NOTIFICATIONS);
    await SecureStore.setItemAsync(storageKey, JSON.stringify(limitedNotifications));
  } catch (error) {
    console.error(`Error storing notifications to ${storageKey}:`, error);
    throw error;
  }
};

// Add a new notification with rolling buffer logic
export const addNotification = async <T extends Notification>(
  storageKey: string,
  newNotification: T
): Promise<void> => {
  try {
    const existingNotifications = await getNotifications<T>(storageKey);
    
    // Add new notification to the beginning (newest first)
    const updatedNotifications = [newNotification, ...existingNotifications];
    
    // Implement rolling buffer: keep only the latest MAX_NOTIFICATIONS
    const limitedNotifications = updatedNotifications.slice(0, MAX_NOTIFICATIONS);
    
    await storeNotifications(storageKey, limitedNotifications);
  } catch (error) {
    console.error(`Error adding notification to ${storageKey}:`, error);
    throw error;
  }
};

// Mark a notification as read
export const markNotificationAsRead = async <T extends Notification>(
  storageKey: string,
  notificationId: string
): Promise<void> => {
  try {
    const notifications = await getNotifications<T>(storageKey);
    const updatedNotifications = notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, isRead: true }
        : notification
    );
    await storeNotifications(storageKey, updatedNotifications);
  } catch (error) {
    console.error(`Error marking notification as read in ${storageKey}:`, error);
    throw error;
  }
};

// Remove a specific notification
export const removeNotification = async <T extends Notification>(
  storageKey: string,
  notificationId: string
): Promise<void> => {
  try {
    const notifications = await getNotifications<T>(storageKey);
    const filteredNotifications = notifications.filter(
      notification => notification.id !== notificationId
    );
    await storeNotifications(storageKey, filteredNotifications);
  } catch (error) {
    console.error(`Error removing notification from ${storageKey}:`, error);
    throw error;
  }
};

// Clear all notifications of a specific type
export const clearAllNotifications = async (storageKey: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(storageKey);
  } catch (error) {
    console.error(`Error clearing all notifications from ${storageKey}:`, error);
    throw error;
  }
};

// Get unread notification count
export const getUnreadCount = async <T extends Notification>(
  storageKey: string
): Promise<number> => {
  try {
    const notifications = await getNotifications<T>(storageKey);
    return notifications.filter(notification => !notification.isRead).length;
  } catch (error) {
    console.error(`Error getting unread count from ${storageKey}:`, error);
    return 0;
  }
};

// Mark all notifications as read
export const markAllAsRead = async <T extends Notification>(
  storageKey: string
): Promise<void> => {
  try {
    const notifications = await getNotifications<T>(storageKey);
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      isRead: true,
    }));
    await storeNotifications(storageKey, updatedNotifications);
  } catch (error) {
    console.error(`Error marking all notifications as read in ${storageKey}:`, error);
    throw error;
  }
};
