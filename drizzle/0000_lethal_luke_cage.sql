CREATE TABLE `moments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`raw_text` text NOT NULL,
	`project` text DEFAULT 'sod' NOT NULL,
	`status` text DEFAULT 'captured' NOT NULL,
	`scheduled_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `moments_user_created_idx` ON `moments` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `moments_user_status_idx` ON `moments` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `variants` (
	`id` text PRIMARY KEY NOT NULL,
	`moment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`platform` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`moment_id`) REFERENCES `moments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `variants_moment_platform_idx` ON `variants` (`moment_id`,`platform`);--> statement-breakpoint
CREATE INDEX `variants_user_idx` ON `variants` (`user_id`);