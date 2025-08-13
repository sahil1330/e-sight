import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import {
  clearAllNotificationsOfAllTypes,
  clearDeviceNotifications,
  clearEmergencyNotifications,
  clearLocationNotifications,
  getDeviceNotifications,
  getEmergencyNotifications,
  getLocationNotifications,
  markAllDeviceNotificationsAsRead,
  markAllEmergencyNotificationsAsRead,
  markAllLocationNotificationsAsRead,
  markAllNotificationsAsRead,
  markDeviceNotificationAsRead,
  markEmergencyNotificationAsRead,
  markLocationNotificationAsRead,
  removeDeviceNotification,
  removeEmergencyNotification,
  removeLocationNotification
} from '@/utils/notificationHelpers';
import {
  DeviceNotification,
  EmergencyNotification as EmergencyNotificationType,
  LocationNotification,
} from '@/utils/notificationStorage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import EmergencyNotification from './EmergencyNotification';
import NotificationActions from './NotificationActions';
import NotificationCategory from './NotificationCategory';
import NotificationItem from './NotificationItem';

const NotificationsList: React.FC = () => {
  const { authState } = useAuth();
  const { unreadCounts, refreshUnreadCounts, announceNewNotification } = useNotifications();
  const userRole = authState?.userDetails?.role;

  // State for notifications
  const [locationNotifications, setLocationNotifications] = useState<LocationNotification[]>([]);
  const [emergencyNotifications, setEmergencyNotifications] = useState<EmergencyNotificationType[]>([]);
  const [deviceNotifications, setDeviceNotifications] = useState<DeviceNotification[]>([]);

  // State for category expansion
  const [expandedCategories, setExpandedCategories] = useState({
    location: true,
    emergency: true,
    device: true,
  });

  // State for refresh control
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load all notifications
  const loadNotifications = useCallback(async () => {
    try {
      const [locationData, emergencyData, deviceData] = await Promise.all([
        userRole === 'caretaker' ? [] : getLocationNotifications(), // Caretakers don't see location updates
        getEmergencyNotifications(),
        userRole === 'caretaker' ? [] : getDeviceNotifications(), // Caretakers don't see device status
      ]);

      setLocationNotifications(locationData);
      setEmergencyNotifications(emergencyData);
      setDeviceNotifications(deviceData);

      // Refresh unread counts through context
      await refreshUnreadCounts();
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [userRole, refreshUnreadCounts]);

  // Load notifications when component mounts and when screen is focused
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  }, [loadNotifications]);

  // Category toggle handlers
  const toggleCategory = (category: keyof typeof expandedCategories) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Notification action handlers
  const handleNotificationPress = async (notification: LocationNotification | EmergencyNotificationType | DeviceNotification) => {
    if (!notification.isRead) {
      try {
        switch (notification.type) {
          case 'location':
            await markLocationNotificationAsRead(notification.id);
            await announceNewNotification('Location notification marked as read');
            break;
          case 'emergency':
            await markEmergencyNotificationAsRead(notification.id);
            await announceNewNotification('Emergency notification marked as read');
            break;
          case 'device':
            await markDeviceNotificationAsRead(notification.id);
            await announceNewNotification('Device notification marked as read');
            break;
        }
        await loadNotifications(); // Refresh to update read status
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleNotificationDismiss = async (notification: LocationNotification | EmergencyNotificationType | DeviceNotification) => {
    try {
      switch (notification.type) {
        case 'location':
          await removeLocationNotification(notification.id);
          await announceNewNotification('Location notification dismissed');
          break;
        case 'emergency':
          await removeEmergencyNotification(notification.id);
          await announceNewNotification('Emergency notification dismissed');
          break;
        case 'device':
          await removeDeviceNotification(notification.id);
          await announceNewNotification('Device notification dismissed');
          break;
      }
      await loadNotifications(); // Refresh to update list
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  // Category action handlers
  const handleClearCategory = async (category: 'location' | 'emergency' | 'device') => {
    try {
      switch (category) {
        case 'location':
          await clearLocationNotifications();
          break;
        case 'emergency':
          await clearEmergencyNotifications();
          break;
        case 'device':
          await clearDeviceNotifications();
          break;
      }
      await loadNotifications();
    } catch (error) {
      console.error(`Error clearing ${category} notifications:`, error);
    }
  };

  const handleMarkCategoryAsRead = async (category: 'location' | 'emergency' | 'device') => {
    try {
      switch (category) {
        case 'location':
          await markAllLocationNotificationsAsRead();
          break;
        case 'emergency':
          await markAllEmergencyNotificationsAsRead();
          break;
        case 'device':
          await markAllDeviceNotificationsAsRead();
          break;
      }
      await loadNotifications();
    } catch (error) {
      console.error(`Error marking ${category} notifications as read:`, error);
    }
  };

  // Global action handlers
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllNotificationsOfAllTypes();
      await loadNotifications();
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  // Check if there are any notifications to display
  const hasNotifications = locationNotifications.length > 0 || 
                          emergencyNotifications.length > 0 || 
                          deviceNotifications.length > 0;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 140, // Extra space for tab bar + actions
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6" // blue-500
            colors={['#3B82F6']} // blue-500
          />
        }
        accessibilityLabel="Notifications list"
        showsVerticalScrollIndicator={false}
      >
        <View>
          {!hasNotifications ? (
            <View className="items-center justify-center py-20">
              <Text className="text-xl text-gray-500 text-center">
                No notifications yet
              </Text>
              <Text className="text-base text-gray-400 text-center mt-2">
                You&apos;ll see location updates, emergency alerts, and device status here
              </Text>
            </View>
          ) : (
            <>
              {/* Emergency Alerts - Always shown for all users */}
              <NotificationCategory
                title="Emergency Alerts"
                unreadCount={unreadCounts.emergency}
                isExpanded={expandedCategories.emergency}
                onToggle={() => toggleCategory('emergency')}
                onClearAll={() => handleClearCategory('emergency')}
                onMarkAllRead={() => handleMarkCategoryAsRead('emergency')}
                accessibilityLabel={`Emergency alerts section with ${unreadCounts.emergency} unread alerts`}
              >
                {emergencyNotifications.length === 0 ? (
                  <Text className="text-center text-gray-500 py-4">
                    No emergency alerts
                  </Text>
                ) : (
                  emergencyNotifications.map((notification) => (
                    <EmergencyNotification
                      key={notification.id}
                      notification={notification}
                      onPress={() => handleNotificationPress(notification)}
                      onDismiss={() => handleNotificationDismiss(notification)}
                    />
                  ))
                )}
              </NotificationCategory>

              {/* Location Updates - Only for blind users */}
              {userRole !== 'caretaker' && (
                <NotificationCategory
                  title="Location Updates"
                  unreadCount={unreadCounts.location}
                  isExpanded={expandedCategories.location}
                  onToggle={() => toggleCategory('location')}
                  onClearAll={() => handleClearCategory('location')}
                  onMarkAllRead={() => handleMarkCategoryAsRead('location')}
                  accessibilityLabel={`Location updates section with ${unreadCounts.location} unread updates`}
                >
                  {locationNotifications.length === 0 ? (
                    <Text className="text-center text-gray-500 py-4">
                      No location updates
                    </Text>
                  ) : (
                    locationNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onPress={() => handleNotificationPress(notification)}
                        onDismiss={() => handleNotificationDismiss(notification)}
                      />
                    ))
                  )}
                </NotificationCategory>
              )}

              {/* Device Status - Only for blind users */}
              {userRole !== 'caretaker' && (
                <NotificationCategory
                  title="Device Status"
                  unreadCount={unreadCounts.device}
                  isExpanded={expandedCategories.device}
                  onToggle={() => toggleCategory('device')}
                  onClearAll={() => handleClearCategory('device')}
                  onMarkAllRead={() => handleMarkCategoryAsRead('device')}
                  accessibilityLabel={`Device status section with ${unreadCounts.device} unread status updates`}
                >
                  {deviceNotifications.length === 0 ? (
                    <Text className="text-center text-gray-500 py-4">
                      No device status updates
                    </Text>
                  ) : (
                    deviceNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onPress={() => handleNotificationPress(notification)}
                        onDismiss={() => handleNotificationDismiss(notification)}
                      />
                    ))
                  )}
                </NotificationCategory>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Global Actions */}
      {hasNotifications && (
        <NotificationActions
          totalUnreadCount={unreadCounts.total}
          onMarkAllRead={handleMarkAllRead}
          onClearAll={handleClearAll}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      )}
    </View>
  );
};

export default NotificationsList;
