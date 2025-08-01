import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const InAppNotifications = () => {
  const notifications = [
    {
      id: 1,
      type: 'location',
      title: 'Location Update',
      message: 'Your location is being shared with caretakers',
      time: '2 min ago',
      read: false,
    },
    {
      id: 2,
      type: 'device',
      title: 'Device Connected',
      message: 'Navigation device successfully connected',
      time: '10 min ago',
      read: true,
    },
    {
      id: 3,
      type: 'emergency',
      title: 'Emergency Alert Sent',
      message: 'Emergency notification sent to all caretakers',
      time: '1 hour ago',
      read: true,
    },
  ];

  const getIconName = (type: string) => {
    switch (type) {
      case 'location':
        return 'location';
      case 'device':
        return 'bluetooth';
      case 'emergency':
        return 'warning';
      default:
        return 'notifications';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'location':
        return '#3B82F6';
      case 'device':
        return '#059669';
      case 'emergency':
        return '#DC2626';
      default:
        return '#6B7280';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-blue-700 px-6 py-6 rounded-b-3xl">
        <Text 
          className="text-white text-3xl font-bold"
          accessibilityRole="header"
        >
          Notifications
        </Text>
        <Text className="text-blue-100 text-lg mt-1">
          Stay updated with your e-sight system
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 mt-6">
        {notifications.length > 0 ? (
          <View className="space-y-4">
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                className={`bg-white rounded-2xl p-6 shadow-sm ${
                  !notification.read ? 'border-l-4 border-blue-500' : ''
                }`}
                accessibilityRole="button"
                accessibilityLabel={`${notification.title}. ${notification.message}. ${notification.time}. ${
                  notification.read ? 'Read' : 'Unread'
                }`}
              >
                <View className="flex-row items-start">
                  <View 
                    className={`w-12 h-12 rounded-full items-center justify-center mr-4`}
                    style={{ backgroundColor: `${getIconColor(notification.type)}20` }}
                  >
                    <Ionicons 
                      name={getIconName(notification.type) as any} 
                      size={24} 
                      color={getIconColor(notification.type)} 
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-lg font-semibold text-gray-800">
                        {notification.title}
                      </Text>
                      {!notification.read && (
                        <View className="w-3 h-3 rounded-full bg-blue-500" />
                      )}
                    </View>
                    <Text className="text-gray-600 text-base mb-2">
                      {notification.message}
                    </Text>
                    <Text className="text-gray-400 text-sm">
                      {notification.time}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="notifications-outline" size={80} color="#9CA3AF" />
            <Text 
              className="text-gray-500 text-xl mt-4 text-center font-medium"
              accessibilityLabel="No notifications available. You will see important updates and alerts here."
            >
              No notifications yet
            </Text>
            <Text className="text-gray-400 text-lg text-center mt-2">
              You&apos;ll see important updates and alerts here
            </Text>
          </View>
        )}

        {/* Settings Button */}
        <TouchableOpacity
          className="bg-white rounded-2xl p-6 shadow-sm mt-6 mb-8"
          accessibilityRole="button"
          accessibilityLabel="Notification settings"
        >
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-4">
              <Ionicons name="settings" size={24} color="#6B7280" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-800">
                Notification Settings
              </Text>
              <Text className="text-gray-600 text-base">
                Manage your notification preferences
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default InAppNotifications;