import { env } from "cloudflare:workers";

export async function ensureRoutingSchema() {
  if (!env.DB) {
    throw new Error("The routing vault is not available.");
  }

  await env.DB.batch([
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS policy_versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER NOT NULL UNIQUE,
        policy_json TEXT NOT NULL,
        snapshot_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS routing_decisions (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL,
        policy_version INTEGER NOT NULL,
        agent_id TEXT,
        decision_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_routing_decisions_policy_version
      ON routing_decisions(policy_version)
    `),
  ]);
}
