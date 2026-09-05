# UNO Game — Backend (Capstone Project)

## 1. Project summary

This is the backend of **UNO**, a real-time multiplayer card game built as the capstone project for Programming 4. It exposes a REST API (Express) for account management, game creation, gameplay actions and statistics, plus a **Socket.IO** layer that drives the actual match in real time (joining rooms, playing cards, drawing, saying "UNO", challenging other players).

- 🎥 Video demo: see [section 11](#11-video-demo) for the link.
- 📬 Postman collection: [`UNO.postman_collection.json`](UNO.postman_collection.json), described in [section 9](#9-postman).

> **This project is built 100% with functional programming: no `class`, no `this`, no `new`**, with two narrow, justified exceptions where the underlying libraries require it: `new Server(...)` from `socket.io` in [`src/websocket/socket.server.js`](src/websocket/socket.server.js), and the built-in JS `new Error(...)` used as a plain data constructor for error objects, not as an OOP design choice. Every piece of code this project owns — services, controllers, repositories, middlewares, DTOs, validators — is written as plain factory functions and closures instead of classes.

---

## 2. Map of FP concepts applied (week by week)

| Concept | Where it lives in this project |
|---|---|
| Pure functions / immutability | [`src/dto/*.js`](src/dto) — every DTO is a pure `(data) => newObject` transformer with no side effects; [`src/helpers/result.helper.js`](src/helpers/result.helper.js) → `ok`, `err` |
| Higher-order functions (`map`/`filter`/`reduce`) | [`src/services/request-stats.service.js`](src/services/request-stats.service.js) (`lodash.groupBy` combined with `Object.entries().map()`/`reduce()` to build the requests-per-endpoint, response-time and status-code breakdowns); [`src/services/game-engine.service.js`](src/services/game-engine.service.js) → `calculateScores` (`reduce`); [`src/services/game-player.service.js`](src/services/game-player.service.js) → `deleteGamePlayer` (`filter`) |
| Composition (validator pipeline, in place of `pipe`/`compose`) | [`src/helpers/result.helper.js`](src/helpers/result.helper.js) → `runValidators`, which folds an array of validator functions with `reduce`, short-circuiting as soon as one returns `err` — the same role a `pipe` of `Either`-returning steps would play. There is no separate `pipe.js` utility in this project; see [section 12](#12-decisions-and-known-limitations) |
| Currying / partial application | [`src/middlewares/structure.middleware.js`](src/middlewares/structure.middleware.js) → `validate(schema)` returns the actual `(req, res, next)` middleware; [`src/middlewares/memoize.middleware.js`](src/middlewares/memoize.middleware.js) → `createMemoize({ max, maxAge })` returns the configured middleware, reused with a different configuration per route across [`src/routes`](src/routes); every `createXService(dep1, dep2, ...)` / `createXController(service)` factory in [`src/services`](src/services) and [`src/controllers`](src/controllers) is a partially-applied function returning the actual service/controller object — this is also how [Dependency Inversion](#3-architecture-and-solid-applied-with-fp) is implemented |
| Closures (encapsulated state without classes) | [`src/middlewares/memoize.middleware.js`](src/middlewares/memoize.middleware.js) → the `cache` `Map` is private state trapped in the closure returned by `createMemoize`, inaccessible from the outside; every `createXService`/`createXController` factory closes over its injected dependencies instead of storing them on `this` |
| Recursion | [`src/services/game-engine.service.js`](src/services/game-engine.service.js) → `distribute` (inner function of `distributeCards`): base case `cardsPerPlayer == 0`, recursive case deals one card per player and recurses with `cardsPerPlayer - 1` |
| Monads (own `Result` type, equivalent to `Either`) | [`src/helpers/result.helper.js`](src/helpers/result.helper.js) → `ok`/`err` wrap every outcome as `{ ok: true, result }` / `{ ok: false, error }`; every service function returns this type instead of throwing, and every controller pattern-matches on `.ok` before responding |

---


| Week | Concept | Where it lives in this project |
|---|---|---|
| **1** | npm, `package.json`, SemVer, Express basics | [`package.json`](package.json), [`server.js`](server.js), [`src/app.js`](src/app.js) — same `npm init` → `npm install express` → `app.listen` flow |
| **2** | Pure functions, immutability, HOF | [`src/dto`](src/dto) (every function returns a brand-new object, never mutates its input), [`src/helpers/result.helper.js`](src/helpers/result.helper.js) |
| **2** | **Partial application / currying** | [`src/middlewares/structure.middleware.js`](src/middlewares/structure.middleware.js) → `validate(schema)`; [`src/middlewares/memoize.middleware.js`](src/middlewares/memoize.middleware.js) → `createMemoize({ max, maxAge })` |
| **3** | Closures, scope, REST endpoint design | Every factory in [`src/services`](src/services) and [`src/controllers`](src/controllers) (dependency injection via closure, wired once in [`src/compositions.js`](src/compositions.js)); private cache in [`src/middlewares/memoize.middleware.js`](src/middlewares/memoize.middleware.js) |
| **4** | Unit testing, AAA pattern, mocks | [`test/unit`](test/unit) — 36 test suites / 262 tests, see [section 8](#8-testing-and-coverage) |
| **4** | End-to-end testing with Jest + `fetch` | [`test/e2e`](test/e2e), see [`end-to-end test documentation.md`](end-to-end%20test%20documentation.md) |
| **5** | Own Result type (**Either**-equivalent) | [`src/helpers/result.helper.js`](src/helpers/result.helper.js) (`ok`/`err`), used across *every* service in [`src/services`](src/services) and consumed uniformly by every controller |
| **5** | The 5 SOLID principles in FP (no classes) | [Section 3 of this README](#3-architecture-and-solid-applied-with-fp) |
| **5** | Centralized error handling | [`src/middlewares/error.middleware.js`](src/middlewares/error.middleware.js) (HTTP) and [`src/websocket/middlewares/error.socket-wrapper.js`](src/websocket/middlewares/error.socket-wrapper.js) (WebSocket), both logging through [`config/winston-logger.config.js`](config/winston-logger.config.js) |
| **6** | Recursion | [`src/services/game-engine.service.js`](src/services/game-engine.service.js) → `distribute` inside `distributeCards` |
| **6** | Concurrency with promises (`Promise.all`) | [`src/services/game.service.js`](src/services/game.service.js) → `getGameStatus` (fetches every player's hand concurrently); [`src/services/game-engine.service.js`](src/services/game-engine.service.js) → `calculateScores` |
| **7** | Memoization + configurable middleware | [`src/middlewares/memoize.middleware.js`](src/middlewares/memoize.middleware.js) → `createMemoize`, configured per route (different `max`/`maxAge` per endpoint) across [`src/routes`](src/routes) |
| **7** | Validator pipelines (fold instead of `pipe`) | [`src/helpers/result.helper.js`](src/helpers/result.helper.js) → `runValidators`, used by every business-rule set in [`src/services/validators`](src/services/validators) (`game-start`, `game-finish`, `add-game-player`, `rules-play-card`, `has-valid-card`) |
| **7** | `filter`/`reduce` data pipelines over collections | [`src/services/request-stats.service.js`](src/services/request-stats.service.js) |

---

## 3. Architecture and SOLID applied with FP

### Layers

```
┌─────────────────────────────────────────────────────────────┐
│ PRESENTATION                                                │
│  src/routes        → URL + HTTP verb → controller wiring    │
│  src/controllers    → translate HTTP <-> service calls      │
│  src/middlewares    → auth, validation, memoization, errors │
│  src/schemas        → Joi request-body contracts            │
│  src/websocket       → Socket.IO handlers/callbacks (a      │
│                        second, real-time presentation layer)│
├─────────────────────────────────────────────────────────────┤
│ APPLICATION (business logic)                                │
│  src/services         → game rules, turn logic, scoring     │
│  src/services/validators → composable business-rule checks  │
│  src/dto               → pure request/response shaping      │
│  src/helpers            → Result type (ok/err), 404/409     │
├─────────────────────────────────────────────────────────────┤
│ DOMAIN / DATA ACCESS                                        │
│  src/repositories → Sequelize queries, one file per entity  │
│  src/models         → table definitions + associations      │
│  src/database        → MySQL connection (Sequelize)         │
└─────────────────────────────────────────────────────────────┘
```

Every arrow between layers is wired **once**, explicitly, in [`src/compositions.js`](src/compositions.js): repositories are created first, then injected into services, then services are injected into controllers.

### SOLID, letter by letter, without classes

- **S — Single Responsibility.** This principle is present across the whole project: every function has exactly one responsibility. [`src/repositories/game.repository.js`](src/repositories/game.repository.js) only talks to MySQL/Sequelize, [`src/services/game.service.js`](src/services/game.service.js) only applies business rules, [`src/dto/game.dto.js`](src/dto/game.dto.js) only reshapes data, [`src/controllers/game.controller.js`](src/controllers/game.controller.js) only translates HTTP input and output. Even inside a validator file, each function checks exactly one rule — e.g. [`src/services/validators/game-start.validator.js`](src/services/validators/game-start.validator.js) has one function per condition (`gameMustExist`, `gameMustBeWaiting`, `gameMustMimimumPlayers`, `playerMustExist`, `playerMustBeOwner`).

- **O — Open/Closed.** Implemented in two ways:
  - **Validation plugins.** The functions that add a player to a game, start a game, and finish a game each validate their input *before* generating any change. This is implemented as a plugin system: the service receives a list of validation functions and runs them through `runValidators`, so adding a new business rule means adding a new function to that list — `runValidators` (in [`src/helpers/result.helper.js`](src/helpers/result.helper.js)) and the service itself (e.g. `startGame` in [`src/services/game.service.js`](src/services/game.service.js)) never need to change. See the validator arrays in [`src/services/validators`](src/services/validators) (`game-start.validator.js`, `game-finish.validator.js`, `add-game-player.validator.js`, `rules-play-card.validator.js`, `has-valid-card.validator.js`, `rules-create-deck.validator.js`).
  - **Error handling.** [`src/helpers/not-found.helper.js`](src/helpers/not-found.helper.js) and [`src/helpers/conflict.helper.js`](src/helpers/conflict.helper.js) let the project introduce different kinds of errors (404, 409, ...) without ever needing to change [`src/middlewares/error.middleware.js`](src/middlewares/error.middleware.js), which just reads a `statusCode` off whatever error it receives.

- **L — Liskov Substitution.** With no classes/subclasses, the only realistic way to apply this principle is by making sure every CRUD implementation follows the exact same signature. The repositories in [`src/repositories`](src/repositories) all expose the same shape for their CRUD functions (`create`, `getById`, `update`, `remove`, ...), so any repository can be swapped for another (or for a test mock, exactly as [`test/unit/services`](test/unit/services) does) without the calling service needing to change.

- **I — Interface Segregation.** This principle was **not applicable** to this project, because it follows the functional programming paradigm and does not implement any class or interface to segregate in the first place.

- **D — Dependency Inversion.** Implemented through partial application: every service and controller is a **factory function** that receives its dependencies as arguments and returns a literal object containing that service/controller's functions (e.g. `createGameService(gameRepository, playerRepository, ...)`). Besides that, [`src/compositions.js`](src/compositions.js) is the single file where every service and controller is initialized with the concrete dependencies it should use, centralizing that wiring in one place instead of scattering `require`s of concrete implementations across the codebase.

### Error handling

Business errors never `throw` inside a service — they are returned as data (`err(...)` from [`src/helpers/result.helper.js`](src/helpers/result.helper.js), specialized as `notFoundHelper.throwError404` and `conflictHelper.throwError409`). Controllers check `.ok` and call `next(error)` when it's `false`, so every unexpected or business error converges on a **single** centralized handler:

- HTTP: [`src/middlewares/error.middleware.js`](src/middlewares/error.middleware.js) — logs through [`config/winston-logger.config.js`](config/winston-logger.config.js) and responds with `{ message, details }` and the `statusCode` attached to the error (400 validation, 401/403 auth, 404 not found, 409 conflict, 503 cards not initialized, 500 fallback).
- WebSocket: [`src/websocket/middlewares/error.socket-wrapper.js`](src/websocket/middlewares/error.socket-wrapper.js) — every socket callback in [`src/websocket/callbacks/game-engine.callbacks.js`](src/websocket/callbacks/game-engine.callbacks.js) is wrapped with this function so a thrown/returned error is logged and emitted back to the client as an `error` event instead of crashing the socket connection.

---

## 4. Repository structure

```
UNO-backend/
├── config/                   # Winston logger configuration
├── coverage/                 # jest --coverage HTML/LCOV report (generated)
├── swagger/                  # swagger-autogen config + generated swagger-output.json
├── src/
│   ├── app.js                # Express app: middleware + route mounting
│   ├── compositions.js       # Manual dependency injection: repos → services → controllers
│   ├── controllers/          # HTTP request/response translation (one file per resource)
│   ├── database/             # Sequelize connection to MySQL
│   ├── dto/                  # Pure functions that shape request/response payloads
│   ├── helpers/              # Result type (ok/err) + 404/409 error builders
│   ├── middlewares/          # auth, Joi validation, memoization, tracking, error handling
│   ├── models/               # Sequelize model definitions + associations.js
│   ├── repositories/         # Data access, one file per entity
│   ├── routes/               # Express routers, one file per resource
│   ├── schemas/              # Joi request-body schemas
│   ├── services/             # Business logic, one file per resource + validators/
│   └── websocket/            # Socket.IO server, handlers, callbacks, middlewares
├── test/
│   ├── unit/                 # Jest unit tests (services, controllers, middlewares, dto)
│   └── e2e/                  # Jest + fetch end-to-end tests against a real server/DB
├── UNO.postman_collection.json
├── uno-backend-tests.jmx     # Apache JMeter functional + load test plan
├── jest.config.js
├── jest.e2e.config.js
├── server.js                 # Entry point: DB connection, sync, Socket.IO, HTTP server
└── package.json
```

---

## 5. Getting started

### Requirements

- Node.js **v24** or higher.
- A running MySQL database.

### Installation

```bash
npm install
```

Copy [`.env.example`](.env.example) to `.env` and fill in the values:

```
PORT=3000
JWT_SECRET=your-secret

DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_NAME=db
DATABASE_USER=user
DATABASE_PASSWORD=user

ERROR_LOG_ROUTE=route/to/error.log

FRONT_END_URL=http://localhost:5173
```

### Running the project

```bash
npm run dev     # nodemon, hot reload
# or
npm start        # node server.js
```

The server listens on `http://localhost:<PORT>` (default `3000`), connects the database, syncs the Sequelize models, mounts Swagger UI at `/api-docs`, and starts the Socket.IO layer on the same HTTP server — all inside [`server.js`](server.js).

### Running the tests

```bash
npm test                # unit tests (jest --config jest.config.js)
npm run test:coverage    # unit tests with coverage report
npm run test:e2e         # end-to-end tests (jest --config jest.e2e.config.js)
```

For the end-to-end suite, create a `.env.test` file following [`end-to-end test documentation.md`](end-to-end%20test%20documentation.md) first.

---

## 6. API reference

Base URL: `http://localhost:<PORT>`. Endpoints marked 🔒 require `Authorization: Bearer <token>`.

> ⚠️ Two CRUD-style endpoints for `Cards` and `Scores` were intentionally **not implemented** — see [section 12](#12-decisions-and-known-limitations) for why.

### Auth — [`src/routes/auth.routes.js`](src/routes/auth.routes.js)

| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Register a new player |
| POST | `/auth/login` | Authenticate with email/password, returns a JWT |
| POST 🔒 | `/auth/logout` | Invalidate the current session |

```json
// POST /auth/login
// Request
{ 
  "email": "player@mail.com", 
  "password": "secret" 
}
// Response 200
{ 
  "access_token": "eyJhbGciOi...", 
  "playerId": "b3b1..." 
}
```

### Players — [`src/routes/player.routes.js`](src/routes/player.routes.js)

| Method | Route | Description |
|---|---|---|
| GET 🔒 | `/players/me` | Get the profile of the authenticated player |
| GET | `/players/:id` | Get a player by ID |
| PUT 🔒 | `/players` | Update the authenticated player's profile |
| DELETE 🔒 | `/players` | Delete the authenticated player's account |

```json
// GET /players/:id — Response 200
{ 
  "id": "b3b1...", 
  "name": "Luis", 
  "age": 22, 
  "email": "player@mail.com", 
  "createdAt": "2026-01-01T00:00:00.000Z" }
```

### Games — [`src/routes/game.routes.js`](src/routes/game.routes.js)

| Method | Route | Description |
|---|---|---|
| GET | `/games?page=&limit=` | List games in `WAITING` state, paginated |
| GET | `/games/:id/status` | Get the full live status (players, hands, top card, history) |
| GET | `/games/:id` | Get a game with its rules |
| POST 🔒 | `/games` | Create a game |
| PUT 🔒 | `/games/:id` | Update a game still in `WAITING` state |
| PUT 🔒 | `/games/:id/start` | Start a game (owner only, ≥ 2 players) |
| PUT 🔒 | `/games/:id/end` | Finish a game (owner only) |
| DELETE 🔒 | `/games/:id` | Delete a game |

```json
// POST /games — Request
{ 
  "title": "Friday night", 
  "maxPlayers": 4,
  "rules": 
    { 
      "allowDrawFour": true, 
      "allowAccumulateDraw": false, 
      "allowReverse": true 
    } 
}
// Response 201
{ 
  "id": "g-1", 
  "title": "Friday night", 
  "maxPlayers": 4, 
  "status": "WAITING", 
  "ownerId": "b3b1...", 
  "rules": { 
    "allowDrawFour": true, 
    "allowAccumulateDraw": false, 
    "allowReverse": true 
  }
}
```

### Game players — [`src/routes/game-player.routes.js`](src/routes/game-player.routes.js)

| Method | Route | Description |
|---|---|---|
| POST 🔒 | `/games/:gameId/players` | Join a game |
| DELETE 🔒 | `/games/:gameId/players` | Leave a game |
| GET | `/games/:gameId/players` | List the players in a game |
| GET | `/games/:gameId/players/current` | Get the player whose turn it is |

### Cards (catalog) — [`src/routes/card.routes.js`](src/routes/card.routes.js)

| Method | Route | Description |
|---|---|---|
| POST | `/cards/initialize` | Seed the 108 original UNO cards |
| GET | `/cards` | List all catalog cards |
| GET | `/cards/:id` | Get a specific catalog card |

### Game cards (deck/hand/discard) — [`src/routes/game-card.routes.js`](src/routes/game-card.routes.js)

| Method | Route | Description |
|---|---|---|
| POST 🔒 | `/games/:gameId/cards` | Build the deck for a specific game, applying its custom rules |
| GET | `/games/:gameId/cards` | List every card in the game (deck/hand/discard) |
| GET | `/games/:gameId/cards/top-card` | Get the top card of the discard pile |
| GET 🔒 | `/games/:gameId/cards/hand` | Get the authenticated player's hand |
| PUT 🔒 | `/games/:gameId/cards/:cardId` | Move a card to a zone/position/player |

### Game engine (gameplay actions) — [`src/routes/game-engine.routes.js`](src/routes/game-engine.routes.js)

| Method | Route | Description |
|---|---|---|
| POST 🔒 | `/games/:gameId/distribute` | Deal the initial hands from the deck |
| PUT 🔒 | `/games/:gameId/play` | Play a card from hand |
| PUT 🔒 | `/games/:gameId/draw` | Draw a card when there is no valid play |
| PATCH 🔒 | `/games/:gameId/say-uno` | Declare "UNO" with one card left |
| POST 🔒 | `/games/:gameId/challenge` | Challenge a player who didn't say "UNO" |

```json
// PUT /games/:gameId/play — Request
{ 
  "cardId": "c-42", 
  "newColor": "RED" 
}
// Response 200
{ 
  "action": "Card played", 
  "played": { 
    "id": "c-42", 
    "color": "MULTICOLOR", 
    "type": "WILD" 
  },
  "nextPlayer": { 
    "id": "gp-2", 
    "playerId": "b3b1...", 
    "name": "Ana"
  }
}
```

### Scores — [`src/routes/score.routes.js`](src/routes/score.routes.js)

| Method | Route | Description |
|---|---|---|
| GET | `/scores/:id` | Get a specific score by its `gamePlayer` ID |
| GET | `/scores/games/:gameId` | Get all scores for a game |
| PUT 🔒 | `/scores/:id` | Manually update a score |

### History — [`src/routes/history.routes.js`](src/routes/history.routes.js)

| Method | Route | Description |
|---|---|---|
| GET | `/games/:gameId/history` | Get the action log of a game |

### Stats — [`src/routes/request-stats.routes.js`](src/routes/request-stats.routes.js)

| Method | Route | Description |
|---|---|---|
| GET | `/stats/requests` | Total requests, broken down by endpoint and method |
| GET | `/stats/response-times` | Average/min/max response time per endpoint |
| GET | `/stats/status-codes` | Request count per HTTP status code |
| GET | `/stats/popular-endpoints` | Most frequently hit endpoint |

### WebSocket events — [`src/websocket/sockets/game-engine.socket.js`](src/websocket/sockets/game-engine.socket.js)

Connect with `auth: { token: "Bearer <jwt>" }`. Events (client → server): `create-game`, `enter-game`, `leave-game`, `start-game`, `distribute-cards`, `play-card`, `draw`, `say-uno`, `challenge`, `update-game`. Broadcast events (server → room): `player-joined`, `game-started`, `distributed-cards`, `card-played`, `cards-drawn`, `said-uno`, `player-challenged`, `player-left`, `game-finished`, `game-updated`, plus a per-socket `error` event on failure.

---

## 7. Compliance checklist by week (self-assessment)

This checklist follows the exact requirement list from the assignment sheet (Weeks 5–8). Marking an item `⬜` costs nothing extra — but marking `✅` on something that doesn't actually work is penalized double, per the honor code in [MATRIZ-EVALUACION.md](MATRIZ-EVALUACION.md).

### Week 5

| Requirement | Status | Where |
|---|---|---|
| Ensure SOLID principles are followed | ✅ | [Section 3 — "SOLID, letter by letter, without classes"](#3-architecture-and-solid-applied-with-fp) |
| Ensure clean code practices are followed | ✅ | Consistent one-file-per-resource-per-layer structure ([section 4](#4-repository-structure)), single-responsibility functions throughout (same evidence as SOLID's "S"), the `Result` type ([`src/helpers/result.helper.js`](src/helpers/result.helper.js)) replacing scattered `try/catch`, and dependencies centralized in one place ([`src/compositions.js`](src/compositions.js)) instead of duplicated `require`s |
| Error handling in the backend | ✅ | [Section 3 — "Error handling"](#error-handling); [`src/middlewares/error.middleware.js`](src/middlewares/error.middleware.js) |

### Week 6

| Requirement | Status | Where |
|---|---|---|
| Card distribution to players | ✅ | [`src/services/game-engine.service.js`](src/services/game-engine.service.js) → `distributeCards`/`distribute` |
| Players play cards following the rules | ✅ | [`src/services/game-engine.service.js`](src/services/game-engine.service.js) → `playCard`; rules in [`src/services/validators/rules-play-card.validator.js`](src/services/validators/rules-play-card.validator.js) |
| If a player can't play a card, they must draw one from the deck | ✅ | [`src/services/game-engine.service.js`](src/services/game-engine.service.js) → `drawCard`, enforced against [`src/services/validators/has-valid-card.validator.js`](src/services/validators/has-valid-card.validator.js) (drawing is rejected with `409` while a valid card still exists in hand) |
| Players must say "UNO" when they have one card left | ✅ | [`src/services/game-engine.service.js`](src/services/game-engine.service.js) → `sayUno` (rejects with `409` unless exactly one card remains) |
| Players can challenge others for not saying "UNO" | ✅ | [`src/services/game-engine.service.js`](src/services/game-engine.service.js) → `challengePlayer` (penalizes the challenged player by drawing 2 cards) |
| The player's turn ends after playing or drawing a card | ✅ | [`src/services/game-engine.service.js`](src/services/game-engine.service.js) → `endTurn`, called from both `playCard` and the turn-passing branches of `drawCard` |
| Game ends when a player runs out of cards | ✅ | [`src/services/game-engine.service.js`](src/services/game-engine.service.js) → `playCard` (checks `cuantityCardsInHand === 0`, sets the game to `FINISHED` and calls `calculateScores`) |
| Players can check the current state of the game | ✅ | `GET /games/:id/status` → [`src/services/game.service.js`](src/services/game.service.js) → `getGameStatus` |
| Players can see their own cards during the game | ✅ | `GET /games/:gameId/cards/hand` → [`src/services/game-card.service.js`](src/services/game-card.service.js) → `getPlayerHand` |
| Players can see the move history of the game | ✅ | `GET /games/:gameId/history` → [`src/services/history.service.js`](src/services/history.service.js); entries written by `historyRepository.create` inside `playCard`/`drawCard` |
| Players can see the current scores of all players | ✅ | `GET /scores/games/:gameId` → [`src/services/game-player.service.js`](src/services/game-player.service.js) |
| Multiplayer support | ✅ | [`src/services/game-player.service.js`](src/services/game-player.service.js) (join/leave, `maxPlayers`), turn order driven by the ordered player list in [`src/repositories/game-player.repository.js`](src/repositories/game-player.repository.js), real-time sync over [`src/websocket`](src/websocket) rooms |
| Error logging in the backend | ✅ | [`config/winston-logger.config.js`](config/winston-logger.config.js), written to `ERROR_LOG_ROUTE` from [`src/middlewares/error.middleware.js`](src/middlewares/error.middleware.js) |

### Week 7

| Requirement | Status | Where |
|---|---|---|
| Players' turns follow a clockwise direction | ✅ | `game.direction` field (`'RIGHT'`/`'LEFT'`), resolved by `getNextPlayer` inside `endTurn` in [`src/services/game-engine.service.js`](src/services/game-engine.service.js) |
| Skip cards (BLOCK) | ✅ | [`src/services/game-engine.service.js`](src/services/game-engine.service.js) → `endTurn` sets `skip = true` for a `BLOCK` card, making `getNextPlayer` advance by 2 positions instead of 1 |
| Reverse cards | ✅ | [`src/services/game-engine.service.js`](src/services/game-engine.service.js) → `endTurn` flips `game.direction` for a `REVERSE` card, gated by the `allowReverse` rule in [`src/services/validators/rules-play-card.validator.js`](src/services/validators/rules-play-card.validator.js) |
| Draw cards if a play isn't possible | ✅ | Same evidence as Week 6's "must draw" requirement — [`src/services/game-engine.service.js`](src/services/game-engine.service.js) → `drawCard` |

### Week 8

| Requirement | Status | Where |
|---|---|---|
| User interface | ✅ | Separate repository: [`UNO-frontend`](https://gitlab.com/jala-university1/cohort-5/ES.CSPR-244.GA.T2.26.M1/SC/laboratorios-p4/luis-eduardo-barajas-cabrera/capstone/frontend) — a Vite + vanilla JS client (`src/views`, `src/components`, `src/controllers`, `src/router`, `src/services`) that talks to this backend over both REST and `socket.io-client` |

---

## 8. Testing and coverage

### Unit tests

```bash
npm test
npm run test:coverage
```

Latest measured coverage:

| Metric | Coverage |
|---|---|
| Statements | 88.22% |
| Branches | 71.23% |
| Functions | 92.69% |
| Lines | 88.45% |

**Test Suites:** 36 passed, 36 total — **Tests:** 262 passed, 262 total.

By folder: `dto` (100% across the board), `middlewares` (98.76% statements), `services` (89.13%), `controllers` (85.1%), `websocket/handlers`, `websocket/middlewares` and `websocket/sockets` (100% each), `websocket/callbacks` (74.38%, the lowest — mostly untested branches around distribute/challenge edge cases inside the socket callback wrapper).

**Scope of the unit test suite — what was tested and why.** Unit tests were written for **services, controllers, middlewares and dto** only. The other components were deliberately left out of scope, for two reasons:
- `database`, `models`, `routes` and `schemas` only contain structural definitions for the different layers of the system — they hold no logic of their own to test.
- `repositories` only contain data-access logic built directly on top of the Sequelize ORM. Unit-testing them would require mocking the entire data-access behavior of Sequelize itself, which would end up testing the mock rather than any real logic — this is instead covered indirectly by the [end-to-end suite](test/e2e), which exercises repositories against a real database.

Within the tested components, external dependencies were mocked wherever they'd introduce non-determinism or an out-of-process cost: repositories (database access), the JWT library (time-based expiration), and `bcrypt` (deliberately slow hashing) are mocked in service/controller unit tests so each test stays fast, deterministic, and focused on the business rule being verified rather than on its infrastructure.

### End-to-end tests

```bash
npm run test:e2e
```

See [`end-to-end test documentation.md`](end-to-end%20test%20documentation.md) for the full breakdown of workflows covered, test cases, and problems found while building the suite.

---

## 9. Postman

Collection file: [`UNO.postman_collection.json`](UNO.postman_collection.json), at the repository root.

- Auth (`register`, `login`, `logout`) — covered.
- Players (`me`, `:id`, update, delete) — covered.
- Games (status, get, update, delete, create, start, end) — covered.
- Game players (join, leave, list, current) — covered.
- Cards catalog (initialize, list, get by id) — covered.
- Game cards (create deck, list, top card, hand, update) — covered.
- Game engine (distribute, play, draw, say-uno, challenge) — covered.
- Scores (get, get by game, update) — covered.
- History (get by game) — covered.
- Stats (requests, response-times, status-codes, popular-endpoints) — covered.

---

## 10. Apache JMeter

Test plan file: [`uno-backend-tests.jmx`](uno-backend-tests.jmx), at the repository root. Run it against the real dev server (`npm run dev`, port `3000`), **not** the destructive e2e test server (port `4001`).

What each Thread Group / Controller covers:

| Controller | Covers |
|---|---|
| `00 - Card catalog setup` | Seeds the 108-card catalog (`POST /cards/initialize`), tolerating a `409` if it's already seeded |
| `01 - Authentication` | Registers and logs in a unique owner and guest per run (`POST /auth/register`, `POST /auth/login`) |
| `02 - Game Creation & Joining` | Creates a game and has the guest join it (`POST /games`, `POST /games/:gameId/players`) |
| `03 - Start Game & Distribute Cards` | Starts the match, builds the deck and deals hands (`PUT /games/:id/start`, `POST /games/:gameId/cards`, `POST /games/:gameId/distribute`) |
| `04 - Gameplay (draw a card)` | Reads the top card and game status, then draws (`GET .../top-card`, `GET .../status`, `PUT .../draw`) |
| `05 - Game state and rule endpoints` | Reads the player's hand and current turn, attempts a real play, says "UNO", challenges, and reads the game history (`GET .../hand`, `GET .../players/current`, `PUT .../play`, `PATCH .../say-uno`, `POST .../challenge`, `GET .../history`) |
| `06 - Finish Game & Scores` | Ends the match and reads the final scores (`PUT /games/:id/end`, `GET /scores/games/:gameId`) |

The Thread Group runs **50 concurrent users**, each with a unique generated email (via a Groovy `JSR223 Sampler`), so this plan doubles as a light load test on top of its functional assertions.

One-click instructions: **Open JMeter → File → Open → select `uno-backend-tests.jmx` → click "Run All"**. Check the **Summary Report** and **Aggregate Graph** listeners for the results.

> [!NOTE]
> The other endpoints have been added to jmeter in others controllers in order to comply the the consign of adding all endpoints to postman and jmeter
> 

### 3 endpoints chosen for the video walkthrough

*(to be filled in)*

---

## 11. Video demo

- Link: `(paste the video link here)`
- Duration: `(confirm it is ≤ 5 minutes)`
- Checklist of what the video must show:
  - [ ] 3 FP concepts explained with code on screen.
  - [ ] Test coverage visible on screen.
  - [ ] The UI working end-to-end with a real practical example.
  - [ ] Running "Run All" in JMeter.

---

## 12. Decisions and known limitations

- **Simplified scoring.** The system only performs a basic score calculation meant to determine a second and third place once a game ends — the full scoring game mode specified in the original UNO rules (scoring by card values across multiple rounds) was not implemented.
- **Some CRUD endpoints were intentionally removed** to avoid inconsistencies between the game's expected behavior and the actions a client could otherwise perform on those resources:
  - Players: `POST /players` (players are only created through `POST /auth/register`).
  - Scores: `POST /scores`, `DELETE /scores/{id}` (scores are only produced by the game engine when a match ends).
  - Cards: `PUT /cards/{id}`, `DELETE /cards/{id}`, `POST /cards` (the catalog is only ever seeded once, through `POST /cards/initialize`).
- **Swagger comments live in the route files, not in a separate spec.** `swagger-autogen` had problems generating the spec correctly after the dependency-inversion refactor (services/controllers as injected factories rather than direct requires), so the `#swagger.*` JSDoc-style comments were added directly above each route definition in [`src/routes`](src/routes) instead.
- **`PUT /games/:gameId/draw` returns *every* card the player must draw in that single call**, instead of one card at a time. This was implemented this way because it simplifies managing how many cards a player must draw at once: the system checks whether the player has a valid card in hand (including the accumulate-draw rule, if enabled), how many cards should be drawn based on the last card played, and the game's own saved state — this avoids needing to validate anything else from the discard pile beyond that single check.
- **A dedicated `create-game` WebSocket event exists** alongside the REST `POST /games` endpoint. The system verifies whether a player belongs to a room/game before letting them act over WebSocket, to avoid the cost of re-running service-level operations (database queries, state validations) on every socket event. This created a problem for the game's owner specifically: since they create the game through the REST API, there was no way to join them into their own game's WebSocket room. The `create-game` socket event solves this by giving the owner an easy way to join their own room right after creating the game.
- **Winston was chosen for error logging.** It offers an easy way to generate and save different types of logs, with different configurations depending on the kind of log needed. Morgan and Bunyan were also considered: Morgan was discarded because it's a logger specifically for API calls, not a general-purpose logging solution appropriate for this use case; Bunyan was discarded because its main advantage (structured logs) is also a feature Winston already provides.
