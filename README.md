# RAIFE Lead Router

RAIFE Lead Router is a deterministic lead-routing prototype built from the governed-context architecture described in the RAIFE whitepaper. It lets a team define available agents, publish an explicit routing policy, simulate structured leads, and inspect the evidence behind every assignment.

> The same lead, policy version, and agent-availability snapshot always produce the same route.

![RAIFE lead-routing social preview](public/og.png)

## What the prototype demonstrates

- Editable agent availability, capacity, territories, capabilities, and languages
- Ordered hard requirements and weighted preference rules
- Structured test leads with deterministic routing
- Stable-hash tie-breaking instead of random assignment
- Versioned policy snapshots
- Persisted routing decisions and explanation traces
- A responsive interface for desktop and mobile

## Routing sequence

1. Remove unavailable agents and agents without capacity.
2. Apply hard requirements such as territory and language coverage.
3. Score the remaining candidates using explicit preference rules.
4. Resolve equal scores with a stable hash based on the lead, policy version, and agent ID.
5. Send the lead to manual review when no candidate meets every required rule.

The pure routing logic lives in [`lib/router.ts`](lib/router.ts). The interface edits a constrained policy rather than arbitrary code, so every decision remains reproducible and explainable.

## Current architecture

This repository contains the clean source baseline from the first working prototype:

- React with the Next.js App Router
- vinext and Cloudflare Worker-compatible output
- Cloudflare D1 through Drizzle ORM
- API routes for policy versioning and routing decisions

The planned deployment phase will move the app to Firebase App Hosting and Firestore. The router is isolated from the storage and hosting layers so its behavior can stay unchanged during that migration.

## Local development

### Requirements

- Node.js 22.13 or newer
- npm

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Validate the production build and deterministic-router checks:

```bash
npm test
```

## Project structure

- `app/` — interface and API routes
- `db/` — schema and database runtime
- `drizzle/` — database migrations
- `lib/router.ts` — pure deterministic routing engine
- `public/` — static brand assets
- `tests/` — server-render and determinism checks
- `worker/` — worker entry point

## Data model

The prototype stores two record types:

- `policy_versions` — immutable snapshots of routing policy and agent availability
- `routing_decisions` — lead input, chosen route, candidate scores, and explanation trace

The included test leads are fictional. Do not enter real customer or lead data into a public prototype.

## Deployment

The original private prototype remains available while the Firebase migration is in progress. Firebase project configuration and the GitHub Actions deployment workflow will be added after a new Firebase project is selected.

## Security status

This is a demonstration prototype, not a production lead-management system. Before public deployment, publishing controls should be protected with Firebase Authentication and public visitors should be limited to temporary simulations.

## License

Copyright © 2026 RAIFE. No open-source license is granted at this time.
