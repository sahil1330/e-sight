import { useEffect } from 'react';
import { useSocket } from '@/context/SocketProvider';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';

// Hook to handle real-time emergency notifications via socket
export const useEmergencyNotifications = () => {
  const { socket } = useSocket();
  const { addEmergencyAlert } = useNotifications();
  const { authState } = useAuth();

  useEffect(() => {
    if (!socket || !authState?.userDetails) return;

    // Listen for emergency alerts from the server
    const handleEmergencyAlert = async (data: {
      alertType: 'sos' | 'panic' | 'medical' | 'fall_detection';
      status: 'active' | 'resolved' | 'acknowledged';
      priority: 'low' | 'medium' | 'high' | 'critical';
      details?: string;
      userId?: string;
      userName?: string;
    }) => {
      try {
        // Add emergency notification to local storage
        await addEmergencyAlert(
          data.alertType,
          data.status,
          data.priority,
          data.details || `Emergency alert${data.userName ? ` from ${data.userName}` : ''}`
        );
      } catch (error) {
        console.error('Error handling emergency alert:', error);
      }
    };

    // Listen for SOS alerts specifically
    const handleSOSAlert = async (data: {
      userId: string;
      userName?: string;
      location?: {
        latitude: number;
        longitude: number;
      };
      timestamp: number;
    }) => {
      try {
        const details = `SOS alert${data.userName ? ` from ${data.userName}` : ''}${
          data.location 
            ? ` at coordinates ${data.location.latitude.toFixed(6)}, ${data.location.longitude.toFixed(6)}` 
            : ''
        }`;

        await addEmergencyAlert(
          'sos',
          'active',
          'critical',
          details
        );
      } catch (error) {
        console.error('Error handling SOS alert:', error);
      }
    };

    // Listen for emergency status updates
    const handleEmergencyStatusUpdate = async (data: {
      alertId: string;
      status: 'active' | 'resolved' | 'acknowledged';
      updatedBy?: string;
    }) => {
      try {
        const details = `Emergency status updated to ${data.status}${
          data.updatedBy ? ` by ${data.updatedBy}` : ''
        }`;

        await addEmergencyAlert(
          'sos', // Default type for status updates
          data.status,
          data.status === 'resolved' ? 'medium' : 'high',
          details
        );
      } catch (error) {
        console.error('Error handling emergency status update:', error);
      }
    };

    // Register socket event listeners
    socket.on('emergencyAlert', handleEmergencyAlert);
    socket.on('sosAlert', handleSOSAlert);
    socket.on('emergencyStatusUpdate', handleEmergencyStatusUpdate);

    // Join user's room for receiving notifications
    if (authState.userDetails._id) {
      socket.emit('joinRoom', authState.userDetails._id);
    }

    // Cleanup function
    return () => {
      socket.off('emergencyAlert', handleEmergencyAlert);
      socket.off('sosAlert', handleSOSAlert);
      socket.off('emergencyStatusUpdate', handleEmergencyStatusUpdate);
    };
  }, [socket, addEmergencyAlert, authState?.userDetails]);

  // Function to send emergency alert via socket
  const sendEmergencyAlert = async (
    alertType: 'sos' | 'panic' | 'medical' | 'fall_detection',
    details?: string
  ) => {
    if (!socket || !authState?.userDetails) {
      throw new Error('Socket not connected or user not authenticated');
    }

    try {
      // Emit emergency alert to server
      socket.emit('emergencyAlert', {
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

      return { success: true };
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // Function to acknowledge emergency alert
  const acknowledgeEmergencyAlert = async (alertId: string) => {
    if (!socket || !authState?.userDetails) {
      throw new Error('Socket not connected or user not authenticated');
    }

    try {
      socket.emit('emergencyStatusUpdate', {
        alertId,
        status: 'acknowledged',
        updatedBy: authState.userDetails.fullName,
        timestamp: Date.now(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error acknowledging emergency alert:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // Function to resolve emergency alert
  const resolveEmergencyAlert = async (alertId: string) => {
    if (!socket || !authState?.userDetails) {
      throw new Error('Socket not connected or user not authenticated');
    }

    try {
      socket.emit('emergencyStatusUpdate', {
        alertId,
        status: 'resolved',
        updatedBy: authState.userDetails.fullName,
        timestamp: Date.now(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error resolving emergency alert:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  return {
    sendEmergencyAlert,
    acknowledgeEmergencyAlert,
    resolveEmergencyAlert,
  };
};
