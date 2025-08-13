import { useEmergencyNotifications } from '@/hooks/useEmergencyNotifications';
import { formatNotificationTime, getNotificationPriorityColor } from '@/utils/notificationHelpers';
import { EmergencyNotification as EmergencyNotificationType } from '@/utils/notificationStorage';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface EmergencyNotificationProps {
  notification: EmergencyNotificationType;
  onPress: () => void;
  onDismiss: () => void;
  onAcknowledge?: () => void;
}

const EmergencyNotification: React.FC<EmergencyNotificationProps> = ({
  notification,
  onPress,
  onDismiss,
  onAcknowledge,
}) => {
  const { acknowledgeEmergencyAlert } = useEmergencyNotifications();
  const timeAgo = formatNotificationTime(notification.timestamp);
  const isUnread = !notification.isRead;
  const isCritical = notification.priority === 'critical';
  const isActive = notification.status === 'active';
  const priorityColor = getNotificationPriorityColor(notification.priority);

  const handleAcknowledge = async () => {
    try {
      await acknowledgeEmergencyAlert(notification.id);
      if (onAcknowledge) {
        onAcknowledge();
      }
    } catch (error) {
      console.error('Error acknowledging emergency alert:', error);
    }
  };

  const getAlertTypeIcon = () => {
    switch (notification.alertType) {
      case 'sos':
        return 'warning';
      case 'panic':
        return 'alert-circle';
      case 'medical':
        return 'medical';
      case 'fall_detection':
        return 'person';
      default:
        return 'warning';
    }
  };

  const getStatusColor = () => {
    switch (notification.status) {
      case 'active':
        return '#DC2626'; // red-600
      case 'acknowledged':
        return '#D97706'; // amber-600
      case 'resolved':
        return '#059669'; // emerald-600
      default:
        return '#6B7280'; // gray-500
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`p-4 mb-3 rounded-xl border-2 ${
        isCritical 
          ? 'bg-red-50 border-red-600' 
          : isUnread 
          ? 'bg-orange-50 border-orange-400' 
          : 'bg-white border-gray-300'
      }`}
      accessibilityRole="button"
      accessibilityLabel={`Emergency ${notification.alertType} alert. Status: ${notification.status}. Priority: ${notification.priority}. ${isUnread ? 'Unread' : 'Read'}. ${timeAgo}`}
      accessibilityHint="Tap to view emergency alert details"
      style={{ 
        minHeight: 100,
        shadowColor: isCritical ? '#DC2626' : '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isCritical ? 0.3 : 0.1,
        shadowRadius: 4,
        elevation: isCritical ? 6 : 2,
      }}
    >
      {/* Priority Indicator */}
      {isCritical && (
        <View className="absolute top-2 right-2">
          <View className="bg-red-600 rounded-full p-1">
            <Ionicons
              name="flash"
              size={16}
              color="white"
              accessibilityLabel="Critical priority"
            />
          </View>
        </View>
      )}

      <View className="flex-row items-start">
        {/* Alert Icon */}
        <View 
          className="mr-4 mt-1"
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: `${priorityColor}20`, // 20% opacity
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={getAlertTypeIcon() as any}
            size={28}
            color={priorityColor}
            accessibilityElementsHidden={true}
          />
        </View>

        {/* Alert Content */}
        <View className="flex-1 mr-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text 
              className={`text-xl font-bold ${
                isCritical ? 'text-red-800' : 'text-slate-900'
              }`}
              numberOfLines={1}
            >
              {notification.alertType.toUpperCase()} ALERT
            </Text>
            {isUnread && (
              <View 
                className={`w-4 h-4 rounded-full ml-2 ${
                  isCritical ? 'bg-red-600' : 'bg-orange-500'
                }`}
                accessibilityLabel="Unread indicator"
              />
            )}
          </View>
          
          {/* Status Badge */}
          <View className="flex-row items-center mb-2">
            <View 
              className="px-3 py-1 rounded-full mr-3"
              style={{ backgroundColor: `${getStatusColor()}20` }}
            >
              <Text 
                className="text-sm font-semibold"
                style={{ color: getStatusColor() }}
              >
                {notification.status.toUpperCase()}
              </Text>
            </View>
            
            <View 
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: `${priorityColor}20` }}
            >
              <Text 
                className="text-sm font-semibold"
                style={{ color: priorityColor }}
              >
                {notification.priority.toUpperCase()}
              </Text>
            </View>
          </View>
          
          {notification.details && (
            <Text 
              className={`text-base mb-2 ${
                isCritical ? 'text-red-700' : 'text-slate-700'
              }`}
              numberOfLines={2}
            >
              {notification.details}
            </Text>
          )}
          
          <Text className="text-sm text-slate-500">
            {timeAgo}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-col">
          {isActive && (
            <TouchableOpacity
              onPress={handleAcknowledge}
              className="bg-amber-600 px-3 py-2 rounded-lg mb-2"
              accessibilityRole="button"
              accessibilityLabel="Acknowledge emergency alert"
              accessibilityHint="Marks this emergency alert as acknowledged"
              style={{ minHeight: 44, minWidth: 80 }}
            >
              <Text className="text-white font-semibold text-sm text-center">
                Acknowledge
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={onDismiss}
            className="p-2 rounded-full"
            accessibilityRole="button"
            accessibilityLabel="Dismiss emergency alert"
            accessibilityHint="Removes this emergency alert permanently"
            style={{ minHeight: 44, minWidth: 44 }}
          >
            <Ionicons
              name="close"
              size={20}
              color="#6B7280" // gray-500
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default EmergencyNotification;
