import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
import * as schema from './schema';

// Open the database
const expoDb = SQLite.openDatabaseSync('esight.db');

// Create drizzle instance
export const db = drizzle(expoDb, { schema });

// Initialize database tables
export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('🗄️ Initializing database...');
    
    // Create tables using the generated SQL
    // This is a simple approach - tables will be created if they don't exist
    await db.run(sql`CREATE TABLE IF NOT EXISTS notifications (
      id text PRIMARY KEY NOT NULL,
      type text NOT NULL,
      timestamp integer DEFAULT (unixepoch()) NOT NULL,
      is_read integer DEFAULT false NOT NULL,
      latitude real,
      longitude real,
      alert_type text,
      status text,
      priority text,
      device_name text,
      device_id text,
      device_status text,
      details text,
      created_at integer DEFAULT (unixepoch()) NOT NULL,
      updated_at integer DEFAULT (unixepoch()) NOT NULL
    )`);
    
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications (type)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications (timestamp)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_notifications_device_id ON notifications (device_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_notifications_type_timestamp ON notifications (type, timestamp)`);
    
    await db.run(sql`CREATE TABLE IF NOT EXISTS previous_devices (
      id text PRIMARY KEY NOT NULL,
      device_id text NOT NULL UNIQUE,
      device_name text NOT NULL,
      last_connected integer NOT NULL,
      connection_count integer DEFAULT 1 NOT NULL,
      is_active integer DEFAULT true NOT NULL,
      device_info text,
      created_at integer DEFAULT (unixepoch()) NOT NULL,
      updated_at integer DEFAULT (unixepoch()) NOT NULL
    )`);
    
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_previous_devices_device_id ON previous_devices (device_id)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_previous_devices_last_connected ON previous_devices (last_connected)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_previous_devices_is_active ON previous_devices (is_active)`);
    
    await db.run(sql`CREATE TABLE IF NOT EXISTS user_settings (
      id text PRIMARY KEY NOT NULL,
      key text NOT NULL UNIQUE,
      value text NOT NULL,
      type text DEFAULT 'string' NOT NULL,
      created_at integer DEFAULT (unixepoch()) NOT NULL,
      updated_at integer DEFAULT (unixepoch()) NOT NULL
    )`);
    
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_user_settings_key ON user_settings (key)`);
    
    console.log('✅ Database initialized successfully');
    
    // Log database stats
    const stats = await getDatabaseStats();
    console.log('📊 Database stats:', stats);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Database utility functions
export const resetDatabase = async (): Promise<void> => {
  try {
    // Drop all tables and recreate
    await db.run(sql`DROP TABLE IF EXISTS notifications`);
    await db.run(sql`DROP TABLE IF EXISTS previous_devices`);
    await db.run(sql`DROP TABLE IF EXISTS user_settings`);
    
    // Re-run migrations
    await initializeDatabase();
    
    console.log('🔄 Database reset successfully');
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
};

export const getDatabaseStats = async (): Promise<{
  notifications: number;
  devices: number;
  settings: number;
}> => {
  try {
    const notificationCount = await db.select({ count: sql<number>`count(*)` }).from(schema.notifications);
    const deviceCount = await db.select({ count: sql<number>`count(*)` }).from(schema.previousDevices);
    const settingsCount = await db.select({ count: sql<number>`count(*)` }).from(schema.userSettings);
    
    return {
      notifications: notificationCount[0]?.count || 0,
      devices: deviceCount[0]?.count || 0,
      settings: settingsCount[0]?.count || 0,
    };
  } catch (error) {
    console.error('❌ Error getting database stats:', error);
    return { notifications: 0, devices: 0, settings: 0 };
  }
};

export { schema };
