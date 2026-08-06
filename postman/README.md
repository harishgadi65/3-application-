# SmartAd API — Postman Collection

Exercises the full REST API without needing any of the three frontend apps.

## Import

1. Postman → **Import** → select both `SmartAd-API.postman_collection.json`
   and `SmartAd-Local.postman_environment.json`.
2. Select the **"SmartAd - Local"** environment in Postman's environment
   dropdown (top right).
3. Make sure the backend is actually running and reachable at
   `http://localhost:8080` (`docker compose up --build`, or `mvn
   spring-boot:run` — see the root `README.md`).

## Running it

Requests are grouped in folders in the order a full pass should run them:
**Auth → Games → Advertisements → Sessions → Leaderboard → Players → Admin**.
Test scripts on `Register Player`, `Admin Login`, `Create Session`, `Upload
Ad`, and `Join Session` capture what later requests need
(`userToken`/`userId`, `adminToken`, `sessionCode`, `adId`) into the
environment automatically — you don't need to copy anything by hand, with one
exception:

- **Advertisements → Upload Ad** needs a real file. Postman collections can't
  embed a file reference portably, so this one request needs you to open it,
  click the `file` form field, and pick any local image (or video, matching
  the `mediaType` field) before sending. Everything else runs unattended.

To smoke-test the whole thing at once, open the collection's **⋮ → Run
collection** (Collection Runner) with the "SmartAd - Local" environment
selected, and either skip **Upload Ad**/**Update Ad**/**Delete Ad** (since
Upload needs a manual file pick) or attach a fixed file to that request
first via **file upload settings**.

A typical pass:
1. **Register Player** — creates a throwaway account (`{{$randomInt}}`
   username, so it's safe to re-run), captures `userToken`/`userId`.
2. **Admin Login** — logs in as the seeded demo admin (`admin`/`admin123`),
   captures `adminToken`.
3. **Create Session** — admin creates a `SNAKE` session, captures
   `sessionCode`.
4. **Get Session QR Code** — GET the PNG; use Postman's response **Preview**
   tab to actually see the QR image.
5. **Join Session** — the registered player joins.
6. **Start Session** / **End Session** — admin drives the session through
   its lifecycle (actual gameplay only happens over WebSocket, so this
   collection starts/ends sessions but can't play them).
7. **Get Results** — final rankings once `FINISHED`.

## Known correctness note this collection surfaces

**`Join Session`'s test script leaves a comment worth reading if you go on to
test WebSocket topics manually**: the game engine keys per-player topics
(`/topic/session/{code}/player/{playerId}/...`) and leaderboard rows'
`playerId` field on the account's **`User.id`** — the same `id` captured as
`{{userId}}` from Register/Login — **not** the `id` field returned by the
join response itself, which is the `PlayerSession` row's own id (a different
number). Use `{{userId}}`, not the join response's `data.id`, if you
subscribe to per-player topics by hand.

## Testing the WebSocket/STOMP side

This collection is REST-only — the actual gameplay (player actions, live
game-state broadcasts, countdown, leaderboard pushes, game-end) happens over
raw STOMP-over-WebSocket at `{{wsUrl}}` (`ws://localhost:8080/ws`), which
isn't something a portable Postman collection JSON can reliably encode across
Postman versions. To poke at it manually instead:

- **Postman itself** supports WebSocket requests interactively (New →
  WebSocket Request) — connect to `ws://localhost:8080/ws`, then send raw
  STOMP frames by hand, e.g. to connect:
  ```
  CONNECT
  accept-version:1.2
  host:localhost
  Authorization:Bearer <userToken or adminToken>

  ^@
  ```
  (`^@` is a literal null byte terminating the frame — in Postman's WebSocket
  message box, use its "send raw" mode.) Then `SUBSCRIBE` to a topic like
  `/topic/session/{sessionCode}/state` the same way.
- Simpler: use a dedicated STOMP-aware tool/library (e.g. a small Node script
  with `@stomp/stompjs`, the same package the frontend apps already use) if
  you want to script this rather than send frames by hand.
- Simplest of all: just run the real `mobile-web`/`tv-display` apps — see the
  root `README.md`'s demo walkthrough.
