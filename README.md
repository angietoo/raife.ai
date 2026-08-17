# RAIFE Lead Router

RAIFE Lead Router is a deterministic lead-routing prototype built from the governed-context architecture described in the RAIFE whitepaper. It lets a team define available agents, publish an explicit routing policy, simulate structured leads, and inspect the evidence behind every assignment.

> The same lead, policy version, and agent-availability snapshot always produce the same route.

![RAIFE lead-routing social preview](public/og.png)

## What the prototype demonstrates

- Editable agent availability, capacity, territories, capabilities, and languages
- Ordered hard requirements and weighted preference rules
- Structured test leads with deterministic routing
- Stable-hash tie-breaking instead of random assignment
- Immutable policy snapshots and persisted decision traces
- A responsive interface for desktop and mobile

## Routing sequence

1. Remove unavailable agents and agents without capacity.
2. Apply hard requirements such as territory and language coverage.
3. Score the remaining candidates using explicit preference rules.
4. Resolve equal scores with a stable hash based on the lead, policy version, and agent ID.
5. Send the lead to manual review when no candidate meets every required rule.

The pure routing logic lives in [`lib/router.ts`](lib/router.ts). The interface edits a constrained policy rather than arbitrary code, so every decision remains reproducible and explainable.

## Architecture

- Next.js App Router on Firebase App Hosting
- Cloud Run and Cloud CDN managed by App Hosting
- Cloud Firestore through Google’s server-side Firestore library
- Built-in App Hosting rollouts from the GitHub `main` branch
- GitHub Actions verification for pull requests and `main`

Direct browser access to Firestore is denied. The Next.js API routes use Google Application Default Credentials and IAM from the managed App Hosting runtime.

## Local development

### Requirements

- Node.js 22.13 or newer
- npm
- Firebase CLI for emulator and project operations

Install dependencies and start the interface:

```bash
npm install
npm run dev
```

The UI falls back to its fictional default policy when local Google credentials or the Firestore emulator are unavailable. To test persistence locally, start the Firestore emulator in another terminal and configure the server library to use it:

```bash
npm run firebase:emulators
```

Validate the router, Firebase configuration, production build, and lint rules:

```bash
npm test
npm run lint
```

## Firebase configuration

- `.firebaserc` — selects Firebase project `raife-27d9a`
- `firebase.json` — declares Firestore rules, indexes, and emulator ports
- `firestore.rules` — denies direct client access
- `firestore.indexes.json` — version-controlled composite index definitions
- `apphosting.yaml` — bounds the Cloud Run runtime for the public prototype

Firebase App Hosting owns the application rollout. After its backend is connected to this repository with `main` as the live branch, each merge to `main` automatically starts a reproducible Cloud Build and Cloud Run rollout. No deploy credential is stored in GitHub.

Firestore rules and indexes can be deployed separately with:

```bash
firebase deploy --only firestore
```

## Project structure

- `app/` — interface and server-side API routes
- `db/` — Firebase Admin initialization and Firestore vault operations
- `lib/router.ts` — pure deterministic routing engine
- `lib/validation.ts` — bounded API input validation
- `public/` — static brand assets
- `tests/` — determinism and Firebase configuration checks

## Firestore data model

- `routing_vault/state` — pointer to the latest immutable policy version
- `policy_versions/{version}` — policy and agent-availability snapshot
- `routing_decisions/{id}` — lead input, chosen route, candidate scores, and explanation trace

The included test leads are fictional. Do not enter real customer or lead data into this public prototype.

## Security status

The Firestore client rules are closed and API payloads are size-bounded. This remains a demonstration prototype rather than a production lead-management system. Before accepting real data, add Firebase Authentication, authorization for policy publishing, retention controls, and abuse protection.

## License

Copyright © 2026 RAIFE. No open-source license is granted at this time.
