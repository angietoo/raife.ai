import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { ensureRoutingSchema } from "../../../db/runtime";
import { policyVersions, routingDecisions } from "../../../db/schema";
import { routeLeads, type Lead, type RoutingPolicy } from "../../../lib/router";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { version?: number; leads?: Lead[] };
    if (!payload.version || !Array.isArray(payload.leads) || payload.leads.length === 0) {
      return Response.json({ error: "A policy version and at least one lead are required." }, { status: 400 });
    }

    await ensureRoutingSchema();
    const db = getDb();
    const [stored] = await db
      .select()
      .from(policyVersions)
      .where(eq(policyVersions.version, payload.version))
      .limit(1);

    if (!stored) {
      return Response.json({ error: "That policy version does not exist." }, { status: 404 });
    }

    const policy = JSON.parse(stored.policyJson) as RoutingPolicy;
    const decisions = routeLeads(payload.leads, policy, payload.version);
    await db.insert(routingDecisions).values(
      decisions.map((decision) => ({
        id: crypto.randomUUID(),
        leadId: decision.leadId,
        policyVersion: payload.version as number,
        agentId: decision.selectedAgentId,
        decisionJson: JSON.stringify(decision),
      })),
    );

    return Response.json({
      version: payload.version,
      hash: stored.snapshotHash,
      agentSnapshotCount: policy.agents.length,
      decisions,
    });
  } catch {
    return Response.json({ error: "The routing simulation could not be completed." }, { status: 500 });
  }
}
