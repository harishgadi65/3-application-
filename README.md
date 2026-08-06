# Smart Interactive Advertising & Gaming Platform

A proof-of-concept platform where an administrator creates a game session, a TV
screen shows rotating advertisements plus a join QR code, players scan it with
their phones to register/join, and everyone plays together in real time —
phones act as controllers, the TV renders the shared game view, live
leaderboard, and winner screen.

Games are **pluggable**: two ship out of the box (**Snake** — multiplayer
snake on a shared 30×30 grid, and **Tap Blast Race** — mash-to-launch with
BOOST/TRAP reaction events), and a new game can be added without touching
core platform code — see [`implementation_plan.md`](implementation_plan.md)
"How to Add a New Game".

## Architecture at a glance

| Piece | Tech | Port |
|---|---|---|
| TV Display | React 19 + Vite + Tailwind 4 | `5173` |
| Mobile Web (player controller) | React 19 + Vite + Tailwind 4 | `5174` |
| Admin Dashboard | React 19 + Vite + Tailwind 4 | `5175` |
| Backend API + WebSocket | Spring Boot 3.4 / Java 21 | `8080` |
| MySQL | Persistent data | `3306` |
| Redis | Live game/session state | `6379` |
| MinIO (S3-compatible) | Advertisement media storage | `9000` (API) / `9001` (console) |

The backend is the single source of truth — all game logic, scoring, and
session state live server-side; clients only render what's pushed to them
over REST + STOMP/WebSocket. See `implementation_plan.md` for the full
architecture, database schema, REST/WebSocket contracts, and Redis key
structure this build follows.

## Project layout

```
backend/                  Spring Boot API + pluggable game engine
frontend/
  apps/tv-display/        TV screen client
  apps/mobile-web/        Player's phone client
  apps/admin-dashboard/   Admin control panel
  packages/api-client/    Shared REST client   (@smartad/api-client)
  packages/websocket/     Shared STOMP client  (@smartad/websocket)
  packages/shared-ui/     Shared UI primitives (@smartad/shared-ui)
docs/ENVIRONMENT.md        Full environment-variable reference (all services)
postman/                   REST API collection + environment (no frontend needed)
scripts/setup-env.mjs      Creates every .env from its .env.example in one step
.vscode/                   VS Code run/debug configs (tasks.json, launch.json)
docker-compose.yml         MySQL + Redis + MinIO + backend
package.json                Root npm scripts (see "Developer tooling" below)
.env.example                Env template for the Docker Compose stack
```

## Quick start (Docker — recommended)

Brings up MySQL, Redis, MinIO, and the backend API in one shot:

```bash
npm run setup          # creates every .env from its .env.example (root + backend + all 3 apps)
docker compose up --build
```

