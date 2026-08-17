import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const policyVersions = sqliteTable(
  "policy_versions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    version: integer("version").notNull(),
    policyJson: text("policy_json").notNull(),
    snapshotHash: text("snapshot_hash").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("idx_policy_versions_version").on(table.version)],
);

export const routingDecisions = sqliteTable(
  "routing_decisions",
  {
    id: text("id").primaryKey(),
    leadId: text("lead_id").notNull(),
    policyVersion: integer("policy_version").notNull(),
    agentId: text("agent_id"),
    decisionJson: text("decision_json").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_routing_decisions_policy_version").on(table.policyVersion)],
);
