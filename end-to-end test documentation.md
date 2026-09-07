# End-to-End tests
This file describes the implementation of e2e tests for the The backend implementation based on API for the game UNO.
These test were created using jest.
## Pre-requirements
- have a previous MySQL database for testing.
## Execution of the tests:
- First create a file with the name `.env.test` en type on it the needed variables following the structure of the `.env.example` file:
```
PORT=4001
JWT_SECRET=secret

DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_NAME=db
DATABASE_USER=user
DATABASE_PASSWORD=user

ERROR_LOG_ROUTE=route/to/error.log

FRONT_END_URL=http://localhost:5173
```
- Run the following command in the root directory of the project:
```
npm run test:e2e
```
## Test cases:

### 1. Main workflows identified

At least 8 distinct workflows are covered end-to-end, since building the deck/dealing hands and finishing the match turned out to be substantial enough to deserve their own test cases separate from "starting a game" and "playing a move":

| # | Workflow | Key endpoints involved |
|---|---|---|
| 1 | **User authentication** — register and log in | `POST /auth/register`, `POST /auth/login` |
| 2 | **Game creation** | `POST /games` |
| 3 | **Joining a game** | `POST /games/:gameId/players` |
| 4 | **Starting a game** | `PUT /games/:id/start` |
| 5 | **Building the deck and dealing hands** | `POST /games/:gameId/cards`, `POST /games/:gameId/distribute`, `GET /games/:gameId/cards/hand` |
| 6 | **Playing a card / drawing a card** (a game move) | `GET /games/:gameId/cards/top-card`, `GET /games/:gameId/status`, `GET /games/:gameId/players/current`, `PUT /games/:gameId/play`, `PUT /games/:gameId/draw` |
| 7 | **Finishing a game** | `PUT /games/:id/end`, `GET /scores/games/:gameId` |
| 8 | **Joining/leaving a game session before it starts** | `POST /games/:gameId/players`, `DELETE /games/:gameId/players` |

Supporting endpoint (used as test setup, not a workflow on its own): `POST /cards/initialize`, which seeds the 108-card catalog required before any deck can be built.

---

### 2. Test files and cases

#### `auth.e2e.test.js` — Workflow 1: User authentication

| Case | Scenario | Expected result |
|---|---|---|
| Register | New player, valid `name`/`age`/`email`/`password` | `201`, body has `id`, `email` matches, and **no** `password` field is returned |
| Login (success) | Same email, correct password | `200`, body has `access_token` (a string) |
| Login (failure) | Same email, wrong password | `401` |

#### `game-flow.e2e.test.js` — Workflows 2, 3, 4, 5, 6 and 7

This file runs one continuous scenario with two registered players (`owner` and `guest`), organized into a nested `describe` block per workflow so each one can be read (and graded) independently.

**Workflow of the game creation**

| Case | Scenario | Expected result |
|---|---|---|
| Create game | `POST /games` with a valid token and body | `201`, `status: WAITING`, `ownerId` matches the caller — and, as a side effect, `GET /games/:id/status` already lists the owner as a registered player |
| Create game, no token | `POST /games` without `Authorization` | `401` |
| Create game, invalid body | `title` shorter than the minimum allowed | `400`, body has a `details` array |

**Workflow of joining into a game**

| Case | Scenario | Expected result |
|---|---|---|
| Join | Second player calls `POST /games/:gameId/players` | `201`, and the status endpoint now lists 2 players |
| Join twice | Same player joins again | `409` |

**Workflow of starting the game**

| Case | Scenario | Expected result |
|---|---|---|
| Start, wrong caller | Guest (non-owner) calls `PUT /games/:id/start` | `409` |
| Start, success | Owner starts with 2+ players already in | `200`, and — side effect — the status endpoint now shows `PLAYING` |

**Workflow of building the deck and dealing hands**

| Case | Scenario | Expected result |
|---|---|---|
| Build deck | `POST /games/:gameId/cards` | `201` |
| Distribute | `POST /games/:gameId/distribute` with `cardsPerPlayer: 7` | `201`, both players get exactly 7 cards — verified both in the response **and** by re-fetching each player's private hand |
| Distribute twice | Same game, called again | `409` |

**Workflow of playing a move**

