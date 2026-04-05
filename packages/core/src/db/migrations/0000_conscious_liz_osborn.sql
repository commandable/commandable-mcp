CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`key_hash` text NOT NULL,
	`scopes_json` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `credentials` (
	`space_id` text NOT NULL,
	`id` text NOT NULL,
	`ciphertext` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`space_id`, `id`)
);
--> statement-breakpoint
CREATE TABLE `integration_type_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`type_slug` text NOT NULL,
	`label` text NOT NULL,
	`default_variant` text NOT NULL,
	`variants_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `integrations` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text,
	`type` text NOT NULL,
	`reference_id` text NOT NULL,
	`label` text NOT NULL,
	`config` text,
	`enabled` integer DEFAULT 1 NOT NULL,
	`connection_method` text,
	`connection_id` text,
	`credential_id` text,
	`credential_variant` text,
	`enabled_toolsets` text,
	`max_scope` text,
	`disabled_tools` text,
	`health_status` text,
	`health_checked_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tool_definitions` (
	`id` text PRIMARY KEY NOT NULL,
	`space_id` text NOT NULL,
	`integration_id` text NOT NULL,
	`name` text NOT NULL,
	`display_name` text,
	`description` text NOT NULL,
	`scope` text NOT NULL,
	`input_schema_json` text NOT NULL,
	`handler_code` text NOT NULL,
	`utils_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text,
	`created_at` integer NOT NULL
);
