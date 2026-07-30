CREATE TABLE `analytics_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`event_type` text NOT NULL,
	`video_title` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `analytics_events_email_idx` ON `analytics_events` (`email`);--> statement-breakpoint
CREATE INDEX `analytics_events_type_idx` ON `analytics_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `analytics_events_created_idx` ON `analytics_events` (`created_at`);--> statement-breakpoint
CREATE TABLE `analytics_users` (
	`email` text PRIMARY KEY NOT NULL,
	`name` text,
	`first_seen` text NOT NULL,
	`last_seen` text NOT NULL,
	`access_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_admins` (
	`email` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL
);
