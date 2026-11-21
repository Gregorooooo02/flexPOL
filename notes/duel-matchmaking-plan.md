# Duel matchmaking and realtime: next implementation slice

Status: implemented. FIFO matchmaking, queue/ticket HTTP endpoints, private native WebSocket notifications and frontend transport/proxy support now exist. No Duel screens or provider are mounted yet.

Verification: 83 backend tests pass, including seven new focused queue/realtime/event tests; frontend build/lint pass with existing warnings. A temporary real-client walkthrough passed 73 assertions using automatic pairing, direct/Vite-proxied upgrades, a third queued learner, reconnect, origin/replay/expiry rejection, stale cancellation, offline timeout and settlement. A separate transport smoke verified external WSS URL construction, revision filtering, fresh-ticket reconnect and cleanup. The implementation uses bounded native asynchronous socket sends and application `ping`/`PONG` liveness; `/ws` handler priority precedes the REST UUID route, and application request logging redacts upgrade tickets.

## 1. Deliverable and boundaries

Two distinct learners join a global FIFO queue, the backend creates one shared match through `DuelMatchService.createMatch`, and both receive a private match-found notification. Later phase/settlement changes also generate notifications. REST remains authoritative for every snapshot and portfolio command.

Include backend queue/presence, WebSocket connection tickets and notifications, plus frontend transport functions. Do not add lobby/briefing/workspace/results screens, a public arbitrary-opponent creation route, rating bands, invitations, Redis or a broker.

Retain the current single-instance/in-memory demo limits. A server restart clears queue entries and sockets; the existing H2 setup also clears matches and points. Neither a ticket nor an ownership check upgrades the spoofable mock email header into real authentication.

## 2. Queue contract

| Endpoint | Purpose |
|---|---|
| `GET /api/duels/queue` | Canonical current queue/matched status |
| `POST /api/duels/queue` | Idempotent join, or return an existing active match |
| `DELETE /api/duels/queue?entryId=<uuid>` | Leave this queue entry, without cancelling a newer one |
| `POST /api/duels/queue/heartbeat` | Renew `{ "entryId": "<uuid>" }`, never implicitly join |
| `POST /api/duels/realtime-ticket` | Issue a short-lived, single-use socket credential |
| WebSocket `/api/duels/ws?ticket=...` | Recipient-scoped server notifications only |

All REST routes use the existing `X-User-Email` boundary and `no-store` convention. Queue/ticket controllers remain thin; use a separate queue API/orchestration service rather than putting in-memory queue operations inside `DuelApiService`'s database transaction.

Queue response fields:

```text
state: IDLE | WAITING | MATCHING | MATCHED
entryId: UUID or null
joinedAt: UTC timestamp or null
leaseExpiresAt: UTC timestamp or null
matchId: UUID or null
heartbeatIntervalMs: 10000
serverNow: UTC timestamp
```

- `MATCHED` refers to an existing active match, not a second queued entry. Load it through the existing match endpoint to discover its current phase.
- Matchmaking reservations surface as `MATCHING`; a request may observe creation in progress.
- Repeated joins cannot duplicate membership, reset FIFO priority, or match the learner against another tab of their account.
- Stale heartbeat/leave IDs return 409 without renewing/deleting a newer entry. Repeating leave after the same entry is gone is safe.
- Missing/unknown identity is 401; malformed IDs/bodies are 400. Do not expose queue membership or tickets for a supplied learner ID.
- Keep `GET /api/duels/me` unchanged for now; queue recovery has its own endpoint. No invented wait estimates or opponent counts.

## 3. Presence and matchmaking

Recommended defaults: heartbeat every 10 seconds, a 30-second queue lease, and a bounded matchmaking scan every 250–500 ms. Expose resolved heartbeat timing in the response; use injected `Clock` for server leases and controllable service tests.

Implement `DuelQueueService` with an ordered membership structure keyed by learner ID and a short mutex. Each entry has a unique generation ID, original join order, lease and reservation state.

### Pair creation flow

