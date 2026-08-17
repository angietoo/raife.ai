import { desc } from "drizzle-orm";
import { getDb } from "../../../db";
import { ensureRoutingSchema } from "../../../db/runtime";
import { policyVersions } from "../../../db/schema";
import { defaultPolicy, policyHash, type RoutingPolicy } from "../../../lib/router";

function isValidPolicy(value: unknown): value is RoutingPolicy {
  if (!value || typeof value !== "object") return false;
  const candidate = value as RoutingPolicy;
  return Array.isArray(candidate.agents) && Array.isArray(candidate.rules);
}

async function latestPolicy() {
  const db = getDb();
  const [latest] = await db
    .select()
    .from(policyVersions)
    .orderBy(desc(policyVersions.version))
    .limit(1);

  if (latest) return latest;

  const [seeded] = await db
    .insert(policyVersions)
    .values({
      version: 4,
      policyJson: JSON.stringify(defaultPolicy),
      snapshotHash: policyHash(defaultPolicy),
    })
    .returning();
  return seeded;
}

export async function GET() {
  try {
    await ensureRoutingSchema();
    const latest = await latestPolicy();
    return Response.json({
      version: latest.version,
      hash: latest.snapshotHash,
      savedAt: latest.createdAt,
      policy: JSON.parse(latest.policyJson),
    });
  } catch {
    return Response.json({ error: "The routing vault could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { policy?: unknown };
    if (!isValidPolicy(payload.policy)) {
      return Response.json({ error: "A valid routing policy is required." }, { status: 400 });
    }

    await ensureRoutingSchema();
    const db = getDb();
    const latest = await latestPolicy();
    const nextVersion = latest.version + 1;
    const hash = policyHash(payload.policy);
    const [saved] = await db
      .insert(policyVersions)
      .values({
        version: nextVersion,
        policyJson: JSON.stringify(payload.policy),
        snapshotHash: hash,
      })
      .returning();

    return Response.json(
      { version: saved.version, hash: saved.snapshotHash, savedAt: saved.createdAt },
      { status: 201 },
    );
  } catch {
    return Response.json({ error: "The policy could not be saved." }, { status: 500 });
  }
}
