# Environment Configuration Reference

This is the single, exhaustive reference for every environment variable used
anywhere in this repository — backend, all three frontend apps, and Docker
Compose. `README.md` and `backend/README.md` keep short quick-reference
tables for convenience; this document is the source of truth for full detail
and cross-service consumption.

## How configuration flows through this repo

There are **two independent ways** to run the backend, and they read
configuration from different places:

```
                        ┌─────────────────────┐
  root .env  ─────────▶ │ docker-compose.yml   │ ─▶ container env ─▶ application-docker.yml
  (or shell exports)    │ (${VAR:-default})     │                     ${VAR:default} placeholders
                        └─────────────────────┘

  backend/.env  ───────▶ shell exports (mvn spring-boot:run, or VS Code    ─▶ application.yml
  (or shell exports)     "Backend: Launch" launch config's envFile)          ${VAR:default} placeholders
```

**Root `.env` only affects the Docker Compose stack.** It has zero effect on
a locally-run (`mvn spring-boot:run`) backend, because Maven/Spring Boot
don't read `.env` files on their own — only exported shell variables or an
IDE's `envFile` setting do. That's why there are **two separate `.env.example`
templates** (root and `backend/`) — see §2 and §3.

Each frontend app reads its **own** `.env`/`.env.example` via Vite's built-in
`import.meta.env.*` — Vite does this automatically, no code needed.

Run `node scripts/setup-env.mjs` (or `npm run setup`) from the repo root to
create every `.env` from its `.env.example` in one step — see the root
`README.md`'s "Developer tooling" section.

## 1. Root `.env` / Docker Compose variables

Copy `.env.example` → `.env` at the repo root. These only matter when running
via `docker compose up`.

| Variable | Default | Consumed by | Notes |
|---|---|---|---|
| `MYSQL_ROOT_PASSWORD` | `rootpassword` | `mysql` service | |
| `MYSQL_DATABASE` | `smartad` | `mysql` service, backend's JDBC URL | |
| `MYSQL_USER` | `smartad` | `mysql` service, backend's `SPRING_DATASOURCE_USERNAME` | |
| `MYSQL_PASSWORD` | `smartadpass` | `mysql` service, backend's `SPRING_DATASOURCE_PASSWORD` | |
| `MYSQL_PORT` | `3306` | host port mapping for `mysql` | |
| `REDIS_PORT` | `6379` | host port mapping for `redis` | The backend container always talks to Redis via the fixed hostname `redis`, so there's no `REDIS_HOST` variable to set — it isn't configurable from `.env` by design (see the changelog below). |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | `minioadmin` / `minioadmin123` | `minio` + `minio-init` services, and passed to the backend as `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` | |
| `MINIO_API_PORT` / `MINIO_CONSOLE_PORT` | `9000` / `9001` | host port mappings for `minio` | |
| `MINIO_BUCKET` | `ads` | `minio-init` (creates + sets public-download on this bucket), passed to backend as `AWS_S3_BUCKET` | |
| `AWS_S3_ENDPOINT` | `http://minio:9000` | backend container's `AWS_S3_ENDPOINT` | |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | `minioadmin` / `minioadmin123` | informational only in root `.env` — the backend container actually gets its credentials from `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` above, not these two keys directly | Kept for readability/parity with `backend/.env.example`; if you change MinIO's root credentials, edit `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD`, not these. |
| `AWS_REGION` | `us-east-1` | backend container's `AWS_REGION` | |
| `JWT_SECRET` | placeholder — **change for anything beyond local demo use** | backend container's JWT signing key | |
| `JWT_EXPIRATION_MS` | `86400000` (24h) | backend container's token lifetime | |
| `SERVER_PORT` | `8080` | backend container's HTTP port + host port mapping | |
| `SPRING_PROFILES_ACTIVE` | `docker` | selects `application-docker.yml` overlay | |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:5174,http://localhost:5175` | backend's CORS allow-list (REST + WebSocket) | |
| `APP_FRONTEND_MOBILE_URL` | `http://localhost:5174` | base URL encoded into session-join QR codes | |
| `VITE_API_BASE_URL` / `VITE_WS_URL` | `http://localhost:8080/api` / `http://localhost:8080/ws` | **informational only** — Docker Compose does not build/run the frontend containers, so these two lines don't do anything by themselves. Each frontend app has its own `.env` for this (see §4). | |

## 2. Backend variables (Spring Boot)

Every variable below is read via a `${VAR:default}` placeholder in
`backend/src/main/resources/application.yml` (local/default profile) or
`application-docker.yml` (`docker` profile). Both profiles define the same
variable names with different defaults where the target hostname differs.

