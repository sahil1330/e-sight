import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NotificationCategoryProps {
  title: string;
  unreadCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  onClearAll: () => void;
  onMarkAllRead: () => void;
  children: React.ReactNode;
  accessibilityLabel?: string;
}

const NotificationCategory: React.FC<NotificationCategoryProps> = ({
  title,
  unreadCount,
  isExpanded,
  onToggle,
  onClearAll,
  onMarkAllRead,
  children,
  accessibilityLabel,
}) => {
  return (
    <View className="mb-6">
      {/* Category Header */}
      <TouchableOpacity
        onPress={onToggle}
        className="flex-row items-center justify-between bg-slate-100 px-6 py-4 rounded-xl mb-3"
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || `${title} section with ${unreadCount} unread notifications`}
        accessibilityHint={`Tap to ${isExpanded ? 'collapse' : 'expand'} ${title} notifications`}
        style={{ minHeight: 56 }} // Ensure minimum touch target
      >
        <View className="flex-row items-center flex-1">
          <Text className="text-xl font-bold text-slate-800 mr-3">
            {title}
          </Text>
          {unreadCount > 0 && (
            <View 
              className="bg-red-600 rounded-full px-3 py-1 min-w-[28px] items-center justify-center"
              accessibilityLabel={`${unreadCount} unread notifications`}
            >
              <Text className="text-white text-sm font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
        
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#475569" // slate-600
          accessibilityElementsHidden={true}
        />
      </TouchableOpacity>

      {/* Category Actions */}
      {isExpanded && (
        <View className="flex-row justify-end mb-3 px-2">
          <TouchableOpacity
            onPress={onMarkAllRead}
            className="bg-blue-600 px-4 py-2 rounded-lg mr-3"
            accessibilityRole="button"
            accessibilityLabel={`Mark all ${title} notifications as read`}
            accessibilityHint="Marks all notifications in this category as read"
            style={{ minHeight: 44 }}
          >
            <Text className="text-white font-semibold text-base">
              Mark All Read
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={onClearAll}
            className="bg-red-600 px-4 py-2 rounded-lg"
            accessibilityRole="button"
            accessibilityLabel={`Clear all ${title} notifications`}
            accessibilityHint="Permanently removes all notifications in this category"
            style={{ minHeight: 44 }}
          >
            <Text className="text-white font-semibold text-base">
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Category Content */}
      {isExpanded && (
        <View>
          {children}
        </View>
      )}
    </View>
  );
};

export default NotificationCategory;
