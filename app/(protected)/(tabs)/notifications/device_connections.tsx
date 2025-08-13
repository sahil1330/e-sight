import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { DeviceNotification } from '@/utils/notificationStorage';
import {
  clearDeviceNotifications,
  getDeviceNotifications,
  markAllDeviceNotificationsAsRead,
  markDeviceNotificationAsRead,
  removeDeviceNotification,
} from '@/utils/notificationHelpers';
import NotificationItem from '@/components/Notifications/NotificationItem';

const DeviceNotificationsScreen = () => {
  const { authState } = useAuth();
  const { refreshUnreadCounts, announceNewNotification } = useNotifications();
  const userRole = authState?.userDetails?.role;

  const [notifications, setNotifications] = useState<DeviceNotification[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load device notifications
  const loadNotifications = useCallback(async () => {
    try {
      if (userRole === 'caretaker') {
        setNotifications([]); // Caretakers don't see device status
        return;
      }
      
      const data = await getDeviceNotifications();
      setNotifications(data);
      await refreshUnreadCounts();
    } catch (error) {
      console.error('Error loading device notifications:', error);
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

  // Notification action handlers
  const handleNotificationPress = async (notification: DeviceNotification) => {
    if (!notification.isRead) {
      try {
        await markDeviceNotificationAsRead(notification.id);
        await announceNewNotification('Device notification marked as read');
        await loadNotifications();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleNotificationDismiss = async (notification: DeviceNotification) => {
    try {
      await removeDeviceNotification(notification.id);
      await announceNewNotification('Device notification dismissed');
      await loadNotifications();
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllDeviceNotificationsAsRead();
      await announceNewNotification('All device notifications marked as read');
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearDeviceNotifications();
      await announceNewNotification('All device notifications cleared');
      await loadNotifications();
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  // Check if user has access to device notifications
  if (userRole === 'caretaker') {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom', 'left', 'right']}>
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="bluetooth-outline" size={80} color="#9CA3AF" />
          <Text 
            className="text-gray-500 text-xl mt-4 text-center font-medium"
            accessibilityLabel="Device notifications not available for caretakers"
          >
            Device Status Notifications
          </Text>
          <Text className="text-gray-400 text-lg text-center mt-2">
            Device connection status is only available for blind users
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom', 'left', 'right']}>
      {/* Action Bar */}
      {notifications.length > 0 && (
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <View className="flex-row justify-end space-x-3">
            <TouchableOpacity
              onPress={handleMarkAllRead}
              className="bg-blue-600 px-4 py-2 rounded-lg"
              accessibilityRole="button"
              accessibilityLabel="Mark all device notifications as read"
              style={{ minHeight: 44 }}
            >
              <Text className="text-white font-semibold text-base">
                Mark All Read
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleClearAll}
              className="bg-red-600 px-4 py-2 rounded-lg"
              accessibilityRole="button"
              accessibilityLabel="Clear all device notifications"
              style={{ minHeight: 44 }}
            >
              <Text className="text-white font-semibold text-base">
                Clear All
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ 
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 120, // Extra space for tab bar
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
        accessibilityLabel="Device notifications list"
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="bluetooth-outline" size={80} color="#9CA3AF" />
            <Text 
              className="text-gray-500 text-xl mt-4 text-center font-medium"
              accessibilityLabel="No device notifications available"
            >
              No Device Status Updates
            </Text>
            <Text className="text-gray-400 text-lg text-center mt-2">
              Device connection status updates will appear here
            </Text>
          </View>
        ) : (
          <View>
            <Text 
              className="text-lg font-semibold text-gray-800 mb-4"
              accessibilityRole="header"
            >
              Device Status Updates ({notifications.length})
            </Text>
            
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onPress={() => handleNotificationPress(notification)}
                onDismiss={() => handleNotificationDismiss(notification)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default DeviceNotificationsScreen;