| Variable | Local default (`application.yml`) | Docker default (`application-docker.yml`) | Purpose |
|---|---|---|---|
| `SERVER_PORT` | `8080` | `8080` | HTTP listen port |
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://localhost:3306/smartad?...` | `jdbc:mysql://mysql:3306/smartad?...` | JDBC connection string |
| `SPRING_DATASOURCE_USERNAME` | `root` | `root` (overridden to `${MYSQL_USER}` by docker-compose) | MySQL user |
| `SPRING_DATASOURCE_PASSWORD` | `root` | `root` (overridden to `${MYSQL_PASSWORD}` by docker-compose) | MySQL password |
| `SPRING_DATA_REDIS_HOST` | `localhost` | `redis` | Redis host |
| `SPRING_DATA_REDIS_PORT` | `6379` | `6379` | Redis port |
| `JWT_SECRET` | dev-only placeholder | dev-only placeholder | HS256 signing key (≥256 bits recommended) |
| `JWT_EXPIRATION_MS` | `86400000` | `86400000` | Token lifetime |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,5174,5175` | same | Allowed REST + WebSocket origins |
| `APP_FRONTEND_MOBILE_URL` | `http://localhost:5174` | same | Base URL baked into join QR codes |
| `AWS_REGION` | `us-east-1` | `us-east-1` | S3/MinIO client region |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | `minioadmin` / `minioadmin` | `minioadmin` / `minioadmin123` | S3/MinIO credentials |
| `AWS_S3_ENDPOINT` | `http://localhost:9000` | `http://minio:9000` | S3-compatible endpoint override |
| `AWS_S3_BUCKET` | `ads` | `ads` | Bucket for ad media uploads |

Fixed (non-env-driven) settings worth knowing: `spring.jpa.hibernate.ddl-auto=validate`
(schema is only ever changed by Flyway, never by Hibernate), Flyway
`baseline-on-migrate=true` reading from `classpath:db/migration`, multipart
upload limits `max-file-size=50MB` / `max-request-size=55MB`.

For the **local** (non-Docker) run path, copy `backend/.env.example` →
`backend/.env` and either export its contents into your shell before
`mvn spring-boot:run`, or use the VS Code "Backend: Launch (Java, local
mvn/JDK)" launch config, which points its `envFile` at `backend/.env`
directly.

## 3. Frontend variables (Vite)

Each app has its own `.env`/`.env.example`. Vite exposes anything prefixed
`VITE_` via `import.meta.env.*` automatically.

`VITE_API_BASE_URL` and `VITE_WS_URL` are defined identically in **all
three** apps (`tv-display`, `mobile-web`, `admin-dashboard`), but each app
only actually reads them indirectly, through the shared workspace packages:
- `frontend/packages/api-client/src/axiosClient.js` reads `VITE_API_BASE_URL`
- `frontend/packages/websocket/src/StompProvider.jsx` reads `VITE_WS_URL`

| Variable | Default | Apps |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | all 3 |
| `VITE_WS_URL` | `ws://localhost:8080/ws` | all 3 |
| `VITE_TV_DISPLAY_URL` | `http://localhost:5173` | `admin-dashboard` only — used for the "Open TV Display" link on the session detail page |
| `VITE_MOBILE_WEB_URL` | `http://localhost:5174` | `admin-dashboard` only — used on the Config page |

## 4. Docker Compose service reference

| Service | Image | Host ports | Depends on (healthy) |
|---|---|---|---|
| `mysql` | `mysql:8.4` | `3306` | — |
| `redis` | `redis:7.2-alpine` | `6379` | — |
| `minio` | `minio/minio:latest` | `9000` (API), `9001` (console) | — |
| `minio-init` | `minio/mc:latest` (one-shot job: creates the ads bucket, sets it public-download) | — | `minio` |
| `backend` | built from `./backend/Dockerfile` | `8080` (HTTP), `5005` (JDWP remote debug) | `mysql`, `redis`, `minio` |

The `backend` service's JDWP debug agent (`JAVA_TOOL_OPTIONS`, port `5005`)
runs with `suspend=n`, so it never blocks normal startup when no debugger is
attached — it just sits there listening. Use VS Code's "Backend: Attach to
Docker (port 5005)" launch config to attach.

## ⚠️ Known decorative / unused variables — read this before debugging

- There is **no `REDIS_HOST` variable**. The backend container always
  connects to Redis via the fixed hostname `redis` on the shared Compose
  network — this isn't user-configurable from `.env`, by design, so don't
  look for it.
- There is **no `JWT_ADMIN_EXPIRATION_MS` variable**. Admin and user tokens
  share the same `JWT_EXPIRATION_MS` lifetime; a separate admin expiration
  was never actually implemented.

Both of the above used to exist in an earlier version of `.env.example` as
dead entries that had no effect anywhere — they've been removed rather than
left as unused placeholders. If you're diffing against an older copy of this
repo and wondering where they went, this is why.

## What changed in this pass

- `docker-compose.yml`'s `backend.environment` block previously **hardcoded**
  literal values for `SPRING_PROFILES_ACTIVE`, `AWS_S3_ENDPOINT`, and
  `CORS_ALLOWED_ORIGINS` instead of interpolating them from `.env` — editing
  those three in `.env` used to have **zero effect** on the dockerized
  backend. They're now properly interpolated (`${VAR:-<same default as
  before>}`), so `.env` overrides actually work.
- `APP_FRONTEND_MOBILE_URL` was never passed to the backend container at all
  (it always silently fell back to its baked-in default). It's now wired
  through from `.env` as well.
- Removed the two genuinely dead variables described above.
- Added `backend/.env.example` (didn't exist before) for the local `mvn`-run
  path, and `scripts/setup-env.mjs` to bootstrap every `.env` in one command.
- Added a JDWP debug port (`5005`) to the dockerized backend for IDE
  attach-debugging.

## Quick links

- `README.md` — quick-start, demo walkthrough, developer tooling
- `backend/README.md` — backend-specific run instructions and API surface
- `postman/README.md` — importing and running the API collection
