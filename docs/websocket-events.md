# UNO Backend — WebSocket Events Reference

Reference of every event handled by the Socket.IO server of the UNO backend. The server runs on the same port as the HTTP API. It was written from the source code (`src/websocket/**`), so the error codes and quirks listed here describe what the code actually does.

- **HTTP endpoints:** see [`http-endpoints.md`](http-endpoints.md).
- **No acknowledgements:** no event uses Socket.IO acknowledgement callbacks. The result of an action always arrives as a separate event that the client must listen to.

## Table of contents

1. [Error structure](#1-error-structure)
2. [Online status: how a player becomes visible as ONLINE](#2-online-status-how-a-player-becomes-visible-as-online)
3. [Connection](#3-connection)
4. [Events](#4-events)
5. [Rooms and emission types](#5-rooms-and-emission-types)
6. [Events the client can listen to](#6-events-the-client-can-listen-to)
7. [Typical match flow](#7-typical-match-flow)

---

## 1. Error structure

> [!NOTE]
> **Errors have a defined structure.** When an event fails, the server sends an `error` event **only to the socket that emitted it** (never to the room). The payload always follows this shape:
>
> ```json
> {
>   "message": "Validation failed",
>   "statusCode": 400,
>   "details": ["\"cardsPerPlayer\" must be greater than or equal to 3"]
> }
> ```
>
> | Field | Type | Description |
> |---|---|---|
> | `message` | string | Human readable reason of the error. |
> | `statusCode` | number | HTTP-like status code (`400`, `403`, `404`, `409`, `410`, `500`, ...). |
> | `details` | string[] | List of validation messages. Only filled for `400` validation errors; otherwise `[]`. |
>
> Listen to it with `socket.on('error', (error) => { ... })`.

Things to keep in mind:

- The `403` error `not joined to this game` is built by hand and **has no `details` field**: `{"message":"not joined to this game","statusCode":403}`.
- Events that need a payload must be emitted with an object. Emitting `send-invitation`, `accept-invitation` or `reject-invitation` without payload answers `400`; any other event emitted without payload fails with `500` (for example `Cannot destructure property 'gameId' of 'undefined'`).
- Failures while the socket is connecting are **not** sent as `error`; they arrive as `connect_error` (see [section 3](#3-connection)).
- Status codes: `400` validation, `403` not in the game room, `404` resource not found, `409` the action conflicts with the current state, `410` expired invitation, `503` card catalog not initialized, `500` unexpected error.

---

## 2. Online status: how a player becomes visible as ONLINE

> [!IMPORTANT]
> **Connecting is not enough. A player is `ONLINE` only after emitting `join-player`.**
>
> 1. Log in over HTTP (`POST /auth/login`) and keep the `access_token`.
> 2. Open the socket with `auth: { token }`.
> 3. **Emit `join-player` on every `connect`** (also after a reconnection, because a reconnection creates a new socket).
>
> Until step 3 happens the player stays `OFFLINE`: they are not counted in `GET /players/total`, their `status` is `OFFLINE` in the player endpoints, and they **cannot receive invitations** (`send-invitation` answers `404 player is not online`).

```js
const socket = io('http://localhost:3000', { auth: { token: accessToken }, transports: ['websocket'] });
socket.on('connect', () => socket.emit('join-player'));   // this line makes the player ONLINE
```

### What `join-player` does

1. Registers the socket in an in-memory registry of online players (`playerId` → set of socket ids).
2. If it is the first registered socket of that player, it sets `status = 'ONLINE'` in the database.
3. Broadcasts `updated-current-players` (`{ "currentPlayers": <number> }`) to **every connected socket**.

### When does the status change?

| Action | In-memory registry | Database `status` | `updated-current-players` |
|---|---|---|---|
| HTTP login | not touched | unchanged (`OFFLINE`) | no |
| Socket connects (handshake accepted) | not touched | unchanged | no |
| `join-player` with the first registered socket of the player | socket added | `ONLINE` | **yes** (global) |
| `join-player` from another tab of a player that is already online | socket added | unchanged | no |
| `join-player` again from the **only** registered socket | already there | `ONLINE` written again | yes (repeated) |
| A registered socket closes but others of the same player remain | socket removed | unchanged | no |
| The **last** registered socket closes (`disconnect`) | player removed | `OFFLINE` | **yes** (global) |
| HTTP `POST /auth/logout` | not touched | `OFFLINE` | no |
| Server stopped with `SIGINT` / `SIGTERM` | lost (the process ends) | every registered player set to `OFFLINE` | no |
| Server killed abruptly | lost | **unchanged** (can stay `ONLINE`) | no |

### Where the online status is used

| Place | How |
|---|---|
| `GET /players`, `GET /players/:id`, `GET /players/me` | Return the `status` column (`GET /players` lists `ONLINE` first). `GET /players/:id` is cached for 20 s and `GET /players` for 1 s. |
| `GET /players/total` | Returns the size of the in-memory registry (players with at least one registered socket). |
| `send-invitation` | The invited player must be in the registry, otherwise `404 player is not online`. |

### Edge cases

- **Only sockets that emitted `join-player` count.** If a player has tab A (joined) and tab B (connected but never joined), closing tab A marks the player `OFFLINE` even though tab B is still connected. Tab B has to emit `join-player` again.
- **`logout` does not disconnect.** `POST /auth/logout` sets `OFFLINE` in the database, but sockets that are already open stay open and stay in the registry (the token is only checked when the socket connects). Close the socket (`socket.disconnect()`) when the user logs out.
- **Stale status after a crash.** If the server dies without cleanup, the database can keep `ONLINE` for players while `GET /players/total` returns `0`, until those players connect and disconnect again.

---

## 3. Connection

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: accessToken },     // the "Bearer " prefix is optional
  transports: ['websocket'],
});

socket.on('connect', () => socket.emit('join-player'));
socket.on('error', (e) => console.error(e.statusCode, e.message, e.details));
socket.on('connect_error', (e) => console.error(e.message));
```

- The token is validated **once**, during the handshake. Logging out later does not close the socket.
- `transports: ['websocket']` avoids CORS checks. With HTTP long-polling the origin must match `FRONT_END_URL`.
- When the socket connects the server adds it to its own room (Socket.IO default) and to the **personal room** `player:<playerId>` (used for invitations). Clients must not emit to or join those rooms.

Handshake failures arrive as `connect_error` (only `message` and, in one case, `data` are visible to the client):

| `error.message` | Cause |
|---|---|
| `no token provided` | `auth.token` is missing. |
| `Token not entered` | `auth.token` is exactly `Bearer `. |
| `Invalid token: user session closed` (`error.data.statusCode` = `401`) | The token was issued before the last `POST /auth/logout`. |
| `jwt expired` | The token is older than 24 hours. |
| `jwt malformed` / `invalid signature` / other JWT errors | The token is not valid for this server. |

---

## 4. Events

Only events **listened to by the server** (sent by the client) are listed. `disconnect` and `disconnecting` are fired automatically by Socket.IO when the connection closes; clients do not emit them.

Emission types used in the **Events generated** column:

| Type | Who receives it |
|---|---|
| **Private** | Only the socket that emitted the event. |
| **Room** | Every socket in the game room (`<gameId>`), including the sender. |
| **Room (except sender)** | Every socket in the game room except the sender. |
| **Personal room** | Every socket (tab) of one specific player (`player:<playerId>`). |
| **Global** | Every connected socket. |

Columns: **Event**, **Purpose**, **Payload example**, **Events generated**, **Error status codes**, **Success response example**, **Notes**.

| Event | Purpose | Payload example | Events generated | Error status codes | Success response example | Notes |
|---|---|---|---|---|---|---|
| `join-player` | Registers the socket as an online session of the player. **Required to appear as `ONLINE`.** | No payload:<br>`socket.emit('join-player')` | `updated-current-players` – number of online players.<br>**Global.** Only sent when the online state really changed (see [section 2](#2-online-status-how-a-player-becomes-visible-as-online)). | `404` – the player does not exist (deleted).<br>`500` – unexpected error. | `updated-current-players`<br>`{"currentPlayers":3}` | ⚠️ Emit it on **every** `connect`. Connecting or logging in does not make the player online. Emitting it twice from the only registered socket broadcasts the event twice. |
| `disconnect` *(automatic)* | Removes the socket from the online registry when the connection closes (tab closed, `socket.disconnect()`, network lost). | Not emitted by the client. | `updated-current-players`<br>**Global.** Only when it was the **last** registered socket of the player (the player becomes `OFFLINE`). | None are delivered (the socket is already closed). | `updated-current-players`<br>`{"currentPlayers":2}` | A socket that never emitted `join-player` does not change the status. See the edge cases in [section 2](#2-online-status-how-a-player-becomes-visible-as-online). |
| `create-game` | Creates a game, registers the caller as owner and first player, and joins the socket to the game room. | `{"title":"Friday night","maxPlayers":4,"rules":{"allowDrawFour":true,"allowAccumulateDraw":false,"allowReverse":true}}`<br><br>`title`: 3–30 chars. `maxPlayers`: integer ≥ 2. The three `rules` booleans are required. | `created-game` – the new game.<br>**Private.** | `400` – validation failed (unknown properties are rejected).<br>`404` – the owner player was not found.<br>`500` – unexpected error (for example, `rules` omitted). | `created-game`<br>`{"id":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","title":"Friday night","maxPlayers":4,"status":"WAITING","ownerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","createdAt":"2026-09-30T14:10:00.000Z","rules":{"allowDrawFour":true,"allowAccumulateDraw":false,"allowReverse":true}}` | Use it (instead of `POST /games`) when the owner must receive room events. Save `id` from the response, because it is the `gameId` of every later event. |
| `enter-game` | Adds the caller to a game and joins the socket to the game room. | `{"gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37"}` | `player-joined` – the new game player.<br>**Room** (the joining player also receives it, so it works as confirmation). | `404` – player or game not found.<br>`409` – the player is already in the game (also when they joined with `POST /games/:gameId/players`), the game is not `WAITING`, or the game is full.<br>`500` – payload missing. | `player-joined`<br>`{"id":2,"gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","playerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8","score":0}` | The socket only joins the room when the call succeeds. The payload has no player name: read `GET /games/:gameId/players` to refresh the list. |
| `leave-game` | Removes the caller from a game and takes the socket out of the room. | `{"gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37"}` | `player-left` – who left.<br>**Room (except sender).**<br><br>`game-finished` – the game ended because it has no players left to continue.<br>**Room.** Only when a `PLAYING` game drops to one player or fewer. | `403` – the socket is not in the room (`not joined to this game`, no `details`).<br>`404` – game not found, or the player is not in the game.<br>`409` – the game is already finished. | `player-left` (`WAITING` game)<br>`{"id":2,"playerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8","name":"Luis"}`<br><br>`player-left` (`PLAYING` game)<br>`{"id":2,"playerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8","name":"Luis","gameFinished":true,"winner":{"id":1,"playerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","name":"Ana"}}`<br><br>`game-finished`<br>`{"winner":{"id":1,"playerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","name":"Ana"},"reason":"All other players left the game"}` | The emitter gets **no event** on success. If the **owner** leaves a `WAITING` game, the game is deleted: the others receive `player-left` with the owner's `playerId` and should go back to the lobby. In a `PLAYING` game, if the leaving player had the turn it passes to the next player. |
| `start-game` | Starts the game (`WAITING` → `PLAYING`) and creates its deck. | `{"gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37"}` | `game-started` – the match began.<br>**Room.** | `404` – game or player not found.<br>`409` – already playing, already finished, fewer than 2 players, the caller is not the owner, or the game already has a deck.<br>`503` – the card catalog is not initialized (`POST /cards/initialize`). | `game-started`<br>`null` | Owner only. Order: status changes to `PLAYING`, the socket joins the room, the deck is created, then the event is sent. **It is not atomic:** if the deck fails (`409`/`503`) the game stays `PLAYING` without a deck and nothing is broadcast; recover with `POST /cards/initialize` (if needed) and `POST /games/:gameId/cards`. Next step: `distribute-cards`. |
| `update-game` | Edits the title, maximum players and rules of a game. | `{"gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","gameData":{"title":"Saturday night","maxPlayers":6,"rules":{"allowDrawFour":false,"allowAccumulateDraw":true,"allowReverse":true}}}` | `game-updated` – the updated game.<br>**Room.** | `400` – `gameData` failed validation (checked before the room).<br>`403` – not in the room.<br>`404` – game not found. | `game-updated`<br>`{"id":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","title":"Saturday night","maxPlayers":6,"status":"WAITING","ownerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","winnerId":null,"createdAt":"2026-09-30T14:10:00.000Z","rules":{"allowDrawFour":false,"allowAccumulateDraw":true,"allowReverse":true}}` | The data must be nested inside `gameData`. There is no owner check and no status check: any player in the room can update the game at any moment. |
| `disconnecting` *(automatic)* | Fired just before the socket leaves its rooms. The server removes the player from **every game** the socket had joined (same logic as `leave-game`). | Not emitted by the client. | For every game room: `player-left` – **Room (except sender).**<br>`game-finished` – **Room**, only when the game ends because of the departure. | None are delivered (the socket is closing). Rooms where the removal fails are silently skipped. | `player-left`<br>`{"id":2,"playerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8","name":"Luis"}`<br><br>`game-finished`<br>`{"winner":{"id":1,"playerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","name":"Ana"},"reason":"All other players left the game"}` | ⚠️ Closing a tab, reloading the page or losing the network **removes the player from their games**, even if the player has another tab open. The socket's own room and the `player:<id>` room are ignored. |
| `distribute-cards` | Deals the hands and places the first card on the discard pile. | `{"gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","cardsPerPlayer":7}`<br><br>`cardsPerPlayer`: integer 3–10. | `distributed-cards` – the hand of every player.<br>**Room.** | `400` – `cardsPerPlayer` missing or out of range (checked before the room).<br>`403` – not in the room.<br>`404` – game not found.<br>`409` – the game is not `PLAYING`, the cards were already distributed, or the deck was not created. | `distributed-cards`<br>`[{"playerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","cards":[{"id":12,"color":"BLUE","value":"2","type":"NUMBER"}]},{"playerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8","cards":[{"id":58,"color":"RED","value":"9","type":"NUMBER"}]}]` | ⚠️ **Every player in the room receives all the hands.** Clients must only show their own (match `playerId`). It can be done once per game, after `game-started`, and any player in the room can trigger it. The first discarded card is always a `NUMBER` card (read it with `GET /games/:gameId/cards/top-card`). |
| `play-card` | Plays a card from the caller's hand. | `{"gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","cardId":105,"newColor":"RED"}`<br><br>`cardId`: positive integer. `newColor` (optional): `RED`, `GREEN`, `BLUE`, `YELLOW` or `null`; only used with `MULTICOLOR` cards. | `card-played` – result of the move.<br>**Room.** | `400` – invalid `cardId` / `newColor`.<br>`403` – not in the room.<br>`404` – no current player, game not found, or card not found.<br>`409` – not the caller's turn, the game is not `PLAYING`, the card is not in the caller's hand, it does not match the top card, `+4` or `REVERSE` are disabled by the rules, or the player must draw first. | `card-played` (normal)<br>`{"action":"Card played","played":{"id":105,"color":"MULTICOLOR","value":null,"type":"WILD"},"nextPlayer":{"id":2,"playerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8","name":"Luis"}}`<br><br>`card-played` (last card)<br>`{"action":"Player won the game","played":{"id":37,"color":"RED","value":"5","type":"NUMBER"},"winner":{"id":1,"playerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","name":"Ana"},"scores":[{"id":1,"name":"Ana","score":0},{"id":2,"name":"Luis","score":35}]}` | **No `game-finished` event is sent when someone wins**: detect it with `action === "Player won the game"`. The player who played should remove `played.id` from their local hand. After a `+2`/`+4` the next player must `draw`. A `MULTICOLOR` card without `newColor` keeps the current color. |
| `draw` | Draws the cards the caller must take (when there is no playable card). | `{"gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37"}` | `cards-drawn` (two emissions):<br>1. The drawn cards – **Private** to the player who drew.<br>2. A summary without cards – **Room (except sender)**. | `403` – not in the room.<br>`404` – no current player.<br>`409` – the game is not `PLAYING`, it is not the caller's turn, or the caller still has a playable card. | Private:<br>`{"action":"card drawn and pass turn","drawnCards":[{"id":52,"color":"GREEN","value":"9","type":"NUMBER"}],"nextPlayer":{"id":2,"playerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8","name":"Luis"}}`<br><br>Room (except sender):<br>`{"action":"card drawn and pass turn","nextPlayer":{"id":2,"playerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8","name":"Luis"}}` | `action` can be `card drawn and pass turn` or `card drawn`. With `card drawn` the single drawn card is playable, so the same player keeps the turn (`nextPlayer` is the drawer). With a pending `+2`/`+4` all the penalty cards come in one event. |
| `say-uno` | Declares UNO when the caller has one card left. | `{"gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37"}` | `said-uno` – who said it.<br>**Room.** | `403` – not in the room.<br>`404` – game not found, or the player is not in the game.<br>`409` – the game is not `PLAYING`, the player already said UNO, or still has more than one card. | `said-uno`<br>`{"action":"Said uno","player":{"id":1,"playerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","name":"Ana"}}` | It does not have to be the caller's turn. The flag is reset when the player draws cards. |
| `challenge` | Challenges a player who has one card and did not say UNO. | `{"gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","challengedPlayerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8"}` | `player-challenged` – the challenge happened.<br>**Room.** | `400` – `challengedPlayerId` missing.<br>`403` – not in the room.<br>`404` – game, challenged player or challenging player not found.<br>`409` – the caller challenges themselves, the game is not `PLAYING`, the challenged player already said UNO, or has more than one card. | `player-challenged`<br>`{"action":"player Luis challenged","challenger":{"id":1,"playerId":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","name":"Ana"},"challengedPlayer":{"id":2,"playerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8","name":"Luis"}}` | The challenged player draws 2 cards, but the event does **not** include them. The challenged client must refresh its hand with `GET /games/:gameId/cards/hand`. |
| `send-invitation` | Invites an online player to a game. | `{"playerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8","gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37"}` | `invitation-sent` – the invitation.<br>**Personal room** of the invited player (all their tabs). | `400` – validation failed, or the caller invites themselves.<br>`403` – the caller is not a player of the game.<br>`404` – the invited player is not online, or the game was not found.<br>`409` – the game is not `WAITING`, the invited player is already in it, the game is full, or that player already has a pending invitation to this game. | `invitation-sent`<br>`{"invitationId":"6f1c6ad3-7b5e-4c1a-9a55-0d7f1a2b3c4d","expiresAt":1790777160000,"sender":{"id":"0b9f0c3e-6a52-4a8d-9a39-3c2f8e1d7a41","name":"Ana"},"game":{"id":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","title":"Friday night"}}` | ⚠️ **The invited player must be ONLINE** (must have emitted `join-player`). The sender gets **no confirmation event**. An invitation lasts 60 seconds (`expiresAt` is a timestamp in milliseconds) and is kept in memory, so a server restart drops it. Only one pending invitation can exist per game and invited player; a new one can be sent after it was answered or expired. |
| `accept-invitation` | Accepts an invitation and joins the game. | `{"invitationId":"6f1c6ad3-7b5e-4c1a-9a55-0d7f1a2b3c4d"}` | `player-joined` – **Room** (the accepting socket joins the room first).<br><br>`invitation-accepted` – tells the inviter. **Personal room** of the sender.<br><br>`invitation-resolved` – lets every tab of the invited player close the invitation. **Personal room** of the invited player. | `400` – `invitationId` missing or not a valid id (the old `{ "gameId": ... }` payload is rejected).<br>`404` – invitation not found or addressed to another player; game or player not found.<br>`409` – already accepted / rejected / failed, being processed by another tab, the player is already in the game, the game is not `WAITING`, or it is full.<br>`410` – the invitation expired. | `player-joined`<br>`{"id":2,"gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","playerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8","score":0}`<br><br>`invitation-accepted`<br>`{"invitationId":"6f1c6ad3-7b5e-4c1a-9a55-0d7f1a2b3c4d","gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","playerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8"}`<br><br>`invitation-resolved`<br>`{"invitationId":"6f1c6ad3-7b5e-4c1a-9a55-0d7f1a2b3c4d","status":"ACCEPTED"}` | Only the invited player can answer, and only **once**: a second accept (same or other tab, even simultaneous) gets `409`. If the game can no longer take the player (`404`/`409` while joining), the invitation is closed as `FAILED` and `invitation-resolved` is sent with `"status":"FAILED"`. Temporary errors (`500`) leave the invitation pending so the player can retry. |
| `reject-invitation` | Rejects an invitation. | `{"invitationId":"6f1c6ad3-7b5e-4c1a-9a55-0d7f1a2b3c4d"}` | `invitation-rejected` – tells the inviter. **Personal room** of the sender.<br><br>`invitation-resolved` – closes the invitation in every tab of the invited player. **Personal room** of the invited player. | `400` – `invitationId` missing or not a valid id.<br>`404` – invitation not found or addressed to another player.<br>`409` – already accepted / rejected / failed, or being processed.<br>`410` – the invitation expired. | `invitation-rejected`<br>`{"invitationId":"6f1c6ad3-7b5e-4c1a-9a55-0d7f1a2b3c4d","gameId":"c4e1a7b2-93d0-4c58-a1f6-5e8b2d9f0a37","playerId":"7d2a5e90-14cb-4f3e-8b6a-92a4c1e5d3f8"}`<br><br>`invitation-resolved`<br>`{"invitationId":"6f1c6ad3-7b5e-4c1a-9a55-0d7f1a2b3c4d","status":"REJECTED"}` | The payload no longer carries the inviter's `playerId`: the server knows who sent the invitation. A rejected invitation cannot be accepted afterwards (`409`). |

---

## 5. Rooms and emission types

| Room | Who joins | Used for |
|---|---|---|
| Socket id (Socket.IO default) | Every socket, automatically | Private messages to one socket. |
| `<gameId>` (game room) | The socket that runs `create-game`, `enter-game`, `accept-invitation` (and the owner's socket on `start-game`). It leaves with `leave-game` or when it disconnects. | All the game events (`player-joined`, `game-started`, `card-played`, ...). |
| `player:<playerId>` (personal room) | Every socket, automatically, when it connects. | Invitation events, so every tab of a player receives them. |

Room membership belongs to the **socket (tab)**, not to the player. A second tab of the same player cannot join the game room with `enter-game` (it answers `409`, because the player is already registered), so it will not receive room events.

---

## 6. Events the client can listen to

| Event | Emitted after | Emission type |
|---|---|---|
| `error` | Any failed event | Private |
| `updated-current-players` | `join-player`, `disconnect` | Global |
| `created-game` | `create-game` | Private |
| `player-joined` | `enter-game`, `accept-invitation` | Room |
| `player-left` | `leave-game`, `disconnecting` | Room (except sender) |
| `game-finished` | `leave-game`, `disconnecting` | Room |
| `game-started` | `start-game` | Room |
| `game-updated` | `update-game` | Room |
| `distributed-cards` | `distribute-cards` | Room |
| `card-played` | `play-card` | Room |
| `cards-drawn` | `draw` | Private (cards) + Room except sender (summary) |
| `said-uno` | `say-uno` | Room |
| `player-challenged` | `challenge` | Room |
| `invitation-sent` | `send-invitation` | Personal room (invited player) |
| `invitation-accepted` | `accept-invitation` | Personal room (inviter) |
| `invitation-rejected` | `reject-invitation` | Personal room (inviter) |
| `invitation-resolved` | `accept-invitation`, `reject-invitation` | Personal room (answering player) |

---

## 7. Typical match flow

1. Every player: log in over HTTP → connect the socket → **emit `join-player`** (now `ONLINE`).
2. Owner: `create-game` → receives `created-game` (keeps the `gameId`).
3. Other players: `enter-game` with that `gameId` (or the owner invites them with `send-invitation` and they `accept-invitation`). Everybody in the room receives `player-joined`.
4. Owner: `start-game` → everybody receives `game-started`.
5. Any player: `distribute-cards` → everybody receives `distributed-cards` (each client keeps only its own hand).
6. Turn by turn: `play-card` / `draw` (and `say-uno` / `challenge` when needed) → everybody receives `card-played` / `cards-drawn` / `said-uno` / `player-challenged`.
7. The match ends when a `card-played` event has `action: "Player won the game"`, or when the other players leave (`game-finished`).