1. Remove expired waiting entries and select the two oldest distinct eligible learners under the queue mutex.
2. Reserve both entries with an opaque reservation token; release the mutex.
3. Call the existing transactional match-creation service outside the mutex. Its ascending user locks and active-match check remain the final protection against double pairing.
4. After a successful commit, finalize both reservations and make the created match discoverable before sending match-found notifications.
5. On failure, release only the matching reservation generation. Requeue still-present, eligible learners in original FIFO order; do not append them at the back. Remove learners who already have another active match.

Do not hold the queue mutex while performing database work, generating a scenario, waiting on a future or sending socket messages. Use a single bounded matchmaking worker, separate from the existing evaluation executor; avoid an unbounded task queue or one sleeping thread per learner.

Bound match creation with a transaction timeout. If creation's outcome is uncertain, check persisted active participation before requeueing; never release a reservation while its original transaction could still commit. Distinguish invalid/deleted learners from infrastructure failures, preserve an eligible partner's priority, and back off repeated infrastructure failures rather than hot-looping on the same pair.

### Races to resolve explicitly

- Join checks existing membership/reservations as well as persisted active participation. Revalidate generation tokens after database work so a delayed eligibility lookup cannot resurrect an old/paired entry.
- Keep matched reservation outcomes discoverable during command completion; a stale join must not create a ghost entry after its pair commits. Canonical queue reads prefer a persisted active match over a stale in-memory waiting state.
- Leaving before reservation removes the entry. Leaving during creation records cancellation intent and returns `MATCHING`: if creation commits, return/discover the match; if it fails, do not requeue the learner who requested leave. Never create half a match or undo an already-created game.
- Heartbeats for reserved entries must not create replacement membership. Do not expire a match-creation reservation midway and let another worker pair the same learner again; rely on its completion/failure token.
- Closing one socket does not remove a learner who is still heartbeating from another tab. Queue expiry, not a socket-close callback, is the fallback removal mechanism.
- Once matched, disconnecting does not cancel the game or extend briefing/planning/replay. Existing saved-draft timeout behavior applies.
- Do not automatically requeue players after finish/cancellation/failure. Another game requires a new join command.

## 4. Native WebSocket transport

Add Boot's managed `spring-boot-starter-websocket` dependency, verifying availability with the existing parent version when implementing. No STOMP, SockJS, browser socket library or other dependency is needed. Update the backend technology table in `AGENTS.md` in that same dependency change.

### Connection tickets

Browsers cannot attach the existing custom identity header to a native WebSocket handshake. Issue a ticket through the authenticated REST endpoint instead:

- Cryptographically random, bound to the resolved learner ID, valid for about 30 seconds, consumed once during handshake.
- Store only bounded, expiring server-side ticket state. Cap outstanding tickets and active connections per learner; recommended starting limits are five of each.
- Do not put tickets in localStorage or logs. Query credentials must be redacted from access/debug logs; require HTTPS/WSS outside localhost.
- Validate handshake Origin against explicit development/production origins, not `*`. Never accept an email or recipient ID in the socket URL as identity.
- Reconnection obtains a new ticket; an old ticket cannot be reused. A socket is for private notifications, not a reusable credential for portfolio commands.

The server binds the connection to one learner and sends only that learner's events. No arbitrary match subscription command is required. Ignore/reject application commands on this notification-only socket; retain normal protocol ping/pong/liveness behavior.

Serialize sends per connection with a bounded buffer/send-time limit. Close a slow/broken peer rather than blocking matchmaking, a database transaction or other recipients. Remove failed/closed sessions and expired tickets promptly.

### Notification contract

```json
{
  "type": "MATCH_CHANGED",
  "matchId": "<uuid>",
  "revision": 12,
  "serverNow": "2026-11-21T12:00:00Z"
}
```

Event types:

- `QUEUE_CHANGED`: refresh queue status; entry ID may identify the relevant generation.
- `MATCH_FOUND`: refresh queue/profile and fetch the created match.
- `MATCH_CHANGED`: fetch the referenced match snapshot.
- `RATING_CHANGED`: refresh `/me` and, when relevant, the historical settlement.

These are invalidation hints, not a reliable event log or a second state model. Never include secret market configuration, seeds, chart payloads, emails or opponent drafts. Draft-save notifications, if sent, go only to their owner; the opponent needs submission/phase status, not editing activity. Do not stream per-frame replay ticks: clients will use persisted server deadlines and released curves.

## 5. Publish only committed state

