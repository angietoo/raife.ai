import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the RAIFE lead-routing experience", async () => {
  const response = await render();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();

  assert.match(html, /<title>RAIFE — Governed Lead Routing<\/title>/i);
  assert.match(html, /Every route/);
  assert.match(html, /has a reason\./);
  assert.match(html, /Deterministic router/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("keeps the routing resolver deterministic and version-aware", async () => {
  const router = await readFile(
    new URL("../lib/router.ts", import.meta.url),
    "utf8",
  );

  assert.match(router, /export function stableHash/);
  assert.match(
    router,
    /stableHash\(`\$\{lead\.id\}:\$\{policyVersion\}:\$\{left\.agentId\}`\)/,
  );
  assert.match(router, /Fallback: manual review/);
  assert.doesNotMatch(router, /Math\.random|crypto\.getRandomValues/);
});
