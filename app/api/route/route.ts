import { getPolicy, recordDecisions } from "../../../db/vault";
import { routeLeads } from "../../../lib/router";
import { isValidLeads } from "../../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      version?: unknown;
      leads?: unknown;
    };
    if (
      !Number.isInteger(payload.version) ||
      Number(payload.version) < 1 ||
      !isValidLeads(payload.leads)
    ) {
      return Response.json(
        { error: "A policy version and 1–25 valid leads are required." },
        { status: 400 },
      );
    }

    const version = Number(payload.version);
    const stored = await getPolicy(version);
    if (!stored) {
      return Response.json(
        { error: "That policy version does not exist." },
        { status: 404 },
      );
    }

    const decisions = routeLeads(payload.leads, stored.policy, version);
    await recordDecisions(payload.leads, decisions, version);

    return Response.json({
      version,
      hash: stored.snapshotHash,
      agentSnapshotCount: stored.policy.agents.length,
      decisions,
    });
  } catch (error) {
    console.error("Unable to complete the routing simulation", error);
    return Response.json(
      { error: "The routing simulation could not be completed." },
      { status: 500 },
    );
  }
}
