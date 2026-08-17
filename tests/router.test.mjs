import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function loadRouter() {
  const source = await readFile(new URL("../lib/router.ts", import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const encoded = Buffer.from(output).toString("base64");
  return import(`data:text/javascript;base64,${encoded}`);
}

test("returns identical decisions for an identical governed snapshot", async () => {
  const { defaultLeads, defaultPolicy, routeLeads } = await loadRouter();
  const first = routeLeads(defaultLeads, defaultPolicy, 4);
  const replay = routeLeads(defaultLeads, defaultPolicy, 4);

  assert.deepEqual(replay, first);
  assert.equal(first.length, defaultLeads.length);
  assert.ok(first.every((decision) => decision.tieBreaker.length > 0));
});

test("uses the review queue when no agent meets every hard requirement", async () => {
  const { defaultLeads, defaultPolicy, routeLead } = await loadRouter();
  const policy = {
    ...defaultPolicy,
    agents: defaultPolicy.agents.map((agent) => ({
      ...agent,
      available: false,
    })),
  };

  const decision = routeLead(defaultLeads[0], policy, 4);

  assert.equal(decision.status, "review");
  assert.equal(decision.selectedAgentId, null);
  assert.equal(decision.tieBreaker, "Fallback: manual review");
});

test("contains no random routing source", async () => {
  const source = await readFile(new URL("../lib/router.ts", import.meta.url), "utf8");

  assert.match(source, /export function stableHash/);
  assert.doesNotMatch(source, /Math\.random|crypto\.getRandomValues/);
});
