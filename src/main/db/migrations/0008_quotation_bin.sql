ALTER TABLE `quotation` ADD `deleted_at` text;
--> statement-breakpoint
CREATE INDEX `quotation_deleted_at_idx` ON `quotation` (`deleted_at`);
