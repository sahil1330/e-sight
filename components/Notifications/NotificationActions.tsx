import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

interface NotificationActionsProps {
  totalUnreadCount: number;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const NotificationActions: React.FC<NotificationActionsProps> = ({
  totalUnreadCount,
  onMarkAllRead,
  onClearAll,
  onRefresh,
  isRefreshing = false,
}) => {
  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to permanently remove all notifications? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: onClearAll,
        },
      ],
      { 
        cancelable: true,
        userInterfaceStyle: 'light' // Ensure high contrast
      }
    );
  };

  const handleMarkAllRead = () => {
    if (totalUnreadCount === 0) {
      Alert.alert(
        'No Unread Notifications',
        'All notifications are already marked as read.',
        [{ text: 'OK' }],
        { userInterfaceStyle: 'light' }
      );
      return;
    }

    Alert.alert(
      'Mark All as Read',
      `Mark all ${totalUnreadCount} unread notifications as read?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Mark All Read',
          onPress: onMarkAllRead,
        },
      ],
      { 
        cancelable: true,
        userInterfaceStyle: 'light'
      }
    );
  };

  return (
    <View
      className="bg-white border-t border-gray-200 absolute bottom-0 left-0 right-0"
      style={{
        paddingBottom: 100, // Space for tab bar
        paddingTop: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 8,
      }}
    >
      {/* Header Section with Unread Count */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center flex-1">
          <Text className="text-lg font-semibold text-slate-800 mr-3">
            Notifications
          </Text>
          {totalUnreadCount > 0 && (
            <View
              className="bg-red-600 rounded-full px-3 py-1 min-w-[32px] items-center justify-center"
              accessibilityLabel={`${totalUnreadCount} total unread notifications`}
            >
              <Text className="text-white text-sm font-bold">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </Text>
            </View>
          )}
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          onPress={onRefresh}
          className="bg-gray-100 p-3 rounded-xl ml-3"
          accessibilityRole="button"
          accessibilityLabel="Refresh notifications"
          accessibilityHint="Reloads all notifications from storage"
          style={{ minHeight: 44, minWidth: 44 }}
          disabled={isRefreshing}
        >
          <Ionicons
            name="refresh"
            size={20}
            color={isRefreshing ? "#9CA3AF" : "#374151"} // gray-400 : gray-700
            style={{
              transform: [{ rotate: isRefreshing ? '180deg' : '0deg' }]
            }}
          />
        </TouchableOpacity>
      </View>

      {/* Action Buttons Row */}
      <View className="flex-row justify-between items-center">
        {/* Mark All Read Button */}
        <TouchableOpacity
          onPress={handleMarkAllRead}
          className={`flex-1 py-3 px-4 rounded-xl mr-3 ${
            totalUnreadCount > 0
              ? 'bg-blue-600'
              : 'bg-gray-300'
          }`}
          accessibilityRole="button"
          accessibilityLabel={`Mark all ${totalUnreadCount} notifications as read`}
          accessibilityHint="Marks all unread notifications as read"
          style={{ minHeight: 44 }}
          disabled={totalUnreadCount === 0}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons
              name="checkmark-done"
              size={18}
              color={totalUnreadCount > 0 ? "white" : "#6B7280"}
              style={{ marginRight: 8 }}
            />
            <Text
              className={`font-semibold text-base ${
                totalUnreadCount > 0
                  ? 'text-white'
                  : 'text-gray-500'
              }`}
            >
              Mark All Read
            </Text>
          </View>
        </TouchableOpacity>

        {/* Clear All Button */}
        <TouchableOpacity
          onPress={handleClearAll}
          className="flex-1 bg-red-600 py-3 px-4 rounded-xl"
          accessibilityRole="button"
          accessibilityLabel="Clear all notifications"
          accessibilityHint="Permanently removes all notifications. This action cannot be undone"
          style={{ minHeight: 44 }}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons
              name="trash"
              size={18}
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text className="text-white font-semibold text-base">
              Clear All
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Additional Info */}
      {totalUnreadCount === 0 && (
        <Text className="text-center text-gray-500 text-sm mt-3">
          All notifications are up to date
        </Text>
      )}
    </View>
  );
};

export default NotificationActions;
