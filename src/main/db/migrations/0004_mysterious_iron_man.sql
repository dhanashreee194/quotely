CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`datetime` text NOT NULL,
	`user` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text
);
--> statement-breakpoint
CREATE INDEX `audit_log_datetime_idx` ON `audit_log` (`datetime`);--> statement-breakpoint
CREATE INDEX `audit_log_action_idx` ON `audit_log` (`action`);