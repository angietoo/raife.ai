CREATE TABLE `policy_versions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`version` integer NOT NULL,
	`policy_json` text NOT NULL,
	`snapshot_hash` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_policy_versions_version` ON `policy_versions` (`version`);--> statement-breakpoint
CREATE TABLE `routing_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`lead_id` text NOT NULL,
	`policy_version` integer NOT NULL,
	`agent_id` text,
	`decision_json` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_routing_decisions_policy_version` ON `routing_decisions` (`policy_version`);