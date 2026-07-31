CREATE TABLE `content_videos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`minutes` integer NOT NULL,
	`media_key` text NOT NULL,
	`audiences` text NOT NULL,
	`levels` text NOT NULL,
	`topics` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_videos_media_key_unique` ON `content_videos` (`media_key`);--> statement-breakpoint
CREATE INDEX `content_videos_created_idx` ON `content_videos` (`created_at`);
