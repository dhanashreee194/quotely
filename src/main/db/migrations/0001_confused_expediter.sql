CREATE TABLE `charge_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`value` real NOT NULL,
	`applies_to_subtotal` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `company_profile` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`logo_path` text,
	`address` text,
	`phone` text,
	`email` text,
	`website` text,
	`tax_reg_number` text,
	`pan_number` text,
	`bank_details` text,
	`authorized_signatory` text,
	`signature_path` text,
	`footer` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`company_name` text,
	`contact_person` text,
	`address` text,
	`phone` text,
	`email` text,
	`tax_number` text,
	`billing_address` text,
	`shipping_address` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`unit` text,
	`standard_price` real DEFAULT 0 NOT NULL,
	`tax_percent` real DEFAULT 0 NOT NULL,
	`category` text,
	`hsn_sac` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `terms_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`display_order` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
