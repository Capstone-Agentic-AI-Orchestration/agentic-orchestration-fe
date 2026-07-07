# Agentic Orchestration Frontend

`agentic-orchestration-fe` is the Next.js app for the migrated orchestration product. It is wired to `agentic-orchestration-be` for PM, DEV, and CLIENT workspaces through Supabase Auth and the NestJS REST API.

## Runtime Shape

- Next.js app router provides role workspaces under `/pm`, `/dev`, `/client`, and `/admin`.
- `RequireAuth` protects each workspace by backend role:
  - PM routes allow `PM` and `ADMIN`.
  - DEV routes allow `DEV` and `ADMIN`.
  - CLIENT routes allow `CLIENT` and `ADMIN`.
  - ADMIN routes allow `ADMIN`.
- Supabase owns browser sessions.
- `NEXT_PUBLIC_API_URL` points at the NestJS backend origin, usually `http://localhost:4000` in local development.
- `NEXT_PUBLIC_SOCKET_URL` points at the backend origin for Socket.IO, usually `http://localhost:4000` in local development.
- The frontend dev server runs on `http://localhost:3001` so it does not collide with the backend's default `PORT=4000`.

## Setup

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

The frontend expects the backend to be running separately:

```powershell
cd ..\agentic-orchestration-be
npm run start:dev
```

## Environment

Only publishable browser-safe values belong in `.env.local`.

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_SOCKET_URL="http://localhost:4000"
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-publishable-or-anon-key"
NEXT_PUBLIC_AUTH_REDIRECT_PATH="/client/sign-in"
```

Do not put `SUPABASE_SERVICE_ROLE_KEY`, database URLs, GitHub private keys, or server model keys in this frontend app.

GitHub login is handled through Supabase Auth. Configure GitHub in the Supabase dashboard and add `/client/sign-in` for local, production, and preview redirect URLs. The backend still owns final role access through `GET /auth/me`.

## Verification

```powershell
npm run typecheck
npm run build
```

## Deploy

Deploy this app to Vercel after the Render backend is available. Set only browser-safe public env values:

```env
NEXT_PUBLIC_API_URL="https://<backend-service>.onrender.com"
NEXT_PUBLIC_SOCKET_URL="https://<backend-service>.onrender.com"
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-publishable-or-anon-key"
NEXT_PUBLIC_AUTH_REDIRECT_PATH="/client/sign-in"
```

Do not put backend secrets, database URLs, service-role keys, GitHub keys, Eve tokens, or model provider keys in Vercel.

Persona seed and smoke scripts from the legacy backend still need to be migrated into `agentic-orchestration-be` before those flows can be verified end to end.

## Live Backend Areas

These areas are frontend-wired for `agentic-orchestration-be` and Supabase data:

- PM project list/detail, project members, kickoff, tasks, work orders, artifact handoff, collaboration, inquiries, notifications, client/team directories.
- DEV assigned projects, tasks, work orders, artifact views, team messages, notifications.
- CLIENT assigned projects, dashboard, product/delivery review, shared artifacts, documents, conversations, notifications, invite-aware signup/sign-in.

## Pending Or Demo Areas

The orchestrator remains the final major integration target. Some route surfaces intentionally show backend-pending states until their backend modules exist:

- PM calendar, AI usage, reports, and profile detail drilldowns.
- DEV folders, GitHub sync, calendar, and IDE telemetry.
- Scheduling and production deployment status on CLIENT product handoff.
- ADMIN console. It still uses isolated demo data in `src/features/admin/shared/model/admin.mock.ts`.

Legacy mock datasets are isolated under `src/features/*/shared/model/*.mock.ts`. PM, DEV, and CLIENT production flows should use `src/shared/api/devflow-api.ts` and shared hooks instead.
