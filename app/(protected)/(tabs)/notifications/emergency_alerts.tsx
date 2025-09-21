import EmergencyNotificationComponent from '@/components/Notifications/EmergencyNotification';
import { useNotifications } from '@/context/NotificationContext';
import { useEmergencyNotifications } from '@/hooks/useEmergencyNotifications';
import {
    clearEmergencyNotifications,
    getEmergencyNotifications,
    markAllEmergencyNotificationsAsRead,
    markEmergencyNotificationAsRead,
    removeEmergencyNotification,
} from '@/utils/notificationHelpers';
import { EmergencyNotification } from '@/utils/notificationTypeAdapters';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EmergencyAlertsScreen = () => {
  const { refreshUnreadCounts, announceNewNotification } = useNotifications();
  const { acknowledgeEmergencyAlert } = useEmergencyNotifications();

  const [notifications, setNotifications] = useState<EmergencyNotification[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load emergency notifications
  const loadNotifications = useCallback(async () => {
    try {
      const data = await getEmergencyNotifications();
      setNotifications(data);
      await refreshUnreadCounts();
    } catch (error) {
      console.error('Error loading emergency notifications:', error);
    }
  }, [refreshUnreadCounts]);

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
  const handleNotificationPress = async (notification: EmergencyNotification) => {
    if (!notification.isRead) {
      try {
        await markEmergencyNotificationAsRead(notification.id);
        await announceNewNotification('Emergency notification marked as read');
        await loadNotifications();
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleNotificationDismiss = async (notification: EmergencyNotification) => {
    try {
      await removeEmergencyNotification(notification.id);
      await announceNewNotification('Emergency notification dismissed');
      await loadNotifications();
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const handleAcknowledge = async (notification: EmergencyNotification) => {
    try {
      await acknowledgeEmergencyAlert(notification.id);
      await announceNewNotification('Emergency alert acknowledged');
      await loadNotifications();
    } catch (error) {
      console.error('Error acknowledging emergency alert:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllEmergencyNotificationsAsRead();
      await announceNewNotification('All emergency notifications marked as read');
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearEmergencyNotifications();
      await announceNewNotification('All emergency notifications cleared');
      await loadNotifications();
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

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
              accessibilityLabel="Mark all emergency notifications as read"
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
              accessibilityLabel="Clear all emergency notifications"
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
        accessibilityLabel="Emergency notifications list"
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="warning-outline" size={80} color="#9CA3AF" />
            <Text 
              className="text-gray-500 text-xl mt-4 text-center font-medium"
              accessibilityLabel="No emergency notifications available"
            >
              No Emergency Alerts
            </Text>
            <Text className="text-gray-400 text-lg text-center mt-2">
              Emergency alerts and SOS notifications will appear here
            </Text>
          </View>
        ) : (
          <View>
            <Text 
              className="text-lg font-semibold text-gray-800 mb-4"
              accessibilityRole="header"
            >
              Emergency Alerts ({notifications.length})
            </Text>
            
            {notifications.map((notification) => (
              <EmergencyNotificationComponent
                key={notification.id}
                notification={notification}
                onPress={() => handleNotificationPress(notification)}
                onDismiss={() => handleNotificationDismiss(notification)}
                onAcknowledge={() => handleAcknowledge(notification)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default EmergencyAlertsScreen;
