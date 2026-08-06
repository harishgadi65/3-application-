# Smart Interactive Advertising & Gaming Platform - Backend

Spring Boot 3.4.x / Java 21 backend for a TV + phone-controller party-game
platform. A TV screen shows ads and a QR code; players scan it, register or
log in on their phone, join the session, and play using their phone as a
controller while the TV renders the shared game view, live leaderboard, and
winner screen.

Two games ship out of the box - **Snake** (multiplayer snake on a shared
30x30 grid) and **Tap Blast Race** (mash-to-launch with BOOST/TRAP reaction
events) - both implemented as pluggable `GamePlugin` beans. Adding a new game
never requires touching core platform code: drop a new `@Component`
implementing `com.smartad.game.GamePlugin` on the classpath and it is
auto-registered by `GamePluginRegistry` and immediately shows up in
`GET /api/games`.

## Prerequisites

- Java 21 (JDK)
- Maven 3.9+ (or use your IDE's bundled Maven)
- MySQL 8 running locally (or via Docker) with a `smartad` database
- Redis running locally (or via Docker)
- MinIO (or real S3) running locally for advertisement media uploads (optional
  unless you exercise the `/api/ads` upload endpoint)

## Running locally (`local`/default profile)

The default profile (`application.yml`) points at `localhost` for every
service, so nothing extra is required beyond having MySQL and Redis
reachable there.

1. Create the database once:
   ```sql
   CREATE DATABASE smartad CHARACTER SET utf8mb4;
   ```
   Flyway creates all tables (and seeds the demo admin + game catalog) on
   first boot - no manual DDL needed.

2. (Optional) copy `backend/.env.example` → `backend/.env` (or run
   `npm run setup` from the repo root, which does this for every app at
   once) and adjust if your local services aren't on the defaults
   (`root`/`root` MySQL creds, Redis on `6379`, MinIO on `9000`). Note this
   file is only consumed if you export it into your shell yourself, or via
   the VS Code "Backend: Launch (Java, local mvn/JDK)" launch config's
   `envFile` setting — `mvn spring-boot:run` does not read `.env` files on
   its own. See `../docs/ENVIRONMENT.md` for the full explanation of how
   configuration flows differently for the local-run vs. Docker paths.

3. Run it:
   ```bash
   mvn spring-boot:run
   ```
   The API is now on `http://localhost:8080`. Flyway seeds a demo admin
   account (**username `admin`, password `admin123`**,
   `POST /api/auth/admin/login`), the `SNAKE`/`TAP_BLAST` game catalog
   (`V1__init_schema.sql`), and 8 demo advertisements across all four
   on-screen positions (`V2__seed_demo_ads.sql`) so ad rotation works
   without a manual upload first.

4. Package a runnable jar instead, if preferred:
   ```bash
   mvn clean package
   java -jar target/smart-ad-backend.jar
   ```

## Running via Docker

The provided `Dockerfile` is a multi-stage build (Maven build stage -> JRE 21
Alpine runtime) matching the shape expected by the `docker-compose.yml` at
the repository root, which wires up `mysql`, `redis`, and `minio` services
plus the environment variables consumed by `application-docker.yml`
(`SPRING_DATASOURCE_URL`, `SPRING_DATA_REDIS_HOST`, `AWS_S3_ENDPOINT`, etc.).

From the repository root:
```bash
docker compose up --build
```

The backend container is started with `SPRING_PROFILES_ACTIVE=docker` (baked
into the image's `ENTRYPOINT`/`ENV`), which switches the MySQL/Redis/MinIO
hostnames from `localhost` to the docker-compose service names (`mysql`,
`redis`, `minio`) while still honoring any of the same environment variables
if docker-compose supplies them explicitly.

To build/run the image standalone (pointing at services on your Docker
host), for example:
```bash
docker build -t smart-ad-backend .
docker run -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:mysql://host.docker.internal:3306/smartad \
  -e SPRING_DATA_REDIS_HOST=host.docker.internal \
  -e AWS_S3_ENDPOINT=http://host.docker.internal:9000 \
  -e JWT_SECRET=change-me \
  smart-ad-backend
```

## Configuration reference

All configuration is environment-variable driven; see `application.yml` /
`application-docker.yml` for the full list and their defaults. The
highlights below are a quick reference — see
**[`../docs/ENVIRONMENT.md`](../docs/ENVIRONMENT.md)** for the exhaustive,
cross-service version (including local-vs-Docker default differences and a
list of a couple of variables that turned out to have no effect and were
removed).

| Env var | Purpose | Default (local) |
|---|---|---|
| `SERVER_PORT` | HTTP port | `8080` |
| `SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD` | MySQL connection | `jdbc:mysql://localhost:3306/smartad`, `root`/`root` |
| `SPRING_DATA_REDIS_HOST` / `_PORT` | Redis connection | `localhost` / `6379` |
| `JWT_SECRET` | HS256 signing key (>= 256 bits recommended) | dev-only placeholder |
| `JWT_EXPIRATION_MS` | Token lifetime | `86400000` (24h) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins (REST + WS) | `http://localhost:5173,5174,5175` |
| `APP_FRONTEND_MOBILE_URL` | Base URL encoded into join QR codes | `http://localhost:5174` |
| `AWS_S3_ENDPOINT` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` / `AWS_S3_BUCKET` | MinIO/S3 for ad media | `http://localhost:9000`, `minioadmin`/`minioadmin`, `us-east-1`, `ads` |

## API surface

- REST: everything under `/api/**`, uniformly wrapped in
  `{ success, message, data }` (`ApiResponse<T>`).
- WebSocket (STOMP, no SockJS): connect to `/ws`, send a JWT via the STOMP
  `Authorization: Bearer <token>` native header on CONNECT, publish actions
  to `/app/game/{code}/action`, subscribe to `/topic/session/{code}/...`
  topics for players/countdown/state/game-update/leaderboard/game-end and
  per-player score/game-event topics.

See the controller classes under `src/main/java/com/smartad/controller` and
`src/main/java/com/smartad/websocket` for the exact request/response shapes.