(`npm run setup` just runs `scripts/setup-env.mjs`; equivalent to manually
`cp .env.example .env` for each app if you'd rather do it by hand.)

The backend will be live on `http://localhost:8080` once MySQL/Redis/MinIO
report healthy (Flyway creates the schema and seeds a demo admin account +
game catalog automatically on first boot).

Then run the three frontend apps (Docker Compose intentionally does **not**
containerize these, so `pnpm dev` gives fast HMR while you demo):

```bash
cd frontend
corepack enable          # or: npm i -g pnpm
pnpm install
pnpm --filter tv-display dev        # http://localhost:5173
pnpm --filter mobile-web dev        # http://localhost:5174
pnpm --filter admin-dashboard dev   # http://localhost:5175
```

(Run each in its own terminal, or use `pnpm -r --parallel dev` from
`frontend/` to start all three at once.)

## Running everything without Docker

1. **Infrastructure** — have MySQL 8, Redis, and MinIO (or skip MinIO if you
   won't touch ad uploads) reachable on their default ports.
2. **Backend** — see [`backend/README.md`](backend/README.md) for the full
   guide; the short version:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
3. **Frontend** — as above (`pnpm install` once at `frontend/`, then
   `pnpm --filter <app> dev` per app). Each app reads `VITE_API_BASE_URL` /
   `VITE_WS_URL` from its own `.env` (see each app's `.env.example`) —
   defaults already point at `http://localhost:8080`.

## Environment variables

Every variable across the backend, docker-compose, and all three frontend
apps — defaults, which profile/service consumes it, and a list of a few
"decorative" variables from an earlier pass that turned out to have no
effect — is documented in **[`docs/ENVIRONMENT.md`](docs/ENVIRONMENT.md)**.
Run `npm run setup` to generate working `.env` files for the whole repo in
one step (see above).

## Developer tooling

**Root npm scripts** (`npm run <script>`, from the repo root):

| Script | What it does |
|---|---|
| `setup` | Create every `.env` from its `.env.example` (skips existing files) |
| `dev` | `docker compose up` (infra + backend) then all 3 Vite dev servers, in one terminal |
| `dev:infra` | Just MySQL/Redis/MinIO (for running the backend locally via `mvn` against dockerized infra) |
| `dev:backend:docker` / `dev:backend:local` | Backend only, containerized or via local `mvn spring-boot:run` |
| `dev:frontend` | All 3 Vite dev servers in parallel (no backend) |
| `stop` | `docker compose down` |
| `logs:backend` | Tail the backend container's logs |
| `build:frontend` | Production build of all 3 frontend apps |

**VS Code** — open the repo root in VS Code and use the Run panel:
- **Tasks** (`Terminal → Run Task`): infra/backend/frontend start-up tasks
  matching the npm scripts above, individually runnable.
- **Launch configs**: `Backend: Launch (Java, local mvn/JDK)` (needs a local
  JDK 21 + Maven — install the recommended Java extensions from
  `.vscode/extensions.json`), `Backend: Attach to Docker (port 5005)` (the
  dockerized backend always listens for a debugger on `5005`, harmlessly, so
  this just works once `docker compose up` is running), and one Chrome debug
  config per frontend app. The **`Debug All Frontend Apps`** compound starts
  all 3 Vite dev servers and opens 3 debugger-attached Chrome tabs in one
  click.

**Postman** — see [`postman/README.md`](postman/README.md) for a full REST
API collection that exercises the backend end-to-end without needing any of
the frontend apps (register → login → create/join/start/end a session →
leaderboard → results), useful for verifying the backend on its own.

## Demo walkthrough

1. Open the **Admin Dashboard** (`:5175`) → log in with the seeded demo admin
   — **username `admin`, password `admin123`**.
2. **Advertisements** page → 8 demo ads are already seeded (2 each for
   `TOP`/`BOTTOM`/`LEFT`/`RIGHT`) so ad rotation works out of the box; upload
   your own images/videos here too if you want to replace them.
3. **Dashboard/Sessions** → "+ Create Session" → pick a game (Snake or Tap
   Blast Race) → note the session code, or copy the "Open TV Display" link.
4. Open that link in a browser on the TV/big screen (`:5173/display/{code}`)
   — you'll see the ads rotating around a QR code and the (empty) player
   list.
5. On a phone (or another browser tab), open the **Mobile Web** app
   (`:5174`), register/log in, and either scan the QR code or type the
   6‑character session code to join.
6. Back in the Admin Dashboard's session detail page, hit **Start** once at
   least one player has joined — a 5‑4‑3‑2‑1 countdown fires on every
   screen, then the game begins.
7. Play from the phone (D‑pad/swipe for Snake, tap‑to‑launch + reaction
   flashes for Tap Blast); watch the shared arena, live leaderboard, and ad
   rotation update in real time on the TV.
8. When the timer expires (or you hit **End** in the admin panel), the
   winner screen appears everywhere, and results are saved — check the
   phone's **History** page afterward.

## Notes on the two "User Review Required" defaults from the plan

- **Storage**: uses **MinIO** (S3-compatible, run via Docker) instead of real
  AWS S3, purely to avoid requiring AWS credentials for the demo. The backend
  talks to it through the AWS S3 SDK with an endpoint override, so pointing
  at real S3 later is a configuration change, not a code change.
- **Language**: the frontend is plain **JavaScript** (no TypeScript), per the
  original spec.
- **Monorepo**: the three React apps share code via a **pnpm workspace**
  (`frontend/packages/*`) instead of duplicating API/WebSocket/UI logic
  three times.
