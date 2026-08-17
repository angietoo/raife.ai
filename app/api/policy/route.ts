import { getLatestPolicy, savePolicy } from "../../../db/vault";
import { isValidPolicy } from "../../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const latest = await getLatestPolicy();
    return Response.json({
      version: latest.version,
      hash: latest.snapshotHash,
      savedAt: latest.savedAt,
      policy: latest.policy,
    });
  } catch (error) {
    console.error("Unable to load the routing vault", error);
    return Response.json(
      { error: "The routing vault could not be loaded." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { policy?: unknown };
    if (!isValidPolicy(payload.policy)) {
      return Response.json(
        { error: "A valid routing policy is required." },
        { status: 400 },
      );
    }

    const saved = await savePolicy(payload.policy);
    return Response.json(
      {
        version: saved.version,
        hash: saved.snapshotHash,
        savedAt: saved.savedAt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unable to save the routing policy", error);
    return Response.json(
      { error: "The policy could not be saved." },
      { status: 500 },
    );
  }
}
