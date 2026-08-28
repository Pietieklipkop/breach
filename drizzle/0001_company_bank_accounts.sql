CREATE TABLE IF NOT EXISTS `company_bank_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL REFERENCES `companies`(`id`) ON DELETE CASCADE,
	`bank_name` text NOT NULL,
	`account_alias` text NOT NULL,
	`account_number` text,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);

ALTER TABLE `expenses` ADD COLUMN `paid_from_bank_account_id` text REFERENCES `company_bank_accounts`(`id`) ON DELETE SET NULL;