| Case | Scenario | Expected result |
|---|---|---|
| Play or draw | Whoever's turn it is either plays a legal card (found with `findPlayableCard`, a client-side replica of the server's matching rule, since the deck shuffle is random every run) or draws if no legal card exists | `200` either way; if a card was played, the discard pile's top card is verified to have changed to that exact card |
| Reject out-of-turn play | The player whose turn it is **not** (determined via `GET /games/:gameId/players/current`, not assumed) tries to play a card from their own hand | `409` |

**Workflow of finishing a game**

| Case | Scenario | Expected result |
|---|---|---|
| Finish, wrong caller | Guest tries to end the match | `409` |
| Finish, success | Owner ends the match | `200`, and — side effect — status shows `FINISHED` |
| Finish twice | Ending an already-finished game | `409` |

#### `game-session-management.e2e.test.js` — Workflow 8: Joining/leaving before a match starts

| Case | Scenario | Expected result |
|---|---|---|
| Non-owner leaves | Guest calls `DELETE /games/:gameId/players` while the game is still `WAITING` | `204`, and the game itself still exists with one fewer player |
| Leave twice | The same player tries to leave again | `404` (they are no longer registered in that game) |
| Owner leaves a WAITING game | Owner calls `DELETE /games/:gameId/players` | `204`, and — side effect — the whole game is soft-deleted: `GET /games/:id/status` now returns `404` |

---

### 3. Problems found and how they were resolved

**Some of the bugs in the system itself were actually caught earlier, during a round of manual testing (Postman/manual requests/developing the frontend) done before these e2e tests existed.** Those fixes are already baked into the current behavior of the API and are implicitly re-verified every time this suite runs.

Issues found before the automation of the workflows:
- **Sintaxis mistakes:** While the implementation of the frontend were detected some sintaxis mistakes, including the reassigment of const variables, calls to variables with errors in their names. **Fix**: Extensive testing and static analysis of the code to find these mistakes.

- **Problems in the state of a game only remain a player in a game that is playing:** it's possible to leave a game even the game is already playing. When the players in a game left the game until only remain a unique player, the system doesn't notify that the game can't continue, generating problems mainly in the websocket. **Fix:** After a player leave a game, validates if the game still have at least two players playing, it there are at least two players, the game continues, otherwise, the system will notify that is not possible to continue the game because there are not enough players, putting the last player as the winner.

Issues specifically found while automating the workflows above with Jest + `fetch`:

- **Stale data from the memoization middleware.** Some `GET` endpoints (`/games/:gameId/status`, `/games/:gameId/cards/top-card`) are wrapped with the app's response-caching middleware. Inside a single fast-running test, a `GET` right after a state-changing `PUT`/`POST` could return the **previous**, cached response instead of the fresh state, causing intermittent, hard-to-reproduce assertion failures. **Fix:** `cacheBustedPath` in `game.util.js` appends a unique `?e2e=<timestamp>_<random>` query string to every `GET` used for a side-effect check, so the cache never has a hit for that exact URL.

- **Non-deterministic deck shuffle.** `POST /games/:gameId/cards` assigns random positions to all 108 cards, so which cards end up in a hand (and whether a legal move even exists on the very first turn) changes on every run. **Fix:** `findPlayableCard` in `game.util.js` mirrors the server's own matching rule so the test can always find a legal card if one exists, and falls back to drawing when one doesn't, instead of hard-coding a `cardId` that might not be playable in a given run.
- **Email uniqueness across runs.** Running the suite twice against the same database caused `POST /auth/register` to fail with `409` (duplicate email). **Fix:** `registerAndLogin` generates the email from `Date.now()` plus a random suffix, so every run is independent.
- **Getting a data truncated column after of distributing the cards:** This was a silent bug where in specific edge cases, the column `currentColor` in the table `Games` got a value that was not contemplated in its enum. This value was the color `MULTICOLOR`, that is present in the special cards of the game, after distributing the cards, a last card is taken from the deck to be the first card in the discard stack and start the game, when this card was a WILD or a +4, the database sent the error. **Fix**: `distributeCards` now verify if the taken card is a number, if it's a number, this will be the first card of the discard stack, otherwise, the card will be sent at the back of the deck.


