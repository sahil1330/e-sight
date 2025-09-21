CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`timestamp` integer DEFAULT (unixepoch()) NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`latitude` real,
	`longitude` real,
	`alert_type` text,
	`status` text,
	`priority` text,
	`device_name` text,
	`device_id` text,
	`device_status` text,
	`details` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_type` ON `notifications` (`type`);--> statement-breakpoint
CREATE INDEX `idx_notifications_timestamp` ON `notifications` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_notifications_is_read` ON `notifications` (`is_read`);--> statement-breakpoint
CREATE INDEX `idx_notifications_device_id` ON `notifications` (`device_id`);--> statement-breakpoint
CREATE INDEX `idx_notifications_type_timestamp` ON `notifications` (`type`,`timestamp`);--> statement-breakpoint
CREATE TABLE `previous_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`device_name` text NOT NULL,
	`last_connected` integer NOT NULL,
	`connection_count` integer DEFAULT 1 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`device_info` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `previous_devices_device_id_unique` ON `previous_devices` (`device_id`);--> statement-breakpoint
CREATE INDEX `idx_previous_devices_device_id` ON `previous_devices` (`device_id`);--> statement-breakpoint
CREATE INDEX `idx_previous_devices_last_connected` ON `previous_devices` (`last_connected`);--> statement-breakpoint
CREATE INDEX `idx_previous_devices_is_active` ON `previous_devices` (`is_active`);--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`type` text DEFAULT 'string' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_settings_key_unique` ON `user_settings` (`key`);--> statement-breakpoint
CREATE INDEX `idx_user_settings_key` ON `user_settings` (`key`);