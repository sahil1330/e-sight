import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import axiosInstance from '@/utils/axiosInstance';

// Hook to handle emergency notifications via REST API
// Note: Real-time socket notifications removed - using REST API and push notifications
export const useEmergencyNotifications = () => {
  const { addEmergencyAlert } = useNotifications();
  const { authState } = useAuth();

  // Function to send emergency alert via REST API
  const sendEmergencyAlert = async (
    alertType: 'sos' | 'panic' | 'medical' | 'fall_detection',
    details?: string
  ) => {
    if (!authState?.userDetails) {
      throw new Error('User not authenticated');
    }

    try {
      // Send emergency alert to server via REST API
      const response = await axiosInstance.post('/emergency/alert', {
        userId: authState.userDetails._id,
        userName: authState.userDetails.fullName,
        alertType,
        status: 'active',
        priority: alertType === 'sos' ? 'critical' : 'high',
        details,
        timestamp: Date.now(),
      });

      // Add to local notifications
      await addEmergencyAlert(
        alertType,
        'active',
        alertType === 'sos' ? 'critical' : 'high',
        details || `${alertType.toUpperCase()} alert sent`
      );

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  // Function to acknowledge emergency alert
  const acknowledgeEmergencyAlert = async (alertId: string) => {
    if (!authState?.userDetails) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await axiosInstance.patch(`/emergency/alert/${alertId}`, {
        status: 'acknowledged',
        updatedBy: authState.userDetails.fullName,
        timestamp: Date.now(),
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error acknowledging emergency alert:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  // Function to resolve emergency alert
  const resolveEmergencyAlert = async (alertId: string) => {
    if (!authState?.userDetails) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await axiosInstance.patch(`/emergency/alert/${alertId}`, {
        status: 'resolved',
        updatedBy: authState.userDetails.fullName,
        timestamp: Date.now(),
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error resolving emergency alert:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  // Function to fetch emergency alerts (for polling if needed)
  const fetchEmergencyAlerts = async () => {
    if (!authState?.userDetails) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await axiosInstance.get(`/emergency/alerts/${authState.userDetails._id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching emergency alerts:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  return {
    sendEmergencyAlert,
    acknowledgeEmergencyAlert,
    resolveEmergencyAlert,
    fetchEmergencyAlerts,
  };
};
