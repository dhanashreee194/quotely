CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`password_hash` text NOT NULL,
	`quote_prefix` text NOT NULL,
	`next_sequence` integer DEFAULT 1 NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_uidx` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_quote_prefix_uidx` ON `users` (`quote_prefix`);
