import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { NotificationController } from '../db/controllers/notificationController';
import {
    convertToDeviceNotifications,
    convertToEmergencyNotifications,
    convertToLocationNotifications,
    DeviceNotification,
    EmergencyNotification,
    LocationNotification
} from './notificationTypeAdapters';

// Location notification helpers
export const addLocationNotification = async (
  latitude: number,
  longitude: number,
  details?: string
): Promise<string> => {
  return await NotificationController.add({
    type: 'location',
    timestamp: new Date(),
    isRead: false,
    latitude,
    longitude,
    details,
  });
};

export const getLocationNotifications = async (): Promise<LocationNotification[]> => {
  const sqliteNotifications = await NotificationController.getByType('location');
  return convertToLocationNotifications(sqliteNotifications);
};

export const clearLocationNotifications = async (): Promise<number> => {
  return await NotificationController.clearByType('location');
};

export const removeLocationNotification = async (notificationId: string): Promise<boolean> => {
  return await NotificationController.delete(notificationId);
};

export const markLocationNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  return await NotificationController.markAsRead(notificationId);
};

export const markAllLocationNotificationsAsRead = async (): Promise<number> => {
  return await NotificationController.markAllAsRead('location');
};

export const getLocationNotificationsUnreadCount = async (): Promise<number> => {
  return await NotificationController.getUnreadCount('location');
};

// Emergency notification helpers
export const addEmergencyNotification = async (
  alertType: 'sos' | 'panic' | 'medical' | 'fall_detection',
  status: 'active' | 'resolved' | 'acknowledged',
  priority: 'low' | 'medium' | 'high' | 'critical' = 'high',
  details?: string
): Promise<string> => {
  const notificationId = await NotificationController.add({
    type: 'emergency',
    timestamp: new Date(),
    isRead: false,
    alertType,
    status,
    priority,
    details,
  });

  // Provide haptic feedback for emergency alerts
  if (priority === 'critical' || priority === 'high') {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    // Schedule a local notification for critical alerts
    if (priority === 'critical') {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Emergency Alert',
          body: `${alertType.toUpperCase()} alert: ${details || 'Emergency situation detected'}`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null,
      });
    }
  }

  return notificationId;
};

export const getEmergencyNotifications = async (): Promise<EmergencyNotification[]> => {
  const sqliteNotifications = await NotificationController.getByType('emergency');
  return convertToEmergencyNotifications(sqliteNotifications);
};

export const clearEmergencyNotifications = async (): Promise<number> => {
  return await NotificationController.clearByType('emergency');
};

export const removeEmergencyNotification = async (notificationId: string): Promise<boolean> => {
  return await NotificationController.delete(notificationId);
};

export const markEmergencyNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  return await NotificationController.markAsRead(notificationId);
};

export const markAllEmergencyNotificationsAsRead = async (): Promise<number> => {
  return await NotificationController.markAllAsRead('emergency');
};

export const getEmergencyNotificationsUnreadCount = async (): Promise<number> => {
  return await NotificationController.getUnreadCount('emergency');
};

// Device notification helpers
export const addDeviceNotification = async (
  deviceName: string,
  deviceId: string,
  status: 'connected' | 'disconnected' | 'connection_failed' | 'pairing_started' | 'pairing_completed' | 'forgot_device',
  details?: string
): Promise<string> => {
  const notificationId = await NotificationController.add({
    type: 'device',
    timestamp: new Date(),
    isRead: false,
    deviceName,
    deviceId,
    deviceStatus: status,
    details,
  });

  // Provide haptic feedback for device connection changes
  if (status === 'connected') {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else if (status === 'disconnected' || status === 'connection_failed') {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  return notificationId;
};

export const getDeviceNotifications = async (): Promise<DeviceNotification[]> => {
  const sqliteNotifications = await NotificationController.getByType('device');
  return convertToDeviceNotifications(sqliteNotifications);
};

export const clearDeviceNotifications = async (): Promise<number> => {
  return await NotificationController.clearByType('device');
};

export const removeDeviceNotification = async (notificationId: string): Promise<boolean> => {
  return await NotificationController.delete(notificationId);
};

export const markDeviceNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  return await NotificationController.markAsRead(notificationId);
};

export const markAllDeviceNotificationsAsRead = async (): Promise<number> => {
  return await NotificationController.markAllAsRead('device');
};

export const getDeviceNotificationsUnreadCount = async (): Promise<number> => {
  return await NotificationController.getUnreadCount('device');
};

// Combined helpers for all notification types
export const getAllNotificationsUnreadCount = async (): Promise<{
  location: number;
  emergency: number;
  device: number;
  total: number;
}> => {
  return await NotificationController.getAllUnreadCounts();
};

export const clearAllNotificationsOfAllTypes = async (): Promise<void> => {
  await Promise.all([
    clearLocationNotifications(),
    clearEmergencyNotifications(),
    clearDeviceNotifications(),
  ]);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await Promise.all([
    markAllLocationNotificationsAsRead(),
    markAllEmergencyNotificationsAsRead(),
    markAllDeviceNotificationsAsRead(),
  ]);
};

// Get all notifications across all types
export const getAllNotifications = async (options?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}) => {
  return await NotificationController.getAll({
    isRead: options?.unreadOnly ? false : undefined,
    limit: options?.limit,
    offset: options?.offset,
  });
};

// Utility function to format notification timestamps
export const formatNotificationTime = (timestamp: Date | number): string => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  } else if (diffInMinutes < 1440) { // Less than 24 hours
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
};

// Utility function to get notification priority color
export const getNotificationPriorityColor = (priority?: string): string => {
  switch (priority) {
    case 'critical':
      return '#DC2626'; // red-600
    case 'high':
      return '#EA580C'; // orange-600
    case 'medium':
      return '#D97706'; // amber-600
    case 'low':
      return '#059669'; // emerald-600
    default:
      return '#6B7280'; // gray-500
  }
};

// Utility function to get device status color
export const getDeviceStatusColor = (status?: string): string => {
  switch (status) {
    case 'connected':
      return '#059669'; // emerald-600
    case 'disconnected':
      return '#DC2626'; // red-600
    case 'connection_failed':
      return '#DC2626'; // red-600
    case 'pairing_started':
      return '#D97706'; // amber-600
    case 'pairing_completed':
      return '#059669'; // emerald-600
    case 'forgot_device':
      return '#DC2626'; // red-600
    default:
      return '#6B7280'; // gray-500
  }
};

// Clean up old notifications (utility for maintenance)
export const cleanupOldNotifications = async (daysOld: number = 30): Promise<number> => {
  return await NotificationController.cleanupOld(daysOld);
};

// Get notification by ID
export const getNotificationById = async (id: string) => {
  return await NotificationController.getById(id);
};