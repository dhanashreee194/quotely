CREATE TABLE `quotation_charge` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quotation_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`value` real NOT NULL,
	`applies_to_subtotal` integer DEFAULT true NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`quotation_id`) REFERENCES `quotation`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quotation_custom_value` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quotation_id` integer NOT NULL,
	`field_definition_id` integer NOT NULL,
	`value` text,
	FOREIGN KEY (`quotation_id`) REFERENCES `quotation`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`field_definition_id`) REFERENCES `custom_field_definition`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quotation_item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quotation_id` integer NOT NULL,
	`display_order` integer NOT NULL,
	`product_id` integer,
	`qty` real DEFAULT 0 NOT NULL,
	`rate` real DEFAULT 0 NOT NULL,
	`discount` real DEFAULT 0 NOT NULL,
	`discount_type` text DEFAULT 'fixed' NOT NULL,
	`tax_percent` real DEFAULT 0 NOT NULL,
	`amount` real DEFAULT 0 NOT NULL,
	`column_values` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`quotation_id`) REFERENCES `quotation`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `quotation` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`quotation_number` text NOT NULL,
	`date` text NOT NULL,
	`customer_id` integer NOT NULL,
	`template_id` integer NOT NULL,
	`status` text DEFAULT 'Draft' NOT NULL,
	`currency` text DEFAULT 'INR' NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`discount_total` real DEFAULT 0 NOT NULL,
	`tax_total` real DEFAULT 0 NOT NULL,
	`grand_total` real DEFAULT 0 NOT NULL,
	`notes_internal` text,
	`notes_customer` text,
	`parent_quotation_id` integer,
	`revision_number` integer DEFAULT 0 NOT NULL,
	`created_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`template_id`) REFERENCES `quotation_template`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quotation_number_uidx` ON `quotation` (`quotation_number`);--> statement-breakpoint
CREATE INDEX `quotation_date_idx` ON `quotation` (`date`);--> statement-breakpoint
CREATE INDEX `quotation_customer_idx` ON `quotation` (`customer_id`);--> statement-breakpoint
CREATE INDEX `quotation_status_idx` ON `quotation` (`status`);--> statement-breakpoint
CREATE INDEX `quotation_grand_total_idx` ON `quotation` (`grand_total`);