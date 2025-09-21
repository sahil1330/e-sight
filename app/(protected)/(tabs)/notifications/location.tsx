import NotificationItem from '@/components/Notifications/NotificationItem';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import {
    clearLocationNotifications,
    getLocationNotifications,
    markAllLocationNotificationsAsRead,
    markLocationNotificationAsRead,
    removeLocationNotification,
} from '@/utils/notificationHelpers';
import { LocationNotification } from '@/utils/notificationTypeAdapters';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LocationNotificationsScreen = () => {
  const { authState } = useAuth();
  const { refreshUnreadCounts, announceNewNotification } = useNotifications();
  const userRole = authState?.userDetails?.role;

  const [notifications, setNotifications] = useState<LocationNotification[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load location notifications
  const loadNotifications = useCallback(async () => {
    try {
      if (userRole === 'caretaker') {
        setNotifications([]); // Caretakers don't see location updates
        return;
      }
      
      const data = await getLocationNotifications();
      setNotifications(data);
      await refreshUnreadCounts();
    } catch (error) {
      console.error('Error loading location notifications:', error);
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
  const handleNotificationPress = async (notification: LocationNotification) => {
    if (!notification.isRead) {
      try {
        await markLocationNotificationAsRead(notification.id);
        await announceNewNotification('Location notification marked as read');
        await loadNotifications();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleNotificationDismiss = async (notification: LocationNotification) => {
    try {
      await removeLocationNotification(notification.id);
      await announceNewNotification('Location notification dismissed');
      await loadNotifications();
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllLocationNotificationsAsRead();
      await announceNewNotification('All location notifications marked as read');
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearLocationNotifications();
      await announceNewNotification('All location notifications cleared');
      await loadNotifications();
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  // Check if user has access to location notifications
  if (userRole === 'caretaker') {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom', 'left', 'right']}>
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="location-outline" size={80} color="#9CA3AF" />
          <Text 
            className="text-gray-500 text-xl mt-4 text-center font-medium"
            accessibilityLabel="Location notifications not available for caretakers"
          >
            Location Notifications
          </Text>
          <Text className="text-gray-400 text-lg text-center mt-2">
            Location updates are only available for blind users
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
              accessibilityLabel="Mark all location notifications as read"
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
              accessibilityLabel="Clear all location notifications"
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
        accessibilityLabel="Location notifications list"
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="location-outline" size={80} color="#9CA3AF" />
            <Text 
              className="text-gray-500 text-xl mt-4 text-center font-medium"
              accessibilityLabel="No location notifications available"
            >
              No Location Updates
            </Text>
            <Text className="text-gray-400 text-lg text-center mt-2">
              Your location updates will appear here
            </Text>
          </View>
        ) : (
          <View>
            <Text 
              className="text-lg font-semibold text-gray-800 mb-4"
              accessibilityRole="header"
            >
              Location Updates ({notifications.length})
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

export default LocationNotificationsScreen;
