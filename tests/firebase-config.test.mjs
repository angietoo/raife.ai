import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readJson(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
}

test("targets the confirmed Firebase project and default Firestore database", async () => {
  const project = await readJson("../.firebaserc");
  const firebase = await readJson("../firebase.json");
  const indexes = await readJson("../firestore.indexes.json");

  assert.equal(project.projects.default, "raife-27d9a");
  assert.equal(firebase.firestore.database, "(default)");
  assert.equal(firebase.firestore.rules, "firestore.rules");
  assert.deepEqual(indexes.indexes, []);
});

test("keeps direct Firestore client access closed", async () => {
  const rules = await readFile(new URL("../firestore.rules", import.meta.url), "utf8");

  assert.match(rules, /allow read, write: if false;/);
  assert.doesNotMatch(rules, /if true/);
});

test("bounds the public App Hosting runtime", async () => {
  const config = await readFile(new URL("../apphosting.yaml", import.meta.url), "utf8");

  assert.match(config, /minInstances:\s*0/);
  assert.match(config, /maxInstances:\s*2/);
  assert.match(config, /FIREBASE_PROJECT_ID[\s\S]*raife-27d9a/);
});

test("removes Cloudflare runtime coupling from deployable source", async () => {
  const database = await readFile(new URL("../db/index.ts", import.meta.url), "utf8");
  const packageJson = await readJson("../package.json");

  assert.match(database, /@google-cloud\/firestore/);
  assert.equal(packageJson.dependencies["drizzle-orm"], undefined);
  assert.equal(packageJson.devDependencies.vinext, undefined);
  assert.equal(packageJson.devDependencies.wrangler, undefined);
});
