// Type adapters to convert SQLite notifications to the old interface format
// This provides backward compatibility for existing components

import { Notification as SQLiteNotification } from '@/db/schema';

// Legacy interfaces that components expect
export interface BaseNotification {
  id: string;
  timestamp: number;
  isRead: boolean;
}

export interface LocationNotification extends BaseNotification {
  type: 'location';
  latitude: number;
  longitude: number;
}

export interface EmergencyNotification extends BaseNotification {
  type: 'emergency';
  alertType: 'sos' | 'panic' | 'medical' | 'fall_detection';
  status: 'active' | 'resolved' | 'acknowledged';
  details?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface DeviceNotification extends BaseNotification {
  type: 'device';
  deviceName: string;
  deviceId: string;
  status: 'connected' | 'disconnected' | 'connection_failed' | 'pairing_started' | 'pairing_completed' | 'forgot_device';
  details?: string;
}

// Convert SQLite notification to legacy format
export function convertToLocationNotification(sqliteNotification: SQLiteNotification): LocationNotification | null {
  if (sqliteNotification.type !== 'location') return null;
  
  return {
    id: sqliteNotification.id,
    type: 'location' as const,
    timestamp: sqliteNotification.timestamp.getTime(),
    isRead: sqliteNotification.isRead,
    latitude: sqliteNotification.latitude || 0,
    longitude: sqliteNotification.longitude || 0,
  };
}

export function convertToEmergencyNotification(sqliteNotification: SQLiteNotification): EmergencyNotification | null {
  if (sqliteNotification.type !== 'emergency') return null;
  
  return {
    id: sqliteNotification.id,
    type: 'emergency' as const,
    timestamp: sqliteNotification.timestamp.getTime(),
    isRead: sqliteNotification.isRead,
    alertType: (sqliteNotification.alertType as 'sos' | 'panic' | 'medical' | 'fall_detection') || 'sos',
    status: (sqliteNotification.status as 'active' | 'resolved' | 'acknowledged') || 'active',
    priority: (sqliteNotification.priority as 'low' | 'medium' | 'high' | 'critical') || 'medium',
    details: sqliteNotification.details || undefined,
  };
}

export function convertToDeviceNotification(sqliteNotification: SQLiteNotification): DeviceNotification | null {
  if (sqliteNotification.type !== 'device') return null;
  
  return {
    id: sqliteNotification.id,
    type: 'device' as const,
    timestamp: sqliteNotification.timestamp.getTime(),
    isRead: sqliteNotification.isRead,
    deviceName: sqliteNotification.deviceName || 'Unknown Device',
    deviceId: sqliteNotification.deviceId || '',
    status: (sqliteNotification.deviceStatus as 'connected' | 'disconnected' | 'connection_failed' | 'pairing_started' | 'pairing_completed' | 'forgot_device') || 'disconnected',
    details: sqliteNotification.details || undefined,
  };
}

// Convert array of SQLite notifications to legacy format
export function convertToLocationNotifications(sqliteNotifications: SQLiteNotification[]): LocationNotification[] {
  return sqliteNotifications
    .map(convertToLocationNotification)
    .filter((notification): notification is LocationNotification => notification !== null);
}

export function convertToEmergencyNotifications(sqliteNotifications: SQLiteNotification[]): EmergencyNotification[] {
  return sqliteNotifications
    .map(convertToEmergencyNotification)
    .filter((notification): notification is EmergencyNotification => notification !== null);
}

export function convertToDeviceNotifications(sqliteNotifications: SQLiteNotification[]): DeviceNotification[] {
  return sqliteNotifications
    .map(convertToDeviceNotification)
    .filter((notification): notification is DeviceNotification => notification !== null);
}