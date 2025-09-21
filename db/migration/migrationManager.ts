import * as SecureStore from 'expo-secure-store';
import { NotificationController } from '../controllers/notificationController';
import { initializeDatabase } from '../index';

// SecureStore keys from the old system
const NOTIFICATION_KEYS = {
  LOCATION: 'location_notifications',
  EMERGENCY: 'emergency_notifications',
  DEVICE: 'device_notifications',
};

interface LegacyLocationNotification {
  id: string;
  message: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  address?: string;
  isRead?: boolean;
}

interface LegacyEmergencyNotification {
  id: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead?: boolean;
}

interface LegacyDeviceNotification {
  id: string;
  message: string;
  timestamp: Date;
  deviceId?: string;
  deviceName?: string;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  isRead?: boolean;
}

export class MigrationManager {
  
  // Main migration function
  static async migrateFromSecureStore(): Promise<{
    success: boolean;
    migrated: number;
    errors: string[];
  }> {
    const result = {
      success: false,
      migrated: 0,
      errors: [] as string[],
    };
    
    try {
      // Initialize the database
      await initializeDatabase();
      
      // Migrate each notification type
      const locationCount = await this.migrateLocationNotifications();
      const emergencyCount = await this.migrateEmergencyNotifications();
      const deviceCount = await this.migrateDeviceNotifications();
      
      result.migrated = locationCount + emergencyCount + deviceCount;
      result.success = true;
      
      // Migration completed successfully
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }
    
    return result;
  }
  
  // Migrate location notifications
  private static async migrateLocationNotifications(): Promise<number> {
    try {
      const rawData = await SecureStore.getItemAsync(NOTIFICATION_KEYS.LOCATION);
      if (!rawData) {
        return 0;
      }
      
      const legacyNotifications: LegacyLocationNotification[] = JSON.parse(rawData);
      let migratedCount = 0;
      
      for (const legacy of legacyNotifications) {
        try {
          await NotificationController.add({
            type: 'location',
            details: legacy.message,
            timestamp: new Date(legacy.timestamp),
            isRead: legacy.isRead || false,
            // Location-specific data
            latitude: legacy.latitude,
            longitude: legacy.longitude,
          });
          migratedCount++;
        } catch (error) {
          console.warn(`⚠️ Failed to migrate location notification ${legacy.id}:`, error);
        }
      }
      
      return migratedCount;
    } catch (error) {
      console.error('❌ Error migrating location notifications:', error);
      return 0;
    }
  }
  
  // Migrate emergency notifications
  private static async migrateEmergencyNotifications(): Promise<number> {
    try {
      const rawData = await SecureStore.getItemAsync(NOTIFICATION_KEYS.EMERGENCY);
      if (!rawData) {
        return 0;
      }
      
      const legacyNotifications: LegacyEmergencyNotification[] = JSON.parse(rawData);
      let migratedCount = 0;
      
      for (const legacy of legacyNotifications) {
        try {
          await NotificationController.add({
            type: 'emergency',
            details: legacy.message,
            timestamp: new Date(legacy.timestamp),
            isRead: legacy.isRead || false,
            // Emergency-specific data
            priority: legacy.severity,
          });
          migratedCount++;
        } catch (error) {
          console.warn(`⚠️ Failed to migrate emergency notification ${legacy.id}:`, error);
        }
      }
      
      return migratedCount;
    } catch (error) {
      console.error('❌ Error migrating emergency notifications:', error);
      return 0;
    }
  }
  
  // Migrate device notifications
  private static async migrateDeviceNotifications(): Promise<number> {
    try {
      const rawData = await SecureStore.getItemAsync(NOTIFICATION_KEYS.DEVICE);
      if (!rawData) {
        return 0;
      }
      
      const legacyNotifications: LegacyDeviceNotification[] = JSON.parse(rawData);
      let migratedCount = 0;
      
      for (const legacy of legacyNotifications) {
        try {
          await NotificationController.add({
            type: 'device',
            details: legacy.message,
            timestamp: new Date(legacy.timestamp),
            isRead: legacy.isRead || false,
            // Device-specific data
            deviceId: legacy.deviceId,
            deviceName: legacy.deviceName,
            deviceStatus: MigrationManager.mapConnectionStatus(legacy.connectionStatus),
          });
          migratedCount++;
        } catch (error) {
          console.warn(`⚠️ Failed to migrate device notification ${legacy.id}:`, error);
        }
      }
      
      return migratedCount;
    } catch (error) {
      console.error('❌ Error migrating device notifications:', error);
      return 0;
    }
  }
  