Integrate notifications into the existing match/evaluation/settlement write paths using immutable application events and an `AFTER_COMMIT` listener. Capture recipient IDs and revision inside the transaction; do not carry JPA entities into the socket layer.

- Cover creation, participant submission, automatic timeout, evaluation success/failure, replay start and final settlement.
- Coalesce intermediate changes from one command where practical. A delayed tick may advance through replay and finish in one transaction; emit the final authoritative revision, not an instruction to replay an obsolete phase.
- A late command can throw `DuelConflictException` while its automatic phase change commits. Event publication must still occur for that committed change, even though normal method return is bypassed.
- Conversely, rolled-back writes and failed match creation must not emit successful state-change notifications.
- No socket send under user/match/queue locks. Send failures do not roll back valid game changes. The existing snapshot API repairs missed notifications.
- Coordinate queue finalization and creation notification so an event never points at an uncommitted/nonexistent match.

## 6. Frontend transport, not screens

- Extend `duelApi.ts` with queue status/join/leave/heartbeat and ticket functions, all using the existing axios client and abort signals.
- Mirror queue, ticket and notification DTOs in `model/duel.ts`.
- Add a small standalone native socket adapter, for example `duel/duelRealtime.ts`, with open/close, notification and connection-state callbacks, fresh-ticket reconnect, bounded exponential backoff/jitter and cleanup. It owns transport state only, not portfolios or application navigation.
- Resolve `ws:`/`wss:` from the same API base URL/origin used by the client, including a configured external backend. Do not hard-code localhost or assume the page origin always hosts the API.
- Change the existing Vite `/api` proxy to `{ target: 'http://localhost:8080', ws: true }`; preserve HTTP forwarding. Document reverse-proxy Upgrade/idle-timeout requirements.
- On connection/reconnection, consumers must fetch canonical queue/profile/current-match state. Coalesce invalidations and ignore obsolete match revisions; tolerate duplicates and out-of-order notifications.
- Do not silently retry a stale portfolio write or reset a game timer because a socket reconnects.

The future Duel route provider will own the live connection, heartbeats, snapshot polling fallback and logout cleanup. This slice need not create that provider, add navigation or mount a permanent socket on unrelated app routes. The transport must close/abort/release retry timers when its consumer stops.

## 7. Implementation order and focused verification

1. Freeze queue/ticket/event DTOs and configuration defaults.
2. Implement queue membership, presence, reservations and transactional match creation; verify through service tests before adding sockets.
3. Implement tickets, scoped connections and bounded sends.
4. Add committed-state notifications and extend frontend transport/proxy configuration.
5. Complete manual two-client walkthrough and update `AGENTS.md`/the roadmap.

Keep new automated tests in the service layer, with a few targeted cases:

- FIFO pairing/idempotent join/self-match prevention and existing-active-match recovery.
- Clock-controlled expiry and stale heartbeat/leave protection.
- A focused join/leave/pair race plus creation failure restoring the correct FIFO order/cancellation intent.
- Ticket expiry, one-use consumption and recipient scoping; bounded connection cleanup.
- Commit versus rollback event delivery, including a late 409 that commits a phase transition.

Use controllable clocks, barriers and a fake notification sink rather than sleeps. Keep the existing suite green; no new frontend runner or controller/MockMvc suite by default.

Manually exercise actual HTTP/WebSocket connections with two learners and a third queued account: private match-found delivery, identical match ID/brief, reconnect after a missed event, socket outage with REST still usable, stale queue commands, disconnect through planning, expired-ticket rejection and unchanged exactly-once settlement. Verify the Vite upgrade path as well as direct backend connections. Temporary smoke fixtures may stay outside the repository; no public create-match shortcut.

## 8. Done when and handoff

- Two learners can join through HTTP and get one persisted match without fixture code.
- Both can discover it through either a private socket notification or canonical recovery reads.
- Queue cancellation/expiry/failure/races cannot duplicate or strand membership/participants.
- Match notifications follow committed state, respect privacy and cannot block game processing.
- Tests, frontend build/lint and manual HTTP/WebSocket checks pass; dependency/configuration/docs match the implementation.

Next after this slice: build the Duel lobby and briefing routes, then the autosaving workspace and replay/summary screens using the existing APIs.
