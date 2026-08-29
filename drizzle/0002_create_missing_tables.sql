CREATE TABLE IF NOT EXISTS `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text REFERENCES `user`(`id`) ON DELETE cascade,
	`household_id` text REFERENCES `households`(`id`) ON DELETE cascade,
	`name` text NOT NULL,
	`reg_number` text,
	`tax_number` text,
	`company_type` text DEFAULT 'subsidiary' NOT NULL,
	`address` text,
	`email` text,
	`phone` text,
	`ownership_details` text,
	`logo_url` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);

CREATE TABLE IF NOT EXISTS `expense_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text REFERENCES `user`(`id`) ON DELETE cascade,
	`household_id` text REFERENCES `households`(`id`) ON DELETE cascade,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`icon` text DEFAULT 'Tag',
	`color` text DEFAULT 'coral',
	`keywords` text DEFAULT '',
	`is_default` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);

CREATE TABLE IF NOT EXISTS `company_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL REFERENCES `companies`(`id`) ON DELETE cascade,
	`title` text NOT NULL,
	`document_type` text DEFAULT 'general',
	`file_url` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);

CREATE TABLE IF NOT EXISTS `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text REFERENCES `user`(`id`) ON DELETE cascade,
	`household_id` text REFERENCES `households`(`id`) ON DELETE cascade,
	`invoice_number` text NOT NULL,
	`from_company_id` text REFERENCES `companies`(`id`) ON DELETE set null,
	`to_company_id` text REFERENCES `companies`(`id`) ON DELETE set null,
	`issue_date` integer NOT NULL,
	`due_date` integer NOT NULL,
	`status` text DEFAULT 'draft',
	`subtotal_cents` integer DEFAULT 0 NOT NULL,
	`vat_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);

CREATE TABLE IF NOT EXISTS `invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL REFERENCES `invoices`(`id`) ON DELETE cascade,
	`expense_id` text REFERENCES `expenses`(`id`) ON DELETE set null,
	`description` text NOT NULL,
	`category` text DEFAULT 'general',
	`amount_cents` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
