CREATE TABLE `custom_field_definition` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`template_id` integer NOT NULL,
	`section_id` integer NOT NULL,
	`field_key` text NOT NULL,
	`label` text NOT NULL,
	`type` text NOT NULL,
	`required` integer DEFAULT false NOT NULL,
	`default_value` text,
	`display_order` integer NOT NULL,
	`print_visible` integer DEFAULT true NOT NULL,
	`read_only` integer DEFAULT false NOT NULL,
	`config` text,
	FOREIGN KEY (`template_id`) REFERENCES `quotation_template`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `template_section`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `custom_field_option` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`field_definition_id` integer NOT NULL,
	`label` text NOT NULL,
	`value` text NOT NULL,
	`display_order` integer NOT NULL,
	FOREIGN KEY (`field_definition_id`) REFERENCES `custom_field_definition`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `item_column_definition` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`template_id` integer NOT NULL,
	`label` text NOT NULL,
	`column_key` text NOT NULL,
	`data_type` text NOT NULL,
	`display_order` integer NOT NULL,
	`width` integer,
	`required` integer DEFAULT false NOT NULL,
	`visible` integer DEFAULT true NOT NULL,
	`print_include` integer DEFAULT true NOT NULL,
	`participates_in_calc` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `quotation_template`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `quotation_template` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `template_section` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`template_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`display_order` integer NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `quotation_template`(`id`) ON UPDATE no action ON DELETE cascade
);
