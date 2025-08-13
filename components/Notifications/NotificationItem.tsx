import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  DeviceNotification, 
  EmergencyNotification, 
  LocationNotification, 
  Notification 
} from '@/utils/notificationStorage';
import { 
  formatNotificationTime, 
  getDeviceStatusColor, 
  getNotificationPriorityColor 
} from '@/utils/notificationHelpers';

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
  onDismiss: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onDismiss,
}) => {
  const getNotificationContent = () => {
    switch (notification.type) {
      case 'location':
        const locationNotif = notification as LocationNotification;
        return {
          icon: 'location' as const,
          iconColor: '#059669', // emerald-600
          title: 'Location Update',
          description: `Coordinates: ${locationNotif.latitude.toFixed(6)}, ${locationNotif.longitude.toFixed(6)}`,
          accessibilityLabel: `Location update notification. Coordinates: ${locationNotif.latitude.toFixed(6)}, ${locationNotif.longitude.toFixed(6)}`,
        };

      case 'emergency':
        const emergencyNotif = notification as EmergencyNotification;
        return {
          icon: 'warning' as const,
          iconColor: getNotificationPriorityColor(emergencyNotif.priority),
          title: `${emergencyNotif.alertType.toUpperCase()} Alert`,
          description: `Status: ${emergencyNotif.status}${emergencyNotif.details ? ` - ${emergencyNotif.details}` : ''}`,
          accessibilityLabel: `Emergency alert notification. ${emergencyNotif.alertType} alert with status ${emergencyNotif.status}. Priority: ${emergencyNotif.priority}`,
        };

      case 'device':
        const deviceNotif = notification as DeviceNotification;
        return {
          icon: 'bluetooth' as const,
          iconColor: getDeviceStatusColor(deviceNotif.status),
          title: `Device: ${deviceNotif.deviceName}`,
          description: `Status: ${deviceNotif.status.replace('_', ' ')}${deviceNotif.details ? ` - ${deviceNotif.details}` : ''}`,
          accessibilityLabel: `Device status notification. ${deviceNotif.deviceName} is ${deviceNotif.status.replace('_', ' ')}`,
        };

      default:
        return {
          icon: 'notifications' as const,
          iconColor: '#6B7280', // gray-500
          title: 'Notification',
          description: 'Unknown notification type',
          accessibilityLabel: 'Unknown notification',
        };
    }
  };

  const content = getNotificationContent();
  const timeAgo = formatNotificationTime(notification.timestamp);
  const isUnread = !notification.isRead;

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-start p-4 mb-3 rounded-xl border-l-4 ${
        isUnread 
          ? 'bg-blue-50 border-l-blue-600' 
          : 'bg-white border-l-gray-300'
      }`}
      accessibilityRole="button"
      accessibilityLabel={`${content.accessibilityLabel}. ${isUnread ? 'Unread' : 'Read'}. ${timeAgo}`}
      accessibilityHint="Tap to mark as read or view details"
      style={{ 
        minHeight: 80,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      {/* Notification Icon */}
      <View 
        className="mr-4 mt-1"
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: `${content.iconColor}20`, // 20% opacity
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons
          name={content.icon}
          size={24}
          color={content.iconColor}
          accessibilityElementsHidden={true}
        />
      </View>

      {/* Notification Content */}
      <View className="flex-1 mr-3">
        <View className="flex-row items-center justify-between mb-1">
          <Text 
            className={`text-lg font-semibold ${
              isUnread ? 'text-slate-900' : 'text-slate-700'
            }`}
            numberOfLines={1}
          >
            {content.title}
          </Text>
          {isUnread && (
            <View 
              className="w-3 h-3 bg-blue-600 rounded-full ml-2"
              accessibilityLabel="Unread indicator"
            />
          )}
        </View>
        
        <Text 
          className={`text-base ${
            isUnread ? 'text-slate-700' : 'text-slate-500'
          } mb-2`}
          numberOfLines={2}
        >
          {content.description}
        </Text>
        
        <Text className="text-sm text-slate-500">
          {timeAgo}
        </Text>
      </View>

      {/* Dismiss Button */}
      <TouchableOpacity
        onPress={onDismiss}
        className="p-2 rounded-full"
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
        accessibilityHint="Removes this notification permanently"
        style={{ minHeight: 44, minWidth: 44 }}
      >
        <Ionicons
          name="close"
          size={20}
          color="#6B7280" // gray-500
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default NotificationItem;
