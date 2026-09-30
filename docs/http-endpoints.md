# UNO Backend — HTTP API Reference

Complete reference of every HTTP endpoint exposed by the UNO backend (42 endpoints). It was written from the source code (routes, controllers, services, schemas and middlewares), so the status codes and quirks listed here describe what the code actually does.

- **Base URL:** `http://localhost:<PORT>` (default port `3000`).
- **Interactive docs:** Swagger UI at `/api-docs`.
- **Real-time events:** see [`websocket-events.md`](websocket-events.md).

> [!IMPORTANT]
> **Logging in does not make a player ONLINE.** A player only appears as `ONLINE` after connecting to the WebSocket server **and** emitting the `join-player` event. There is no HTTP endpoint to change the online status. See [section 1.3](#13-online-status) and the [WebSocket documentation](websocket-events.md#2-online-status-how-a-player-becomes-visible-as-online).

## Table of contents

1. [Conventions](#1-conventions)
2. [Endpoints](#2-endpoints)
   - [2.1 Auth](#21-auth)
   - [2.2 Players](#22-players)
   - [2.3 Games](#23-games)
   - [2.4 Game players](#24-game-players)
   - [2.5 Cards (catalog)](#25-cards-catalog)
   - [2.6 Game cards](#26-game-cards)
   - [2.7 Game engine](#27-game-engine)
   - [2.8 Scores](#28-scores)
   - [2.9 History](#29-history)
   - [2.10 Stats](#210-stats)

---

## 1. Conventions

### 1.1 Authentication

Endpoints marked with 🔒 require the header `Authorization: Bearer <access_token>`. The token is obtained from `POST /auth/login`. The `Bearer ` prefix is optional. The JWT only carries `{ "id": "<playerId>" }` and expires after **24 hours**.

When authentication fails, every 🔒 endpoint answers with one of these:

| Status | Body | Cause |
|---|---|---|
| `401` | `{"message":"No token provided"}` | The `Authorization` header is missing |
| `401` | `{"message":"Token not entered","details":[]}` | The header is exactly `Bearer ` (no token after it) |
| `401` | `{"message":"Invalid token: user session closed"}` | The token was issued before the last `POST /auth/logout` of the player |
| `401` | `{"message":"jwt expired","details":[]}` | The token is older than 24 hours |
| `403` | `{"message":"jwt malformed","details":[]}` | The token is not a valid JWT for this server (bad signature, malformed, etc.) |

In the tables below, `401 / 403` is used as a shorthand for this table.

### 1.2 Error format

Every error that goes through the error middleware has this shape:

```json
{
  "message": "Validation failed",
  "details": ["\"title\" length must be at least 3 characters long"]
}
```

- `details` is an array. It is only filled for validation errors (`400`); otherwise it is `[]`.
- The two `401` responses that say `No token provided` and `Invalid token: user session closed` are the only ones that have no `details` field.
- **Validation (400):** request bodies are validated with Joi, all errors are reported at once, and **unknown properties are rejected** (for example `"status" is not allowed`).
- **404** messages follow the pattern `<entity> with ID <id> not found`.
- **500** is the fallback for any unexpected error (`internal server error`).

| Status | Meaning in this API |
|---|---|
| `200` | Success |
| `201` | Resource created |
| `204` | Success without body |
| `400` | Validation failed or invalid query parameters |
| `401` / `403` | Authentication problems (see [1.1](#11-authentication)) |
| `404` | The resource does not exist (or was soft-deleted) |
| `409` | The action conflicts with the current state (wrong turn, game not in the right status, duplicates, etc.) |
| `503` | The card catalog has not been initialized yet |
| `500` | Unexpected error |

### 1.3 Online status

> [!IMPORTANT]
> **To be visible as `ONLINE`, a player must:**
> 1. Log in over HTTP (`POST /auth/login`) to get the token.
> 2. Open a Socket.IO connection sending the token in `auth: { token }`.
> 3. **Emit the `join-player` event** on that socket.
>
> Steps 1 and 2 alone leave the player `OFFLINE`. Closing the last socket of the player (or stopping the server with `SIGINT`/`SIGTERM`) sets the player back to `OFFLINE`.

What depends on the online status:

| Where | Effect |
|---|---|
| `GET /players`, `GET /players/:id`, `GET /players/me` | The `status` field shows `ONLINE` / `OFFLINE`. `GET /players` lists `ONLINE` players first. |
| `GET /players/total` | Counts the players that have at least one socket that emitted `join-player` (in-memory count, not the database column). |
| WebSocket `send-invitation` | The invited player must be online, otherwise the server answers `404 player is not online`. |

`POST /auth/logout` marks the player `OFFLINE` in the database but **does not close their sockets**. Disconnect the socket as well. Full details and edge cases are in the [WebSocket documentation](websocket-events.md#2-online-status-how-a-player-becomes-visible-as-online).

### 1.4 Response caching

Several `GET` endpoints are cached in memory (memoization middleware). The cache key is the **full URL including the query string**; it is **not** per user, and error responses (for example a `404`) are cached as well. After a write, a cached `GET` can return the previous state until the time expires.

| Endpoint | Cache time | Max entries |
|---|---|---|
| `GET /cards` | 10 min | 1 |
| `GET /cards/:id` | 10 min | 108 |
| `GET /games` | 2 s | 100 |
| `GET /games/:id` | 5 s | 100 |
| `GET /games/:gameId/cards` | 2 s | 100 |
| `GET /games/:gameId/cards/top-card` | 2 s | 100 |
| `GET /games/:gameId/players` | 1 s | 100 |
| `GET /games/:gameId/players/current` | 2 s | 100 |
| `GET /games/:gameId/history` | 5 s | 20 |
| `GET /players` | 1 s | 100 |
| `GET /players/:id` | 20 s | 50 |
| `GET /scores/:id` | 1 s | 100 |
| `GET /scores/games/:gameId` | 2 s | 200 |

All other endpoints are **not cached**. When the cache is full the least recently used entry is evicted. To force a fresh read, add a throwaway query parameter (for example `?t=1727705100000`).

### 1.5 Pagination

`GET /games` and `GET /players` accept `page` (default `1`) and `limit` (default `5`). Both must be numbers greater than zero, otherwise the API answers `400` (`The params must be numbers` / `The params must be positive values`).

> [!NOTE]
> The next-page links (`nextPage` / `nextPageUrl`) are built with `page + 1`. When `page` is sent explicitly in the query string it is a string, so the link concatenates instead of adding (`page=1` produces `page=11`). Clients should calculate the next page themselves. The link is also returned on the last page.

### 1.6 Request tracking

Every request is recorded (endpoint pattern, method, status code, response time and user id) and exposed by the [Stats endpoints](#210-stats). The `/stats/*` routes and `/api-docs` are not recorded.

### 1.7 HTTP and WebSocket are separate channels

- HTTP endpoints **never emit WebSocket events** and **never join a socket to a game room**. Players connected by WebSocket are not notified of what other players do over HTTP.
- A player who joined a game with `POST /games/:gameId/players` is already registered, so a later `enter-game` fails with `409`. For real-time play, join with the WebSocket events.
- Use HTTP mainly to read state, and WebSocket events to act during a match.

### 1.8 Match flow over HTTP only

1. `POST /cards/initialize` (once per database) to create the 108 cards.
2. `POST /games` (owner), then `POST /games/:gameId/players` (each guest).
3. `PUT /games/:id/start` (owner). **This does not create the deck.**
4. `POST /games/:gameId/cards` to create the deck of the game.
5. `POST /games/:gameId/distribute` to deal the hands.
6. `PUT /games/:gameId/play` / `PUT /games/:gameId/draw` / `PATCH /games/:gameId/say-uno` / `POST /games/:gameId/challenge`, turn by turn.
7. The game finishes by itself when a player plays their last card, or with `PUT /games/:id/end` (owner).

Sample IDs used in this document: players `0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41` (Ana) and `7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8` (Luis), game `c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37`. Game players, cards and scores use integer IDs.

---

## 2. Endpoints

Columns: **URL**, **Description**, **Body example**, **Response example**, **Status codes**, **Notes**.

### 2.1 Auth

| URL | Description | Body example | Response example | Status codes | Notes |
|---|---|---|---|---|---|
| `POST /auth/register` | Registers a new player account. | `{"name":"Ana","age":22,"email":"ana@mail.com","password":"secret123"}`<br><br>`name`: 3–20 chars. `age`: integer 5–100. `email`: valid email. `password`: min 8 chars. All required. | **201**<br>`{"id":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","name":"Ana","age":22,"email":"ana@mail.com","status":"OFFLINE","createdAt":"2026-09-30T14:05:00.000Z"}` | `201` – player created.<br>`400` – validation failed (missing/invalid field or unknown property).<br>`409` – `The email is already registered`.<br>`500` – the password could not be hashed. | The password is stored hashed (bcrypt) and never returned. New players start `OFFLINE`; registering does not log the player in. The email check also counts deleted accounts, so the email of a deleted player cannot be registered again. |
| `POST /auth/login` | Authenticates a player with email and password and returns a JWT. | `{"email":"ana@mail.com","password":"secret123"}` | **200**<br>`{"access_token":"eyJhbGciOiJIUzI1NiIs...","playerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41"}` | `200` – authenticated.<br>`400` – `email` or `password` missing.<br>`401` – `player not registered` (unknown email) or `incorrect email or password`.<br>`500` – the password could not be compared. | ⚠️ **Does not set the player `ONLINE`.** Connect to the WebSocket and emit `join-player` (see [1.3](#13-online-status)). The token lasts 24 h. The login does not check whether the account was deleted; after that, profile endpoints answer `404`. |
| `POST /auth/logout` 🔒 | Closes the session of the authenticated player. | — | **200**<br>`{"message":"User logged out succesfully"}` | `200` – session closed.<br>`401 / 403` – authentication.<br>`404` – player not found. | Sets `status` to `OFFLINE` and stores `loggedOutAt`. From then on **every token issued before that moment is rejected** with `401 Invalid token: user session closed` (including the one used in this call). Sockets that are already open stay open (the token is only checked when the socket connects), so disconnect the socket too. A token issued in the same second as the logout is also rejected. |

### 2.2 Players

| URL | Description | Body example | Response example | Status codes | Notes |
|---|---|---|---|---|---|
| `GET /players?page=1&limit=5` | Lists players with pagination. `ONLINE` players come first, then alphabetical by name. | — | **200**<br>`{"players":{"ok":true,"result":[{"id":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","name":"Ana","age":22,"email":"ana@mail.com","status":"ONLINE","createdAt":"2026-09-30T14:05:00.000Z"}]},"nextPageUrl":"/players?page=2&limit=5"}` | `200` – list returned (can be empty).<br>`400` – `The params must be numbers` or `The params must be positive values`. | The list is wrapped inside `players.result` (the controller returns the internal result object as is). `prevPageUrl` is added when `page > 1`. `status` is `ONLINE` only for players that emitted `join-player`. See the next-page quirk in [1.5](#15-pagination). Cached 1 s. The email of every player is included. |
| `GET /players/me` 🔒 | Returns the profile of the authenticated player. | — | **200**<br>`{"id":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","name":"Ana","age":22,"email":"ana@mail.com","status":"OFFLINE","createdAt":"2026-09-30T14:05:00.000Z"}` | `200` – profile returned.<br>`401 / 403` – authentication.<br>`404` – the player does not exist or was deleted. | Not cached. `status` is `OFFLINE` until the player emits `join-player` on a connected socket. |
| `GET /players/total` | Returns how many players are currently online. | — | **200**<br>`{"total":3}` | `200` – always. | ⚠️ Counts players that have at least one socket that emitted `join-player` (in-memory registry). Logging in or only connecting a socket does **not** count. The value resets to `0` when the server restarts. Not cached. |
| `GET /players/:id` | Returns a player by ID. | — | **200**<br>`{"id":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8","name":"Luis","age":25,"email":"luis@mail.com","status":"OFFLINE","createdAt":"2026-09-29T10:00:00.000Z"}` | `200` – player returned.<br>`404` – `player with ID <id> not found`. | Cached 20 s (the `status` can be up to 20 seconds old, and a cached `404` is also kept). |
| `PUT /players` 🔒 | Updates the name and age of the authenticated player. | `{"name":"Ana Maria","age":23}`<br><br>`name`: 3–20 chars. `age`: integer 5–100. Both required. | **200**<br>`{"id":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","name":"Ana Maria","age":23,"email":"ana@mail.com","status":"ONLINE","createdAt":"2026-09-30T14:05:00.000Z"}` | `200` – updated.<br>`400` – validation failed (for example sending `email` or `password`, which are not allowed).<br>`401 / 403` – authentication.<br>`404` – player not found. | The player is taken from the token; there is no ID in the URL. Email and password cannot be changed. |
| `DELETE /players` 🔒 | Deletes the account of the authenticated player (soft delete). | — | **204** (no body) | `204` – deleted.<br>`401 / 403` – authentication.<br>`404` – player not found. | The record is only flagged as deleted. The token keeps passing authentication, but profile calls answer `404`. The email stays reserved. Game memberships are not removed and open sockets are not closed. |

### 2.3 Games

| URL | Description | Body example | Response example | Status codes | Notes |
|---|---|---|---|---|---|
| `GET /games?page=1&limit=5` | Lists the games that are waiting for players (`WAITING`), newest first. | — | **200**<br>`{"games":[{"id":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","title":"Friday night","maxPlayers":4,"status":"WAITING","ownerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","winnerId":null,"createdAt":"2026-09-30T14:10:00.000Z","rules":{"allowDrawFour":true,"allowAccumulateDraw":false,"allowReverse":true}}],"nextPage":"/games?page=2&limit=5"}` | `200` – list returned (can be empty).<br>`400` – invalid `page` / `limit`. | Only `WAITING` games are listed. `nextPage` is always present (see [1.5](#15-pagination)). Cached 2 s. |
| `GET /games/:id/status` | Returns the live state of a game. | — | **200** (`WAITING`)<br>`{"game":{"id":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","title":"Friday night","maxPlayers":4,"status":"WAITING","ownerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","winnerId":null,"currentColor":null,"createdAt":"2026-09-30T14:10:00.000Z"},"players":[{"id":1,"playerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","name":"Ana"}]}`<br><br>**200** (`PLAYING` / `FINISHED`)<br>`{"game":{...,"status":"PLAYING","currentColor":"RED"},"currentPlayer":{"id":1,"playerId":"0b9f0c3e-...","name":"Ana"},"topCard":{"id":37,"color":"RED","value":"5","type":"NUMBER"},"hands":[{"playerId":"0b9f0c3e-...","cards":[{"id":12,"color":"BLUE","value":"2","type":"NUMBER"}]}],"history":[{"action":"played RED 5","player":"Luis"}]}` | `200` – status returned.<br>`404` – `game with ID <id> not found`. | Not cached. `hands` contains the cards of **every** player. `currentPlayer` is `null` when the game is `FINISHED`; `topCard` is `null` until the cards are distributed. |
| `GET /games/:id` | Returns a game with its rules. | — | **200**<br>`{"id":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","title":"Friday night","maxPlayers":4,"status":"WAITING","ownerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","winnerId":null,"createdAt":"2026-09-30T14:10:00.000Z","rules":{"allowDrawFour":true,"allowAccumulateDraw":false,"allowReverse":true}}` | `200` – game returned.<br>`404` – game not found or deleted. | Cached 5 s (a just-updated game can look stale). |
| `POST /games` 🔒 | Creates a game. The authenticated player becomes the owner. | `{"title":"Friday night","maxPlayers":4,"rules":{"allowDrawFour":true,"allowAccumulateDraw":false,"allowReverse":true}}`<br><br>`title`: 3–30 chars. `maxPlayers`: integer ≥ 2. The three `rules` booleans are required. | **201**<br>`{"id":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","title":"Friday night","maxPlayers":4,"status":"WAITING","ownerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","createdAt":"2026-09-30T14:10:00.000Z","rules":{"allowDrawFour":true,"allowAccumulateDraw":false,"allowReverse":true}}` | `201` – game created.<br>`400` – validation failed (`status` and `ownerId` are not accepted).<br>`401 / 403` – authentication.<br>`404` – the owner player was not found.<br>`500` – `rules` was omitted. | The owner is automatically registered as the first player. This endpoint does **not** join the owner to a WebSocket room; use the `create-game` WebSocket event for that. The schema lets `rules` be omitted, but then the server fails with `500`, so always send it. |
| `PUT /games/:id` 🔒 | Updates title, maximum players and rules of a game. | `{"title":"Saturday night","maxPlayers":6,"rules":{"allowDrawFour":false,"allowAccumulateDraw":true,"allowReverse":true}}`<br><br>`title` and `maxPlayers` required. `rules` optional, but if present all three booleans are required. | **200**<br>`{"id":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","title":"Saturday night","maxPlayers":6,"status":"WAITING","ownerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","winnerId":null,"createdAt":"2026-09-30T14:10:00.000Z","rules":{"allowDrawFour":false,"allowAccumulateDraw":true,"allowReverse":true}}` | `200` – updated.<br>`400` – validation failed.<br>`401 / 403` – authentication.<br>`404` – game not found. | The code does **not** check that the caller is the owner, nor that the game is still `WAITING`; any authenticated player can edit any game. Does not notify sockets (the `update-game` WebSocket event broadcasts `game-updated`). |
| `PUT /games/:id/start` 🔒 | Starts a game (`WAITING` → `PLAYING`). | — | **200**<br>`{"message":"Game started succesfully"}` | `200` – started.<br>`401 / 403` – authentication.<br>`404` – game or player not found.<br>`409` – the game is already playing, already finished, has fewer than 2 players, or the caller is not the owner. | **Only changes the status.** It does **not** create the deck: call `POST /games/:gameId/cards` afterwards. The `start-game` WebSocket event does both and broadcasts `game-started`. |
| `PUT /games/:id/end` 🔒 | Finishes a game that is being played (`PLAYING` → `FINISHED`). | — | **200**<br>`{"message":"Game ended succesfully"}` | `200` – finished.<br>`401 / 403` – authentication.<br>`404` – game or player not found.<br>`409` – the game is not playing yet, already finished, or the caller is not the owner. | Owner only. It does not set a winner, does not calculate scores and does not notify sockets. Scores are only calculated when a player plays their last card. |
| `DELETE /games/:id` 🔒 | Deletes a game (soft delete). | — | **204** (no body) | `204` – deleted.<br>`401 / 403` – authentication.<br>`404` – game not found. | The code does not check ownership. Players and cards are kept, but the game answers `404` from then on. Sockets in the room are not notified. |

### 2.4 Game players

| URL | Description | Body example | Response example | Status codes | Notes |
|---|---|---|---|---|---|
| `POST /games/:gameId/players` 🔒 | Adds the authenticated player to a game. | — | **201**<br>`{"id":2,"gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","playerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8","score":0}` | `201` – player added.<br>`401 / 403` – authentication.<br>`404` – player or game not found.<br>`409` – the player is already in the game, the game is not `WAITING`, or the game is full. | Does not join the WebSocket room and does not emit `player-joined`. A player added here gets `409` if they later emit `enter-game`; prefer `enter-game` for real-time games. Turn position is assigned after the last player. |
| `DELETE /games/:gameId/players` 🔒 | Removes the authenticated player from a game. | — | **204** (no body) | `204` – player removed.<br>`401 / 403` – authentication.<br>`404` – game not found, or the player is not in the game.<br>`409` – the game is already finished. | If the owner leaves a `WAITING` game, the whole game is deleted. In a `PLAYING` game, if one or fewer players remain the game becomes `FINISHED` and the remaining player wins; if the leaving player had the turn, the turn passes to the next player. No WebSocket events are emitted. |
| `GET /games/:gameId/players` | Lists the players of a game, ordered by turn position. | — | **200**<br>`{"gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","players":[{"id":1,"playerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","name":"Ana"},{"id":2,"playerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8","name":"Luis"}]}` | `200` – list returned. | An unknown or deleted game returns an empty `players` array instead of `404`. Cached 1 s. `id` is the game-player id (the same id used by the scores endpoints). |
| `GET /games/:gameId/players/current` | Returns the player whose turn it is. | — | **200**<br>`{"gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","player":{"id":1,"playerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","name":"Ana"}}` | `200` – current player returned.<br>`404` – game not found.<br>`409` – the game is not being played (`game with ID … is not in playing state`). | Cached 2 s, so right after a move it can still show the previous player. |

### 2.5 Cards (catalog)

| URL | Description | Body example | Response example | Status codes | Notes |
|---|---|---|---|---|---|
| `POST /cards/initialize` | Seeds the catalog with the 108 cards of the original UNO deck. | — | **201**<br>`{"message":"cards created succesfully"}` | `201` – cards created.<br>`409` – `Cards already initialized`. | Public (no token). Run it once before creating any deck. If the catalog does not contain exactly 108 cards it is wiped and created again with new IDs. |
| `GET /cards` | Lists every card of the catalog. | — | **200**<br>`[{"id":1,"color":"GREEN","value":"1","type":"NUMBER"},{"id":20,"color":"GREEN","value":null,"type":"BLOCK"},{"id":105,"color":"MULTICOLOR","value":null,"type":"WILD"}]` | `200` – list returned (empty if not initialized). | Colors: `GREEN`, `BLUE`, `YELLOW`, `RED`, `MULTICOLOR`. Types: `NUMBER`, `BLOCK`, `REVERSE`, `+2`, `+4`, `WILD`. `value` is `null` for non-number cards. Cached 10 min, so it can look empty right after `POST /cards/initialize`. |
| `GET /cards/:id` | Returns one catalog card. | — | **200**<br>`{"id":37,"color":"RED","value":"5","type":"NUMBER"}` | `200` – card returned.<br>`404` – `card with ID <id> not found`. | Cached 10 min (including a `404`). |

### 2.6 Game cards

Cards that belong to a specific game (deck, hands and discard pile). The `zone` of a game card is `DECK`, `HAND` or `DISCARD`.

| URL | Description | Body example | Response example | Status codes | Notes |
|---|---|---|---|---|---|
| `POST /games/:gameId/cards` 🔒 | Creates and shuffles the deck of a game from the card catalog. | — | **201**<br>`{"message":"Deck created succesfully"}` | `201` – deck created.<br>`401 / 403` – authentication.<br>`404` – game not found.<br>`409` – `Game with ID <id> already has a deck`.<br>`503` – `Cards are not already initialized` (run `POST /cards/initialize`). | `+4` cards are left out when `allowDrawFour` is `false`, and `REVERSE` cards when `allowReverse` is `false`. There is no owner or status check. The `start-game` WebSocket event already calls this, so use it only in HTTP-only flows (or to recover when `start-game` failed after the game became `PLAYING`). |
| `GET /games/:gameId/cards` | Lists every card of the game with its zone and owner. | — | **200**<br>`[{"gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","cardId":37,"zone":"DISCARD","position":1,"playerId":null},{"gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","cardId":12,"zone":"HAND","position":null,"playerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41"}]` | `200` – list returned (empty if there is no deck).<br>`404` – game not found. | Sorted by `position`. It reveals which player holds every card, so it exposes the other players' hands. Cached 2 s. |
| `GET /games/:gameId/cards/top-card` | Returns the top card of the discard pile. | — | **200**<br>`{"gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","topCard":{"id":37,"color":"RED","value":"5","type":"NUMBER"}}` | `200` – returned.<br>`404` – game not found. | `topCard` is `null` while the discard pile is empty (before `distribute`). Cached 2 s. |
| `GET /games/:gameId/cards/hand` 🔒 | Returns the hand of the authenticated player. | — | **200**<br>`{"playerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","hand":[{"id":12,"color":"BLUE","value":"2","type":"NUMBER"},{"id":105,"color":"MULTICOLOR","value":null,"type":"WILD"}]}` | `200` – hand returned.<br>`401 / 403` – authentication.<br>`404` – game not found, or `player with ID <id> not found` (the player is not in the game).<br>`409` – the game is not `PLAYING`. | Not cached. Use it to refresh the hand after events that do not include the cards (for example `player-challenged`). |
| `PUT /games/:gameId/cards/:cardId` 🔒 | Moves a card to another zone, position or player (low-level operation). | `{"zone":"HAND","position":null,"playerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41"}`<br><br>`zone`: `DECK`, `HAND` or `DISCARD` (required). `position`: integer (optional). `playerId`: string (optional). | **200**<br>`{"gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","cardId":12,"zone":"HAND","position":null,"playerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41"}` | `200` – card updated.<br>`400` – validation failed.<br>`401 / 403` – authentication.<br>`404` – game, card, or `player in game` not found.<br>`409` – the game is not `PLAYING`.<br>`500` – the card exists but is not part of this game's deck. | Bypasses all game rules and any authenticated player can use it; it is meant for debugging/administration. `playerId` is only kept when `zone` is `HAND`, and `position` is cleared unless `zone` is `DECK`. |

### 2.7 Game engine

Gameplay actions. The acting player is always the one in the token. These endpoints change the game but **do not notify sockets**; real-time clients should use the equivalent WebSocket events (`distribute-cards`, `play-card`, `draw`, `say-uno`, `challenge`).

| URL | Description | Body example | Response example | Status codes | Notes |
|---|---|---|---|---|---|
| `POST /games/:gameId/distribute` 🔒 | Deals the initial hands and puts the first card on the discard pile. | `{"cardsPerPlayer":7}`<br><br>Integer between 3 and 10, required. | **201**<br>`{"message":"Cards distributed succesfully","players":[{"playerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","cards":[{"id":12,"color":"BLUE","value":"2","type":"NUMBER"}]},{"playerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8","cards":[{"id":58,"color":"RED","value":"9","type":"NUMBER"}]}]}` | `201` – cards dealt.<br>`400` – `cardsPerPlayer` missing or out of range.<br>`401 / 403` – authentication.<br>`404` – game not found.<br>`409` – the game is not `PLAYING`, the cards were already distributed, or the game has no deck. | Can only be done once per game and needs the deck (`POST /games/:gameId/cards`) first. The first discarded card is always a `NUMBER` card; special cards found on top are skipped. The current color is taken from that card. The caller is not required to be in the game. |
| `PUT /games/:gameId/play` 🔒 | Plays a card from the hand of the authenticated player. | `{"cardId":105,"newColor":"RED"}`<br><br>`cardId`: positive integer (required). `newColor`: `RED`, `GREEN`, `BLUE`, `YELLOW` or `null` (optional, used with `MULTICOLOR` cards). | **200** (normal)<br>`{"action":"Card played","played":{"id":105,"color":"MULTICOLOR","value":null,"type":"WILD"},"nextPlayer":{"id":2,"playerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8","name":"Luis"}}`<br><br>**200** (last card played)<br>`{"action":"Player won the game","played":{"id":37,"color":"RED","value":"5","type":"NUMBER"},"winner":{"id":1,"playerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","name":"Ana"},"scores":[{"id":1,"name":"Ana","score":0},{"id":2,"name":"Luis","score":35}]}` | `200` – card played.<br>`400` – invalid `cardId` / `newColor`.<br>`401 / 403` – authentication.<br>`404` – no current player, game not found, or `card with ID <id> not found`.<br>`409` – it is not the player's turn, the game is not `PLAYING`, the card is not in the player's hand, the card does not match the top card, `+4` is disabled by the rules, `REVERSE` is disabled, or the player must draw first. | A card matches if it has the same color or value as the top card, or is `MULTICOLOR`. `BLOCK` skips the next player, `REVERSE` flips the direction, `+2`/`+4` force the next player to draw (`allowAccumulateDraw` lets them stack). A `MULTICOLOR` card played without `newColor` keeps the current color. When the hand becomes empty the game is set to `FINISHED`, the winner is stored and the scores are calculated (number value for number cards, 20 for `BLOCK`/`REVERSE`/`+2`, 50 for `WILD`/`+4`). |
| `PUT /games/:gameId/draw` 🔒 | Draws cards when the player has no playable card. | — | **200** (turn passes)<br>`{"action":"card drawn and pass turn","drawnCards":[{"id":52,"color":"GREEN","value":"9","type":"NUMBER"}],"nextPlayer":{"id":2,"playerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8","name":"Luis"}}`<br><br>**200** (drawn card is playable)<br>`{"action":"card drawn","drawnCards":[{"id":52,"color":"RED","value":"1","type":"NUMBER"}],"nextPlayer":{"id":1,"playerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","name":"Ana"}}` | `200` – cards drawn.<br>`401 / 403` – authentication.<br>`404` – no current player (`player with ID <id> not found`).<br>`409` – the game is not `PLAYING`, it is not the player's turn, or the player has a valid card in hand. | Returns **all** the cards drawn in one call (for example 2 or 4 when a `+2`/`+4` is pending). If the single drawn card can be played, the player keeps the turn (`nextPlayer` is the same player). When the deck runs out, the discard pile is reshuffled into it. Drawing resets the `said UNO` flag. |
| `PATCH /games/:gameId/say-uno` 🔒 | Declares UNO when the player has one card left. | — | **200**<br>`{"action":"Said uno","player":{"id":1,"playerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","name":"Ana"}}` | `200` – UNO declared.<br>`401 / 403` – authentication.<br>`404` – game not found, or the player is not in the game.<br>`409` – the game is not `PLAYING`, the player already said UNO, or still has more than one card. | It does not have to be the player's turn. |
| `POST /games/:gameId/challenge` 🔒 | Challenges a player who has one card and did not say UNO. | `{"challengedPlayerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8"}`<br><br>Required string. | **200**<br>`{"action":"player Luis challenged","challenger":{"id":1,"playerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","name":"Ana"},"challengedPlayer":{"id":2,"playerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8","name":"Luis"}}` | `200` – challenge accepted.<br>`400` – `challengedPlayerId` missing.<br>`401 / 403` – authentication.<br>`404` – game not found, `player challenged` not found, or `player challenging` not found.<br>`409` – the player challenges themselves, the game is not `PLAYING`, the challenged player already said UNO, or has more than one card. | The challenged player draws 2 cards, but the response does not include them (the challenged player can read them with `GET /games/:gameId/cards/hand`). |

### 2.8 Scores

`id` in these endpoints is the **game-player id** (the `id` returned by `GET /games/:gameId/players`), not the player id.

| URL | Description | Body example | Response example | Status codes | Notes |
|---|---|---|---|---|---|
| `GET /scores/:id` | Returns the score of one player in one game. | — | **200**<br>`{"id":2,"name":"Luis","score":35}` | `200` – score returned.<br>`404` – `score with ID <id> not found`. | Cached 1 s. |
| `GET /scores/games/:gameId` | Returns the scores of every player in a game. | — | **200**<br>`{"gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","scores":[{"id":1,"name":"Ana","score":0},{"id":2,"name":"Luis","score":35}]}` | `200` – scores returned. | An unknown or deleted game returns an empty `scores` array instead of `404`. Cached 2 s. |
| `PUT /scores/:id` 🔒 | Overwrites a score manually. | `{"score":10}`<br><br>Integer ≥ 0, required. | **200**<br>`{"id":2,"name":"Luis","score":10}` | `200` – score updated.<br>`400` – validation failed.<br>`401 / 403` – authentication.<br>`404` – `gamePlayer with ID <id> not found`. | Any authenticated player can change any score. Normally scores are produced by the engine when a player plays their last card. |

### 2.9 History

| URL | Description | Body example | Response example | Status codes | Notes |
|---|---|---|---|---|---|
| `GET /games/:gameId/history` | Returns the action log of a game. | — | **200**<br>`{"gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","history":[{"action":"played RED 5","player":"Ana"},{"action":"drew 1 card and pass the turn","player":"Luis"}]}` | `200` – history returned (empty if nothing was played).<br>`404` – game not found. | Only plays and draws are recorded: `played <COLOR> <value or type>`, `drew 1 card`, `drew 1 card and pass the turn`, `drew <n> cards and pass the turn`. Cached 5 s. |

### 2.10 Stats

Public endpoints built from the recorded requests (see [1.6](#16-request-tracking)). Response times are in milliseconds.

| URL | Description | Body example | Response example | Status codes | Notes |
|---|---|---|---|---|---|
| `GET /stats/requests` | Total requests, broken down by endpoint and HTTP method. | — | **200**<br>`{"totalRequests":152,"breakdown":{"/auth/login":{"POST":12},"/games/:gameId/players":{"GET":30,"POST":4}}}` | `200` – returned.<br>`500` – unexpected error. | Endpoints are stored as route patterns (`/games/:gameId/players`). Requests to routes that do not exist are stored with the raw URL. |
| `GET /stats/response-times` | Average, minimum and maximum response time per endpoint. | — | **200**<br>`{"/auth/login":{"avg":85.213,"min":60.12,"max":130.4}}` | `200` – returned (`{}` when nothing was recorded).<br>`500` – unexpected error. | Values in milliseconds; `avg` is rounded to 3 decimals. |
| `GET /stats/status-codes` | Number of responses per HTTP status code. | — | **200**<br>`{"200":120,"201":10,"401":3,"409":7}` | `200` – returned (`{}` when nothing was recorded).<br>`500` – unexpected error. | Keys are status codes as strings. |
| `GET /stats/popular-endpoints` | The most used endpoint. | — | **200**<br>`{"mostPopular":"/games/:gameId/players","requestsCount":34}` | `200` – returned.<br>`500` – no request has been recorded yet (empty table). | With an empty table the server fails with `500` instead of returning an empty result. |