  // Check if migration is needed
  static async isMigrationNeeded(): Promise<boolean> {
    try {
      // Check if any SecureStore data exists
      const [locationData, emergencyData, deviceData] = await Promise.all([
        SecureStore.getItemAsync(NOTIFICATION_KEYS.LOCATION),
        SecureStore.getItemAsync(NOTIFICATION_KEYS.EMERGENCY),
        SecureStore.getItemAsync(NOTIFICATION_KEYS.DEVICE),
      ]);
      
      return !!(locationData || emergencyData || deviceData);
    } catch (error) {
      console.error('❌ Error checking migration status:', error);
      return false;
    }
  }
  
  // Clean up SecureStore data after successful migration
  static async cleanupSecureStore(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(NOTIFICATION_KEYS.LOCATION).catch(() => {}),
        SecureStore.deleteItemAsync(NOTIFICATION_KEYS.EMERGENCY).catch(() => {}),
        SecureStore.deleteItemAsync(NOTIFICATION_KEYS.DEVICE).catch(() => {}),
      ]);
      
      // SecureStore cleanup completed
    } catch (error) {
      console.error('❌ Error cleaning up SecureStore:', error);
    }
  }
  
  // Get migration preview (how many notifications would be migrated)
  static async getMigrationPreview(): Promise<{
    location: number;
    emergency: number;
    device: number;
    total: number;
  }> {
    try {
      const [locationData, emergencyData, deviceData] = await Promise.all([
        SecureStore.getItemAsync(NOTIFICATION_KEYS.LOCATION),
        SecureStore.getItemAsync(NOTIFICATION_KEYS.EMERGENCY),
        SecureStore.getItemAsync(NOTIFICATION_KEYS.DEVICE),
      ]);
      
      const locationCount = locationData ? JSON.parse(locationData).length : 0;
      const emergencyCount = emergencyData ? JSON.parse(emergencyData).length : 0;
      const deviceCount = deviceData ? JSON.parse(deviceData).length : 0;
      
      return {
        location: locationCount,
        emergency: emergencyCount,
        device: deviceCount,
        total: locationCount + emergencyCount + deviceCount,
      };
    } catch (error) {
      console.error('❌ Error getting migration preview:', error);
      return { location: 0, emergency: 0, device: 0, total: 0 };
    }
  }
  
  // Backup existing SecureStore data before migration
  static async backupSecureStoreData(): Promise<{ success: boolean; backupData?: any; error?: string }> {
    try {
      const [locationData, emergencyData, deviceData] = await Promise.all([
        SecureStore.getItemAsync(NOTIFICATION_KEYS.LOCATION),
        SecureStore.getItemAsync(NOTIFICATION_KEYS.EMERGENCY),
        SecureStore.getItemAsync(NOTIFICATION_KEYS.DEVICE),
      ]);
      
      const backupData = {
        timestamp: new Date().toISOString(),
        location: locationData ? JSON.parse(locationData) : [],
        emergency: emergencyData ? JSON.parse(emergencyData) : [],
        device: deviceData ? JSON.parse(deviceData) : [],
      };
      
      // Store backup in SecureStore with a special key
      await SecureStore.setItemAsync('notification_backup', JSON.stringify(backupData));
      
      // Created backup of SecureStore data
      return { success: true, backupData };
    } catch (error) {
      console.error('❌ Error creating backup:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  // Helper method to map old connection status to new device status
  private static mapConnectionStatus(
    oldStatus: 'connected' | 'disconnected' | 'connecting' | 'error'
  ): 'connected' | 'disconnected' | 'connection_failed' | 'pairing_started' | 'pairing_completed' | 'forgot_device' {
    switch (oldStatus) {
      case 'connected':
        return 'connected';
      case 'disconnected':
        return 'disconnected';
      case 'connecting':
        return 'pairing_started';
      case 'error':
        return 'connection_failed';
      default:
        return 'disconnected';
    }
  }
}