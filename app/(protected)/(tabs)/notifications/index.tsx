import NotificationsList from '@/components/Notifications/NotificationsList';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const InAppNotifications = () => {
  const router = useRouter();
  const { authState } = useAuth();
  const { unreadCounts } = useNotifications();
  const userRole = authState?.userDetails?.role;

  const navigationItems = [
    {
      title: 'Emergency Alerts',
      icon: 'warning' as const,
      route: '/notifications/emergency_alerts',
      count: unreadCounts.emergency,
      color: '#DC2626',
      description: 'SOS and emergency notifications',
      available: true,
    },
    {
      title: 'Location Updates',
      icon: 'location' as const,
      route: '/notifications/location',
      count: unreadCounts.location,
      color: '#059669',
      description: 'Your location tracking updates',
      available: userRole !== 'caretaker',
    },
    {
      title: 'Device Status',
      icon: 'bluetooth' as const,
      route: '/notifications/device_connections',
      count: unreadCounts.device,
      color: '#2563EB',
      description: 'BLE device connection status',
      available: userRole !== 'caretaker',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="bg-blue-700 px-6 py-6 rounded-b-3xl">
        <Text
          className="text-white text-3xl font-bold"
          accessibilityRole="header"
          accessibilityLabel="Notifications screen"
        >
          Notifications
        </Text>
        <Text className="text-blue-100 text-lg mt-1">
          Stay updated with your e-sight system
        </Text>
      </View>

      {/* Quick Navigation */}
      <View className="px-4 py-4">
        <Text className="text-lg font-semibold text-gray-800 mb-3">
          Quick Access
        </Text>
        <View className="space-y-3">
          {navigationItems
            .filter(item => item.available)
            .map((item) => (
              <TouchableOpacity
                key={item.route}
                onPress={() => router.push(item.route as any)}
                className="bg-white rounded-xl p-4 flex-row items-center shadow-sm"
                accessibilityRole="button"
                accessibilityLabel={`${item.title} with ${item.count} unread notifications`}
                accessibilityHint={`Navigate to ${item.description}`}
                style={{ minHeight: 72 }}
              >
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mr-4"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <Ionicons
                    name={item.icon}
                    size={24}
                    color={item.color}
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900">
                    {item.title}
                  </Text>
                  <Text className="text-gray-600 text-base">
                    {item.description}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  {item.count > 0 && (
                    <View
                      className="bg-red-600 rounded-full px-3 py-1 min-w-[28px] items-center justify-center mr-3"
                      accessibilityLabel={`${item.count} unread notifications`}
                    >
                      <Text className="text-white text-sm font-bold">
                        {item.count > 99 ? '99+' : item.count}
                      </Text>
                    </View>
                  )}

                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#9CA3AF"
                  />
                </View>
              </TouchableOpacity>
            ))}
        </View>
      </View>

      {/* All Notifications List */}
      <View className="flex-1">
        <View className="px-4 pb-2">
          <Text className="text-lg font-semibold text-gray-800">
            All Notifications
          </Text>
        </View>
        <NotificationsList />
      </View>
    </SafeAreaView>
  );
};

export default InAppNotifications;