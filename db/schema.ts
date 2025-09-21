import { sql } from "drizzle-orm";
import { index, int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Notifications table - unified table for all notification types
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["location", "emergency", "device"] }).notNull(),
  timestamp: int("timestamp", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  isRead: int("is_read", { mode: "boolean" }).notNull().default(false),
  
  // Location notification fields
  latitude: real("latitude"),
  longitude: real("longitude"),
  
  // Emergency notification fields
  alertType: text("alert_type", { enum: ["sos", "panic", "medical", "fall_detection"] }),
  status: text("status", { enum: ["active", "resolved", "acknowledged"] }),
  priority: text("priority", { enum: ["low", "medium", "high", "critical"] }),
  
  // Device notification fields
  deviceName: text("device_name"),
  deviceId: text("device_id"),
  deviceStatus: text("device_status", { 
    enum: ["connected", "disconnected", "connection_failed", "pairing_started", "pairing_completed", "forgot_device"] 
  }),
  
  // Common fields
  details: text("details"),
  
  // Metadata
  createdAt: int("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: int("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  // Indexes for performance
  typeIdx: index("idx_notifications_type").on(table.type),
  timestampIdx: index("idx_notifications_timestamp").on(table.timestamp),
  isReadIdx: index("idx_notifications_is_read").on(table.isRead),
  deviceIdIdx: index("idx_notifications_device_id").on(table.deviceId),
  typeTimestampIdx: index("idx_notifications_type_timestamp").on(table.type, table.timestamp),
}));

// Previous devices table for BLE device management
export const previousDevices = sqliteTable("previous_devices", {
  id: text("id").primaryKey(),
  deviceId: text("device_id").notNull().unique(),
  deviceName: text("device_name").notNull(),
  lastConnected: int("last_connected", { mode: "timestamp" }).notNull(),
  connectionCount: int("connection_count").notNull().default(1),
  isActive: int("is_active", { mode: "boolean" }).notNull().default(true),
  deviceInfo: text("device_info", { mode: "json" }), // Store additional device metadata
  createdAt: int("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: int("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  deviceIdIdx: index("idx_previous_devices_device_id").on(table.deviceId),
  lastConnectedIdx: index("idx_previous_devices_last_connected").on(table.lastConnected),
  isActiveIdx: index("idx_previous_devices_is_active").on(table.isActive),
}));

// User settings table for app preferences
export const userSettings = sqliteTable("user_settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  type: text("type", { enum: ["string", "number", "boolean", "json"] }).notNull().default("string"),
  createdAt: int("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: int("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  keyIdx: index("idx_user_settings_key").on(table.key),
}));

// Export types for TypeScript
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type PreviousDevice = typeof previousDevices.$inferSelect;
export type NewPreviousDevice = typeof previousDevices.$inferInsert;
export type UserSetting = typeof userSettings.$inferSelect;
export type NewUserSetting = typeof userSettings.$inferInsert;