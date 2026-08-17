import { randomUUID } from "node:crypto";
import type { DocumentData, Firestore } from "@google-cloud/firestore";
import {
  defaultPolicy,
  policyHash,
  type Lead,
  type RoutingDecision,
  type RoutingPolicy,
} from "../lib/router";
import { getDb } from ".";

export type StoredPolicy = {
  version: number;
  snapshotHash: string;
  savedAt: string;
  policy: RoutingPolicy;
};

const INITIAL_POLICY_VERSION = 4;
const STATE_COLLECTION = "routing_vault";
const STATE_DOCUMENT = "state";
const POLICY_COLLECTION = "policy_versions";
const DECISION_COLLECTION = "routing_decisions";

function policyDocumentId(version: number) {
  return String(version).padStart(12, "0");
}

function policyReference(db: Firestore, version: number) {
  return db.collection(POLICY_COLLECTION).doc(policyDocumentId(version));
}

function parseStoredPolicy(value: DocumentData): StoredPolicy {
  return {
    version: Number(value.version),
    snapshotHash: String(value.snapshotHash),
    savedAt: String(value.savedAt),
    policy: value.policy as RoutingPolicy,
  };
}

export async function getLatestPolicy(): Promise<StoredPolicy> {
  const db = getDb();
  const stateReference = db.collection(STATE_COLLECTION).doc(STATE_DOCUMENT);
  const stateSnapshot = await stateReference.get();

  if (stateSnapshot.exists) {
    const version = Number(stateSnapshot.data()?.latestVersion);
    if (!Number.isInteger(version) || version < 1) {
      throw new Error("The routing vault state is invalid.");
    }

    const policySnapshot = await policyReference(db, version).get();
    if (!policySnapshot.exists) {
      throw new Error("The latest routing policy is missing.");
    }
    return parseStoredPolicy(policySnapshot.data()!);
  }

  const version = await db.runTransaction(async (transaction) => {
    const currentState = await transaction.get(stateReference);
    if (currentState.exists) {
      return Number(currentState.data()?.latestVersion);
    }

    const savedAt = new Date().toISOString();
    const initial: StoredPolicy = {
      version: INITIAL_POLICY_VERSION,
      snapshotHash: policyHash(defaultPolicy),
      savedAt,
      policy: defaultPolicy,
    };

    transaction.create(policyReference(db, INITIAL_POLICY_VERSION), initial);
    transaction.create(stateReference, {
      latestVersion: INITIAL_POLICY_VERSION,
      updatedAt: savedAt,
    });
    return INITIAL_POLICY_VERSION;
  });

  const seeded = await policyReference(db, version).get();
  if (!seeded.exists) throw new Error("The routing policy could not be seeded.");
  return parseStoredPolicy(seeded.data()!);
}

export async function savePolicy(policy: RoutingPolicy): Promise<StoredPolicy> {
  const db = getDb();
  const stateReference = db.collection(STATE_COLLECTION).doc(STATE_DOCUMENT);

  return db.runTransaction(async (transaction) => {
    const currentState = await transaction.get(stateReference);
    let latestVersion = INITIAL_POLICY_VERSION;

    if (currentState.exists) {
      latestVersion = Number(currentState.data()?.latestVersion);
      if (!Number.isInteger(latestVersion) || latestVersion < 1) {
        throw new Error("The routing vault state is invalid.");
      }
    } else {
      const seededAt = new Date().toISOString();
      transaction.create(policyReference(db, INITIAL_POLICY_VERSION), {
        version: INITIAL_POLICY_VERSION,
        snapshotHash: policyHash(defaultPolicy),
        savedAt: seededAt,
        policy: defaultPolicy,
      } satisfies StoredPolicy);
    }

    const savedAt = new Date().toISOString();
    const saved: StoredPolicy = {
      version: latestVersion + 1,
      snapshotHash: policyHash(policy),
      savedAt,
      policy,
    };

    transaction.create(policyReference(db, saved.version), saved);
    transaction.set(stateReference, {
      latestVersion: saved.version,
      updatedAt: savedAt,
    });
    return saved;
  });
}

export async function getPolicy(version: number): Promise<StoredPolicy | null> {
  const snapshot = await policyReference(getDb(), version).get();
  return snapshot.exists ? parseStoredPolicy(snapshot.data()!) : null;
}

export async function recordDecisions(
  leads: Lead[],
  decisions: RoutingDecision[],
  version: number,
) {
  const db = getDb();
  const batch = db.batch();
  const leadById = new Map(leads.map((lead) => [lead.id, lead]));
  const createdAt = new Date().toISOString();

  for (const decision of decisions) {
    const reference = db.collection(DECISION_COLLECTION).doc(randomUUID());
    batch.create(reference, {
      leadId: decision.leadId,
      policyVersion: version,
      agentId: decision.selectedAgentId,
      lead: leadById.get(decision.leadId) ?? null,
      decision,
      createdAt,
    });
  }

  await batch.commit();
}
