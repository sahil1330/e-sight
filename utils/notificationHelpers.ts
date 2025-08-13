import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import {
  DeviceNotification,
  EmergencyNotification,
  LocationNotification,
  NOTIFICATION_KEYS,
  addNotification,
  clearAllNotifications,
  generateNotificationId,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markNotificationAsRead,
  removeNotification,
} from './notificationStorage';

// Location notification helpers
export const addLocationNotification = async (
  latitude: number,
  longitude: number
): Promise<void> => {
  const notification: LocationNotification = {
    id: generateNotificationId(),
    type: 'location',
    timestamp: Date.now(),
    isRead: false,
    latitude,
    longitude,
  };

  await addNotification(NOTIFICATION_KEYS.LOCATION_UPDATES, notification);
};

export const getLocationNotifications = async (): Promise<LocationNotification[]> => {
  return getNotifications<LocationNotification>(NOTIFICATION_KEYS.LOCATION_UPDATES);
};

export const clearLocationNotifications = async (): Promise<void> => {
  await clearAllNotifications(NOTIFICATION_KEYS.LOCATION_UPDATES);
};

export const removeLocationNotification = async (notificationId: string): Promise<void> => {
  await removeNotification(NOTIFICATION_KEYS.LOCATION_UPDATES, notificationId);
};

export const markLocationNotificationAsRead = async (notificationId: string): Promise<void> => {
  await markNotificationAsRead(NOTIFICATION_KEYS.LOCATION_UPDATES, notificationId);
};

export const markAllLocationNotificationsAsRead = async (): Promise<void> => {
  await markAllAsRead(NOTIFICATION_KEYS.LOCATION_UPDATES);
};

export const getLocationNotificationsUnreadCount = async (): Promise<number> => {
  return getUnreadCount(NOTIFICATION_KEYS.LOCATION_UPDATES);
};

// Emergency notification helpers
export const addEmergencyNotification = async (
  alertType: EmergencyNotification['alertType'],
  status: EmergencyNotification['status'],
  priority: EmergencyNotification['priority'] = 'high',
  details?: string
): Promise<void> => {
  const notification: EmergencyNotification = {
    id: generateNotificationId(),
    type: 'emergency',
    timestamp: Date.now(),
    isRead: false,
    alertType,
    status,
    priority,
    details,
  };

  await addNotification(NOTIFICATION_KEYS.EMERGENCY_ALERTS, notification);

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
};

export const getEmergencyNotifications = async (): Promise<EmergencyNotification[]> => {
  return getNotifications<EmergencyNotification>(NOTIFICATION_KEYS.EMERGENCY_ALERTS);
};

export const clearEmergencyNotifications = async (): Promise<void> => {
  await clearAllNotifications(NOTIFICATION_KEYS.EMERGENCY_ALERTS);
};

export const removeEmergencyNotification = async (notificationId: string): Promise<void> => {
  await removeNotification(NOTIFICATION_KEYS.EMERGENCY_ALERTS, notificationId);
};

export const markEmergencyNotificationAsRead = async (notificationId: string): Promise<void> => {
  await markNotificationAsRead(NOTIFICATION_KEYS.EMERGENCY_ALERTS, notificationId);
};

export const markAllEmergencyNotificationsAsRead = async (): Promise<void> => {
  await markAllAsRead(NOTIFICATION_KEYS.EMERGENCY_ALERTS);
};

export const getEmergencyNotificationsUnreadCount = async (): Promise<number> => {
  return getUnreadCount(NOTIFICATION_KEYS.EMERGENCY_ALERTS);
};

// Device notification helpers
export const addDeviceNotification = async (
  deviceName: string,
  deviceId: string,
  status: DeviceNotification['status'],
  details?: string
): Promise<void> => {
  const notification: DeviceNotification = {
    id: generateNotificationId(),
    type: 'device',
    timestamp: Date.now(),
    isRead: false,
    deviceName,
    deviceId,
    status,
    details,
  };

  await addNotification(NOTIFICATION_KEYS.DEVICE_STATUS, notification);

  // Provide haptic feedback for device connection changes
  if (status === 'connected') {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else if (status === 'disconnected' || status === 'connection_failed') {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
};

export const getDeviceNotifications = async (): Promise<DeviceNotification[]> => {
  return getNotifications<DeviceNotification>(NOTIFICATION_KEYS.DEVICE_STATUS);
};

export const clearDeviceNotifications = async (): Promise<void> => {
  await clearAllNotifications(NOTIFICATION_KEYS.DEVICE_STATUS);
};

export const removeDeviceNotification = async (notificationId: string): Promise<void> => {
  await removeNotification(NOTIFICATION_KEYS.DEVICE_STATUS, notificationId);
};

export const markDeviceNotificationAsRead = async (notificationId: string): Promise<void> => {
  await markNotificationAsRead(NOTIFICATION_KEYS.DEVICE_STATUS, notificationId);
};

export const markAllDeviceNotificationsAsRead = async (): Promise<void> => {
  await markAllAsRead(NOTIFICATION_KEYS.DEVICE_STATUS);
};

export const getDeviceNotificationsUnreadCount = async (): Promise<number> => {
  return getUnreadCount(NOTIFICATION_KEYS.DEVICE_STATUS);
};

// Combined helpers for all notification types
export const getAllNotificationsUnreadCount = async (): Promise<{
  location: number;
  emergency: number;
  device: number;
  total: number;
}> => {
  const [locationCount, emergencyCount, deviceCount] = await Promise.all([
    getLocationNotificationsUnreadCount(),
    getEmergencyNotificationsUnreadCount(),
    getDeviceNotificationsUnreadCount(),
  ]);

  return {
    location: locationCount,
    emergency: emergencyCount,
    device: deviceCount,
    total: locationCount + emergencyCount + deviceCount,
  };
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

// Utility function to format notification timestamps
export const formatNotificationTime = (timestamp: number): string => {
  const date = new Date(timestamp);
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
export const getDeviceStatusColor = (status: DeviceNotification['status']): string => {
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
    default:
      return '#6B7280'; // gray-500
  }
};
