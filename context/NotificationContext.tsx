import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { AccessibilityInfo } from 'react-native';
import { 
  getAllNotificationsUnreadCount,
  addEmergencyNotification,
} from '@/utils/notificationHelpers';
import { EmergencyNotification } from '@/utils/notificationStorage';

interface NotificationContextType {
  unreadCounts: {
    location: number;
    emergency: number;
    device: number;
    total: number;
  };
  refreshUnreadCounts: () => Promise<void>;
  announceNewNotification: (message: string, isEmergency?: boolean) => Promise<void>;
  addEmergencyAlert: (
    alertType: EmergencyNotification['alertType'],
    status: EmergencyNotification['status'],
    priority?: EmergencyNotification['priority'],
    details?: string
  ) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [unreadCounts, setUnreadCounts] = useState({
    location: 0,
    emergency: 0,
    device: 0,
    total: 0,
  });

  // Refresh unread counts
  const refreshUnreadCounts = useCallback(async () => {
    try {
      const counts = await getAllNotificationsUnreadCount();
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error refreshing unread counts:', error);
    }
  }, []);

  // Announce new notifications for screen readers
  const announceNewNotification = useCallback(async (message: string, isEmergency = false) => {
    try {
      // Check if screen reader is enabled
      const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      
      if (isScreenReaderEnabled) {
        // Announce the notification
        AccessibilityInfo.announceForAccessibility(message);
      }

      // Provide haptic feedback
      if (isEmergency) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // Additional vibration pattern for emergency
        setTimeout(async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 200);
        setTimeout(async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 400);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error announcing notification:', error);
    }
  }, []);

  // Add emergency alert with announcement
  const addEmergencyAlert = useCallback(async (
    alertType: EmergencyNotification['alertType'],
    status: EmergencyNotification['status'],
    priority: EmergencyNotification['priority'] = 'high',
    details?: string
  ) => {
    try {
      // Add the notification to storage
      await addEmergencyNotification(alertType, status, priority, details);
      
      // Refresh counts
      await refreshUnreadCounts();
      
      // Announce for accessibility
      const announcement = `Emergency alert: ${alertType.replace('_', ' ')} with ${priority} priority. Status: ${status}.${details ? ` ${details}` : ''}`;
      await announceNewNotification(announcement, true);
      
    } catch (error) {
      console.error('Error adding emergency alert:', error);
    }
  }, [refreshUnreadCounts, announceNewNotification]);

  // Load initial unread counts
  useEffect(() => {
    refreshUnreadCounts();
  }, [refreshUnreadCounts]);

  // Set up periodic refresh (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(refreshUnreadCounts, 30000);
    return () => clearInterval(interval);
  }, [refreshUnreadCounts]);

  const value: NotificationContextType = {
    unreadCounts,
    refreshUnreadCounts,
    announceNewNotification,
    addEmergencyAlert,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
