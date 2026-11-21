# 1v1 Duel: implementation plan

Status: implementation in progress; scenario generation, the backend planning lifecycle and shared-market evaluation are complete. Defaults below remain recommendations except where encoded in the implemented content/configuration.

Implementation progress:

- `DuelScenarioService`: two validated authored templates, generated classpath content, eligible-category selection, immutable brief snapshots and public Java/TypeScript contracts.
- `DuelMatchService`: persisted shared scenario, participants and revisioned allocations; owned snapshots; atomic manual submission; UTC briefing/planning deadlines; timeout auto-lock and empty cancellation. User/match locks prevent overlapping active matches and late edits. `DuelCoordinator` is a bounded scheduled adapter; focused clock/concurrency service tests cover the lifecycle.
- `DuelMarketService` freezes the secret seed, engine definitions/versions, common UTC start date and valuation rule at creation. `SimulationService.simulateFrozen` evaluates detached inputs with full point-date alignment; it leaves the existing public simulation contracts unchanged.
- `DuelEvaluationService`, `DuelEvaluationJobService` and `DuelEvaluationWorker`: bounded background delivery, expiring token claims, shared paths, cent-exact valuation, immutable results, draw/winner calculation and fail-closed recovery. Result access is participant-only and does not expose seeds/model parameters. Focused service tests include catalogue edits, duplicate/expired claims, rounding and failures.
- Current handoff: `EVALUATING` → `EVALUATED` or `FAILED`. `EVALUATED` holds both portfolios and the computed outcome but remains active until future replay/settlement. Failed/cancelled matches release their participants. Creation, submission and result reads are internal service calls only; no HTTP entry points are exposed.
- No queue/realtime/replay/ranking/UI implementation yet. M2's ranking settlement remains incomplete. The remaining milestones below are the full-feature roadmap, not a claim that the whole Duel is playable.

## 1. Scope and player journey

Build one complete ranked, two-player mode:

1. Open **1v1 Duel**, see ranking points and join the queue.
2. The backend matches two distinct learners and creates one shared game.
3. Both see a dedicated briefing page: opponent, fictional background, starting budget, investment horizon, eligible instrument category and rules.
4. After a short server-timed briefing, both enter the investing workspace.
5. Build a portfolio against the same budget and instrument whitelist. Committed allocation changes are continuously saved to the backend.
6. Lock the portfolio manually, or have the backend lock its latest saved version at the planning deadline.
7. Once both portfolios are locked, evaluate both against the same hidden synthetic market. If either portfolio is empty, cancel instead.
8. Replay the two portfolio curves on a shared server-timed timeline, with no trading.
9. Open a dedicated summary showing both allocations, returns, statistics, winner and ranking-point changes.

**Winning rule:** higher final portfolio value wins. Because the budget is identical and there are no withdrawals or additions, this is equivalent to greater profit. A lower loss can win when both lose money. Equal final values to the cent are a draw.

This mode intentionally differs from the existing Sandbox's goal-alignment/stability score. Do not silently reuse that score or present Duel rank as investment competence. Explain that one simulated return contest rewards risk-taking and luck, not necessarily a suitable real-world decision. Other modes keep their existing rules.

### Recommended initial defaults

| Setting | Initial value |
|---|---|
| Queue | One global FIFO queue; no rating bands in v1 |
| Briefing | 8 seconds |
| Portfolio planning | 120 seconds |
| Replay | 10 seconds, like existing modes |
| Currency | EUR |
| Budget choices | €5,000 / €10,000 / €20,000, same for both players |
| Simulated horizon choices | 365 / 1,095 / 1,825 days, same for both players |
| Category | `STOCK` or `EQUITY_ETF`, chosen once per match |
| Starting ranking points | 1,000 per learner |
| Queue presence | Heartbeat every 10 seconds; expire after 30 seconds |
| Deployment | One backend instance; existing in-memory H2 |

Keep these server-side configuration values, with durations, category availability and point constants validated at startup. The frontend receives resolved timestamps and rules, not a second independently configured rule set.

## 2. Architecture and reuse

### Existing code to reuse

- `backend/.../service/SimulationService.java`: simulation engines and seed mixing, through an internal server-side evaluation path.
- `backend/.../service/ScenarioRunService.java`: reference for allocation validation and valuation, **not** its scenario score, withdrawals or seeded authored scenarios.
- `frontend/src/workspace/WorkspaceLayout.tsx` and its instrument list, allocation dialog, holdings, allocation bar, money formatting and history views.
- `frontend/src/workspace/portfolio/portfolioReducer.ts`: local planning at relative price 1; no mid-simulation trades in Duel.
- Existing axios client, mock learner header, route shell, semantic theme tokens and shadcn/Base UI components.
- Existing SVG chart conventions. Add a small shared, presentational two-series comparison chart if needed; no chart-library dependency is required.

### New responsibilities

- Backend owns queue membership, match state, scenario, allowed instruments, seeds, accepted drafts, submission locks, deadlines, evaluation, outcomes and ranking settlement.
- Frontend owns transient interaction state: filters, allocation dialog input, history cache and the optimistic local draft being saved.
- REST carries commands and authoritative snapshots. WebSocket carries small change notifications, not the source of truth.
- No frontend call to `/api/simulations` or `/api/simulations/batch` for a Duel. No simulation seeds or future match prices in planning responses.
- Keep `workspace/` mode-agnostic: it must not import `duel/`, `sandbox/` or `playground/`.
- Do not refactor all Playground/Sandbox state into a global store to deliver this feature. A narrowly scoped Duel route provider is justified because the connection and match snapshot must survive its briefing/workspace/results route changes.

## 3. Match state machine and time

```text
Queue entry (not a match state)
    |
    v
BRIEFING -> PLANNING -> EVALUATING -> REPLAY -> FINISHED
                 |          |
                 v          v
             CANCELLED    FAILED
```

- `BRIEFING`: scenario fixed; no portfolio changes yet. `planningStartsAt = briefingEndsAt`.
- `PLANNING`: accept draft saves and explicit lock-in while `now < planningEndsAt`.
- Each participant separately has `submittedAt` and `submissionSource = MANUAL | TIMEOUT`. One participant submitting does not lock the other.
- Once both submit, enter evaluation immediately; do not make them wait for unused planning time.
- At the deadline, lock each missing submission from that player's latest accepted draft, including an empty draft.
- If either locked portfolio has zero invested cents, enter `CANCELLED` with `EMPTY_PORTFOLIO`; no simulation or ranking change. An all-cash portfolio counts as empty even though cash retains the budget.
- Manual lock-in of an empty portfolio is rejected. At timeout it causes cancellation. Otherwise a player could immediately cancel by explicitly submitting nothing.
- `EVALUATING`: portfolios immutable; calculation happens outside a long database transaction.
- `REPLAY`: immutable curves available; server supplies `replayStartsAt` and `replayEndsAt`. Start a short configurable lead-in after evaluation so connected clients can fetch the paths.
- `FINISHED`: result and ranking settlement committed atomically. Both clients route to the summary based on the server state, not an independent ten-second timer.
- `FAILED`: invalid market/configuration or evaluation failure; no ranking changes. Do not silently change the seed or reroll a failing market.
- Terminal states cannot return to planning. A rematch creates a new queue entry and match.

### Deadline enforcement

- Use injected `Clock` and UTC `Instant` timestamps. Include `serverNow` in snapshot/command responses.
- Run a lightweight scheduled coordinator, approximately every 250–500 ms, to find due transitions. Do not create a sleeping thread per game.
- Every draft/submit command checks the deadline itself under the match lock. A scheduler delay must not grant extra planning time.
- A command that discovers an expired planning phase first performs the timeout transition, then returns the authoritative state/conflict.
- At exactly `planningEndsAt`, edits are too late. Define acceptance by server validation under lock, not the client's send time.
- Briefing and replay do not wait for client acknowledgements. Refreshing, hiding a tab or disconnecting cannot extend a phase.
- The client estimates clock offset from server responses, preferably using request midpoint, periodically resynchronizes and displays `max(0, deadline - estimatedServerNow)`.
- Replay progress uses the shared server start timestamp. Late/reconnecting clients catch up or go directly to results; no pause, seeking or trading.

## 4. Queue and matchmaking

Implement `DuelQueueService` as a single-instance, concurrency-safe FIFO queue with membership keyed by learner ID, not email or WebSocket connection.

1. Join resolves the current learner and checks they have neither a live queue entry nor a nonterminal match.
2. Repeated joins return the existing entry/match, rather than duplicating membership.
3. Under one short matchmaking mutex, remove expired entries, select the two oldest distinct eligible learners and reserve them.
4. Create the match, participants and generated scenario in one database transaction, protecting the users against concurrent joins.
5. Remove the reserved entries only after successful creation. On failure release reservations and preserve their original FIFO order.
6. Publish match-found notifications after commit to every active connection for the two learners.

Queue leave is idempotent. A leave racing with pairing returns either successful removal or the already-created match; it must never strand one player in half a match. Joining while in a match returns that match for resumption. A learner cannot match themselves across tabs.

Queue heartbeats renew membership independently of individual socket closures. Closing one of several tabs must not remove a learner who is still present. A disconnected queue entry expires after the lease; a disconnected **matched** player remains in the game and is subject to normal deadlines.

Queue entries are intentionally memory-only for this deployment. Matches/results/ranking use H2, but the current `create-drop` database also disappears on backend restart. State this plainly in the UI/docs: there is no cross-restart ranking durability yet. Real durable ranked play requires a persistent database and authentication, not merely a WebSocket.

## 5. Scenario generation and instrument constraint

Use a small server-side template catalogue rather than an LLM on the critical path. This makes generation fast, available without an API key, reproducible and mechanically valid.

Add `knowledge/duel-scenarios.json` as the source of truth for authored briefing templates and allowed parameter combinations. It is separate from the existing Sandbox scenarios: do not inherit their money needs, reference allocations, seeds or scoring. Load/validate the new file through a generated classpath resource; keep it outside existing SQL content blocks unless actual Duel template tables are needed later.

Extend the existing content-generation workflow to copy/validate that resource. If `knowledge/` changes, still run `node scripts/generate-content-sql.mjs` as required by repository policy. Never edit generated SQL by hand. No LLM dependency is needed.

Each resolved scenario contains:

- Template ID/version, fictional title, persona/background and neutral objective.
- EUR budget and calendar-day investment horizon.
- Category key/label and an explicit, snapshotted list of allowed instrument IDs and display metadata.
- Rules: same budget, same category, cash earns 0%, no leverage/shorting, no trading after submission, higher final value wins, ties/cancellation behavior.
- A persistent synthetic-market disclaimer and current engine limitations.

V1 category maps directly to existing `AssetClass`: `STOCK` or `EQUITY_ETF`. Both players get the **same whitelist**, not just independently chosen instruments with a similar label. Only enable categories with at least two valid, EUR-denominated, simulatable instruments and compatible timelines. `DEPOSIT` exists in the model but currently has no API-selectable seed fixture, so do not offer it.

Use curated combinations of template, category, budget and horizon so the background never contradicts the mechanics. Example: two fictional research teams each invest €10,000 in the same available equity ETFs over three simulated years. Do not write a retirement/liquidity mission and then judge it only by final return.

Persist the complete resolved brief; do not regenerate it when the player refreshes. Generate one hidden match seed independently of the visible template parameters. No predictable timestamp/scenario-ID seed. A separate content RNG and hidden market RNG prevent the visible scenario from revealing the market seed.

## 6. Draft saving and submission

**A timeout cannot reliably ask the browser to send its current portfolio.** Browsers can be closed, offline or throttled. Therefore timeout submission means the latest portfolio the server has acknowledged before the deadline.

### Draft contract

```json
{
  "expectedRevision": 4,
  "allocations": [
    { "instrumentId": 1013, "amount": 2500.00 },
    { "instrumentId": 1014, "amount": 5000.00 }
  ]
}
```

- Use existing monetary conventions: JSON amounts are EUR, backend `BigDecimal` with whole-cent validation, frontend integer cents. Cash is budget minus invested amount and is never client-authoritative.
- Validate a bounded list, unique eligible IDs, strictly positive amounts, at most two decimals, and sum no greater than budget. Empty drafts are valid.
- The backend increments its own revision only on accepted saves and returns the canonical portfolio, revision and save time.
- Save immediately after each committed Buy/Sell/Remove action. Do not send on every slider movement or include unconfirmed allocation-dialog input.
- Keep at most one draft save in flight per match in the browser. Coalesce later edits into the next full snapshot; never let out-of-order HTTP responses overwrite a newer local draft.
- A stale `expectedRevision` returns `409` with/referring to the latest authoritative snapshot. For multi-tab conflicts, pause editing, reload the accepted draft and explain the conflict; do not silently overwrite another tab's changes.
- Show **Saving**, **Saved** or **Unsaved — reconnecting**. During an outage a local draft may be retained, but clearly identify it as unaccepted and retry only if planning is still open. Do not claim offline edits will count at timeout.
- At the visible deadline, stop accepting local changes and fetch the authoritative state. An optional final flush is best-effort only; it cannot extend server time.

### Manual lock-in

- Confirmation shows invested amount, remaining cash and that the decision is final.
- Submit carries a complete allocation snapshot and `expectedRevision`; validation, save and locking happen atomically. It must not depend on a preceding autosave finishing successfully.
- The UI serializes submit behind its current in-flight save and freezes edits while the command resolves. If the deadline wins the race, the latest previously acknowledged draft applies.
- On network timeout after submitting, fetch state before offering retry. Already-submitted commands return the existing locked portfolio and never replace it.
- Once one player locks in, show only their own read-only holdings and the opponent's submitted/not-submitted status. No opponent holdings, cash allocation, expected performance or draft activity before both lock.

## 7. Shared-market evaluation and fairness

Implement a separate `DuelEvaluationService` without changing Sandbox scoring.

1. At match creation, resolve/freeze simulation definitions and one compatible market start date for the selected category. Store an internal versioned market specification, including engine/configuration parameters, so later catalogue edits cannot change a live game.
2. After both portfolios lock, derive one instrument seed per allowed ID using existing `SeedMixer.derive(matchSeed, instrumentId)`.
3. Simulate the union of held instrument IDs once, against a canonical base amount and the same frozen start date/horizon/configurations. Never give each player an independently random market.
4. Value both portfolios from those shared relative paths: `holdingValue = roundToCents(allocation * relativePrice)`; `portfolioValue = cash + sum(holdingValues)`. Use `HALF_EVEN` consistently and retain enough intermediate precision. Initial values must exactly equal the budget and displayed holdings must sum to displayed totals.
5. Calculate final value, profit, return percentage, maximum drawdown and per-instrument contribution for each player. Drawdown/statistics explain the result; they do not affect who wins.
6. Determine winner/draw using exact final cents, persist both full result curves and the outcome, then enter the synchronized replay phase.

The current `SimulationService.simulate` independently anchors each instrument to its latest observation date, and its batch method checks only start/end alignment. Introduce a narrowly scoped internal evaluation method/spec accepting frozen definitions and an explicit common start date. Reuse the current engine registry rather than copying GBM logic. Leave existing public single/batch contracts unchanged and require **every point date** to align for Duel.

Use a reasonably large canonical base (for example €1,000,000) to reduce relative-path cent-rounding artefacts. Version this valuation rule. Identical portfolios must produce identical curves and a draw; a shared instrument must have the same relative path for both players regardless of their allocation sizes.

The market seed, frozen internal parameters and paths never appear in planning DTOs/events. Existing generic simulation endpoints cannot replay a secret match without its seed; do not add any match-seed lookup. Opponent portfolio data is released only after both portfolios are immutable. Result DTOs must be purpose-built, not raw `SimulationResult` objects that include seeds.

The existing model uses independent instrument shocks, no correlations, no costs/taxes/inflation and cash at 0%. Disclose this. Correlated-market modeling is outside v1.

## 8. Ranking points and settlement

Use simple, transparent **Duel ranking points**, not Elo: the requested formula depends on the money gap, not expected outcomes from opponent ratings.

Recommended v1 formula:

```text
gap = abs(winnerFinalValue - loserFinalValue)
gapShare = gap / startingBudget
rawTransfer = 10 + roundHalfUp(30 * min(gapShare / 0.10, 1))
actualTransfer = min(rawTransfer, loserCurrentPoints)
winnerDelta = +actualTransfer
loserDelta = -actualTransfer
```

- Start at 1,000; never go below zero. A zero-point loser cannot transfer points, which the UI must explain.
- Non-draw transfers range from 10–40 before the zero-point floor. At a 5% budget gap, transfer 25 points; at 10% or higher, transfer 40.
- Normalizing by the shared budget prevents a €20,000 scenario automatically moving more points than the same relative outcome with €5,000.
- Draw, cancellation and system failure: 0 points for both.
- Persist formula version, gap, before/after points and applied deltas; show the same explanation in the summary.
- Settle once when the server finishes replay. Result reads, event reconnects and repeated scheduler runs cannot settle again.
- In one short transaction lock the match and both ranking accounts in a deterministic order, verify unsettled status, create unique ledger entries, update balances and mark `FINISHED`.

Use a separate `DuelRating` account per learner and `DuelRatingChange` ledger; keep login DTOs unchanged by exposing rating through Duel endpoints. Initialize accounts lazily or when a user is created; seeded demo users must also receive the same default.

**Known rule exploit:** cancelling empty portfolios without a penalty allows deliberate abandonment. Preserve the requested cancellation behavior in v1, disclose it and log cancellation counts. Do not quietly implement a forfeit or rank penalty. A queue cooldown, minimum investment threshold or forfeit rule would need separate agreement. Return-only scoring also rewards high variance; rating-based matchmaking can follow later.

## 9. Persistence, concurrency and processing

Suggested entities/tables:

| Entity | Important fields |
|---|---|
| `DuelMatch` | UUID, state/version, resolved scenario, hidden market spec/seed, phase timestamps, evaluation claim, cancellation/failure reason, result/rating rule versions |
| `DuelParticipant` | match/user unique pair, seat, accepted draft revision, draft/submission timestamps and source |
| `DuelAllocation` | participant/instrument unique pair, amount; editable only before participant submission |
| `DuelResult` | match unique, outcome/winner, immutable result payload with both curves and statistics |
| `DuelRating` | user unique, points, version |
| `DuelRatingChange` | match/user unique, points before/delta/after, formula version |

Use a versioned JSON LOB for the frozen brief/market specification and immutable result payload if that keeps the implementation smaller; these are snapshots, not frontend-controlled blobs. Do not introduce a table per chart point. Keep live participant/allocation/rating fields queryable and constrained.

- Use short write transactions with pessimistic match-row locking for drafts, submit and phase transitions; add `@Version` as a stale-state safeguard where useful.
- Enforce at most one active match per learner through the queue/user locking protocol, not an unchecked in-memory `contains` call.
- Keep lock ordering consistent across join, pairing and match settlement to avoid deadlocks.
- Transition to `EVALUATING` with a claim token and bounded processing deadline, commit, then calculate outside the transaction on a bounded executor.
- Persist results in a second short transaction only if state and claim still match. Duplicate workers/results cannot create duplicate replay or settlement.
- Coordinator recovers expired evaluation claims with a bounded deterministic retry using the same market spec/seed; after the limit enter `FAILED`. A late old worker cannot overwrite the replacement claim.
- Mark exceptions/system timeouts as failure without rating changes; log enough correlation IDs for diagnosis without logging identity tickets or whole portfolio payloads.
- Never do simulation or potentially blocked socket sends while holding queue/match/database locks.
- Broadcast only after commit; lost notifications are repaired through snapshots, not by rolling back valid commands.

This is not a distributed queue. Multiple backend replicas would require shared matchmaking/presence coordination and durable event delivery; defer Redis/broker infrastructure until there is an actual deployment need.

## 10. REST API and WebSocket contract

All REST endpoints use the existing `X-User-Email` demo identity and resource ownership checks. Unknown or other players' matches return 404, missing/unknown learner returns 401, malformed input returns 400, invalid phase/stale draft returns 409. Add conflict problem details without changing existing endpoints' behavior.

| Endpoint | Purpose |
|---|---|
| `GET /api/duels/me` | Rating plus current queue/active-match reference and latest completed-match reference for recovery |
| `POST /api/duels/queue` | Idempotent join; returns current queue state or paired match reference |
| `DELETE /api/duels/queue` | Idempotent leave, or match reference if pairing already committed |
| `POST /api/duels/queue/heartbeat` | Renew existing entry only; never implicitly rejoin after expiry |
| `POST /api/duels/realtime-ticket` | Issue short-lived, single-use socket connection credential |
| `GET /api/duels/{matchId}` | Recipient-specific authoritative snapshot with `serverNow` and revision |
| `PUT /api/duels/{matchId}/draft` | Save full portfolio with `expectedRevision`; returns accepted draft and state |
| `POST /api/duels/{matchId}/submit` | Atomically save and lock portfolio, or return existing submission |
| `GET /api/duels/{matchId}/result` | Both immutable portfolios/curves during replay; settled summary at finish; 409 before release |

Snapshot shape includes match ID, state, monotonically increasing state revision, public scenario, both public player IDs/display names, recipient's accepted draft/submission, opponent submission status and phase deadlines. Never serialize JPA entities or the opponent's email. Include terminal reason and point settlement when applicable.

### Why REST plus native WebSocket

The game needs server push for matching and phase changes, but portfolio commands benefit from normal HTTP validation, retries and the existing axios re-login behavior. No need for STOMP/SockJS or a frontend WebSocket library.

- Add Spring Boot's managed `spring-boot-starter-websocket` dependency, verifying its version is available with the existing Boot parent at implementation time.
- Endpoint: `/api/duels/ws?ticket=...`; native browser WebSocket cannot supply the existing custom identity header.
- Issue the ticket over authenticated REST, bind it to a learner ID, expire it after approximately 30 seconds and consume it once at handshake. It grants only a recipient-scoped notification stream, not match commands.
- The REST identity is still spoofable mock login; tickets do not turn it into production authentication. Before real ranked use replace it with verified server-side identity.
- Tickets must be random and unguessable, held in memory, never persisted to browser storage and redacted from access logs. Use HTTPS/WSS outside localhost, validate Origin and cap connections per learner.
- On every reconnect obtain a new ticket, reconnect with bounded exponential backoff/jitter and reload `/me` plus the current match. On logout close the socket and abort requests.
- Server handles heartbeat/liveness and emitter/session cleanup. Slow clients have bounded send queues and are disconnected rather than blocking game processing.
- Update the Vite `/api` proxy to object form with `ws: true`; production reverse proxy must support Upgrade and suitable idle timeouts.

Suggested notification envelope:

```json
{
  "type": "MATCH_CHANGED",
  "matchId": "<uuid>",
  "revision": 12,
  "serverNow": "2026-11-21T12:00:00Z"
}
```

Use a small set of notifications: `QUEUE_CHANGED`, `MATCH_FOUND`, `MATCH_CHANGED`, `RATING_CHANGED`. Fetch the corresponding snapshot, coalesce concurrent fetches and ignore stale revisions. Do not send large chart payloads on every socket notification. Socket delivery is at-most-best-effort, not a transaction log.

After connecting, fetch state to close the subscribe/read race; on reconnect/focus fetch again. Poll snapshots every few seconds while queued/in a live match as a fallback, and always reconcile at phase boundaries. All command responses also carry the current state/revision so UI correctness never depends on a notification arriving.

## 11. Frontend routes and screens

| Route | Screen |
|---|---|
| `/duels` | Queue lobby, points, join/cancel and resume active match |
| `/duels/:matchId/briefing` | Full scenario brief, opponent and server countdown |
| `/duels/:matchId/play` | Planning workspace, submission wait, evaluation state and synchronized replay |
| `/duels/:matchId/results` | Winner/draw/cancellation/failure summary and comparison |

Use a narrow `DuelSessionProvider` under the Duel route layout for notifications, queue/match snapshots, recovery and route coordination. Do not put unrelated Playground/Sandbox state there. Put only transient workspace/draft interaction in a per-match component keyed by match ID; reconstruct committed holdings from the server on refresh.

Route guards derive the correct page from server state: briefing -> briefing; planning/evaluation/replay -> play; terminal -> results. Direct links and browser Back must not reopen an obsolete editable phase. Opening results prematurely redirects to the current phase. A known completed match remains directly viewable by its participants.

### Lobby and briefing

- Add **1v1 Duel** to the responsive app navigation.
- Lobby: current points, explanation of win/ranking rules, queue elapsed time, searching/cancel states and resume-match action.
- No invented queue positions, opponent counts or estimated waits.
- Briefing: both names/points, scenario, budget, horizon, allowed category, eligible instruments, timer, and cancellation/synthetic-risk disclosures.
- Warn that leaving after pairing does not cancel the match; saved drafts and deadlines still apply. Merely navigating away is not a forfeit.

### Workspace

- Reuse `WorkspaceLayout`, catalogue/history states, instrument filters, `InstrumentPanel`, `PortfolioList` and `AllocationBar`.
- Only match-whitelisted instruments appear; no category/horizon chooser that can alter the server rules. Cash may remain uninvested, but at least one holding is required to avoid cancellation.
- Header: budget, cash, invested amount, deadline, opponent name and locked/not-locked status.
- Action bar: save status, **Lock portfolio** confirmation and then **Waiting for opponent**. Once submitted or timed out, allocation controls/dialogs become read-only immediately.
- Do not lock in unsaved allocation-dialog input; explain that only confirmed Buy/Sell/Remove changes form the portfolio.
- During evaluation: disabled actions with an explicit calculating/error state, not fake playback.
- During replay: read-only portfolio plus both revealed-to-current-time curves, common date/progress and no editing. Full paths are released only after portfolios lock.
- Preserve existing floating Hedgie/action-bar clearance. No new Duel coach context or AI advice in this slice; the general coach must not receive secret market/results before release or claim to know opponent allocations.

### Summary

- Winner/loser/draw, or explicit cancellation/failure reason; own and opponent display names.
- Starting/final value, profit in EUR, return %, remaining cash, maximum drawdown, invested share and instrument count for both.
- Overlay equity curves on one date/value scale with labelled distinct strokes; a difference curve is optional polish.
- Side-by-side allocations and instrument contributions, cash included. Show zero for an unheld instrument in the comparison, not missing rows.
- Final-value gap and return difference in **percentage points**, clearly distinguished from relative percentage changes.
- Points before/delta/after and formula explanation. In cancelled/failed matches show no invented performance charts or winner.
- Actions: **Find another match** and **Back to lobby**. No unilateral same-opponent rematch promise in v1.
- Mobile stacks player cards and keeps diagrams/tables readable; use semantic gain/loss tokens with signs/text, not color alone.

## 12. Suggested file map

```text
backend/src/main/java/com/flexpol/backend/
  controller/DuelController.java, DuelWebSocketHandler.java
  service/DuelQueueService.java, DuelMatchService.java
  service/DuelScenarioService.java, DuelEvaluationService.java
  service/DuelRatingService.java, DuelRealtimeService.java
  service/DuelCoordinator.java
  entity/Duel*.java
  repository/Duel*Repository.java
  dto/Duel*.java
  config/DuelWebSocketConfig.java, DuelProperties.java

frontend/src/
  api/duelApi.ts
  model/duel.ts
  duel/DuelLayout.tsx, DuelSessionProvider.tsx, duelSession.ts
  duel/DuelLobbyPage.tsx, DuelBriefingPage.tsx
  duel/DuelWorkspacePage.tsx, DuelResultsPage.tsx
  duel/DuelHeader.tsx, DuelActions.tsx, DuelReplay.tsx
  duel/duelRealtime.ts, draftSync.ts, serverClock.ts, routes.ts
  workspace/components/ComparisonChart.tsx

knowledge/duel-scenarios.json
backend/src/main/resources/duel-scenarios.json  # generated resource
```

Names are illustrative; keep controllers and socket adapters thin and business rules in services. Avoid creating a universal game framework or a separate abstraction for every state transition.

## 13. Implementation milestones and acceptance gates

### M0 — Freeze contracts and rules

- Confirm the defaults, category definition, empty-cancellation rule, tie behavior, rating formula/floor and demo-only durability/authentication.
- Define Java/TypeScript DTOs, phase transitions, draft revision conflicts, recipient privacy and error codes.
- Author a few neutral template combinations and validate catalogue compatibility.
- **Done when:** one example payload exists for every phase and both timeout/disconnection behavior and rating examples are unambiguous.

### M1 — Domain, scenario generation and evaluation

- Add entities/repositories, generated scenario resource and internal frozen-market evaluation path.
- Implement validation, deterministic shared paths, result aggregation and ranking formula, initially invocable in service tests without realtime UI.
- **Done when:** two identical plans draw, two different plans share instrument paths, and invalid categories/allocations never reach simulation.

### M2 — Match lifecycle, drafts and deadlines

- Add REST snapshots, revisioned draft saves, atomic submit, coordinator and bounded evaluation processing.
- Implement timeout auto-lock, empty cancellation, evaluation failure and exactly-once ranking settlement.
- **Done when:** the backend can complete a game without either browser executing a timeout callback; duplicate/racing calls do not double-submit or double-award points.

### M3 — Queue and realtime delivery

- Add idempotent FIFO matchmaking, presence expiry, connection tickets, WebSocket notifications and resynchronization.
- Add managed backend dependency, proxy upgrade configuration and documented deployment settings.
- **Done when:** two learners pair once, reconnect discovers an existing match, a third learner remains queued, and a lost event does not strand anyone.

### M4 — Lobby, briefing and planning workspace

- Add navigation/routes/provider, queue UI, server-timed briefing, whitelist-only workspace and robust draft-save status.
- Manual lock-in, read-only waiting state and conflict/offline/deadline recovery.
- **Done when:** two real browser profiles can join, build portfolios, refresh without losing accepted work and proceed through manual or timed submission.

### M5 — Replay, results and ranking

- Add synchronized shared-curve replay, server-state routing, comparison summary, rating deltas and cancellation/failure variants.
- **Done when:** both players observe the same outcome, refresh on the summary does not change points and hidden-tab playback catches up.

### M6 — Verification and documentation

- Complete focused service tests, existing regression suite, frontend build/lint and two-profile manual walkthrough.
- Update `AGENTS.md` in the same implementation change: dependency table, realtime configuration, endpoints, routes, identity limitations, scenario generation, timing/state rules, rating formula and single-instance/restart limits.
- Update old workspace-plan extension notes so Duel is no longer described as wholly deferred; leave historical milestones intact.
- **Done when:** the complete checklist below passes and no planning response/socket event exposes opponent portfolios or hidden market data.

Dependencies: M0 -> M1 -> M2 -> M3; frontend shell/layout can start once M0 contracts are fixed, but end-to-end planning requires M2/M3. Finish M5 before final M6 verification. Each milestone should remain runnable; avoid landing an exposed ranked UI before server rules are enforced.

## 14. Focused verification

Follow `AGENTS.md`: add only service-layer JUnit tests, with a few targeted cases per changed responsibility. No new frontend test runner, controller/MockMvc/repository suites or infrastructure by default.

Suggested high-value service cases:

- Queue: FIFO pairs distinct learners once, duplicate join/leave is safe, expired membership is excluded, and a join-vs-pair race cannot create two active matches.
- Scenario: chosen whitelist is valid for both learners, generated brief survives reload unchanged, and an unavailable category fails explicitly.
- Draft/submit: valid draft persists, stale revisions/invalid allocations are rejected, and manual submit is immutable/idempotent.
- Lifecycle: injected-clock deadline uses last accepted drafts, including a disconnected player; an empty timeout cancels without rating changes. Include the exact-deadline boundary.
- Evaluation: identical plans draw; shared holdings use identical prices with different invested amounts; totals and point dates align. Cover a misaligned/failed market without a fallback reroll.
- Rating: one formula example plus cap/floor/draw behavior; repeated/concurrent finalization creates one settlement only.
- Recovery/privacy: stale evaluation claims cannot finalize twice and participant-specific snapshots do not contain the opponent draft or secret specification before release.

Use controllable clocks, barriers/latches for the few race cases and deterministic seeds, not sleeps or real external clients. Keep existing service tests passing, including any affected simulation behavior.

Commands:

```text
backend/: bash mvnw test
frontend/: npm run build
frontend/: npm run lint
root, after content changes: node scripts/generate-content-sql.mjs
```

Manual walkthrough with two independent browser profiles/accounts (the existing localStorage login is shared by ordinary tabs):

1. Queue first learner, then second; both see the same match ID/scenario/category and correct briefing deadline.
2. Add a third learner; no self-match or double matching. Cancel/expire queue membership and confirm no ghost pairing.
3. Build different plans, verify exact cash/budget totals and server-side rejection of an instrument outside the whitelist.
4. Submit one early; confirm they cannot edit and cannot see opponent holdings. Submit the other and verify evaluation starts immediately.
5. Let both timers expire; confirm acknowledged plans are locked without relying on frontend submission code.
6. Leave one empty; confirm cancellation, no winner and unchanged points. Check both players offline still reaches a terminal state.
7. Refresh/close/reopen during briefing, planning, waiting, evaluation, replay and after finish; recover the correct phase and accepted draft/result.
8. Drop the socket while REST still works, then disconnect networking; show truthful saved/unsaved status and recover via snapshots. Delay/drop a submit response and avoid duplicate locking.
9. Edit from two tabs of the same learner; handle revision conflicts without silently overwriting accepted work.
10. Hide one tab through replay; both reach the same final values and result. Reload results repeatedly; points never change twice.
11. Exercise a draw, both-negative-returns winner, large winning gap, rating floor, failed evaluation and stale-result callback.
12. Check planning payloads/socket messages for seed/future/opponent leaks, other-user match access, expired ticket rejection and logout cleanup.
13. Check mobile/desktop with the coach sidebar open, long names, monetary values and sticky action bars; no controls/charts covered or overflowing.

## 15. Explicitly deferred

- Real authentication, persistent database deployment and cross-restart rankings. These are prerequisites for trustworthy public competition, not solved by this demo.
- Distributed matchmaking, Redis/message broker, multi-region support and production anti-cheat/abuse defenses.
- Rating bands, skill-based pairing, seasons, public leaderboard, spectators, invitations and negotiated rematches.
- Forfeit penalties, cancellation cooldowns and minimum invested percentage beyond a nonempty portfolio.
- AI-generated mechanics/scenarios, Duel coach integration and bespoke learning-score rules.
- Trading during simulation, correlated shocks, live market data, fees/taxes and deposit instrument fixtures.

## Decisions to confirm before implementation

1. Category means asset class (`STOCK` vs `EQUITY_ETF`) initially, not a sector/risk bucket.
2. Eight-second briefing, two-minute planning and ten-second replay are acceptable defaults.
3. Authored template generation is sufficient; no AI request is required to start a match.
4. Ranking starts at 1,000, uses the 10–40 budget-normalized gap formula and floors at zero.
5. Empty portfolios cancel without point loss, accepting the abandonment loophole for v1.
6. Timeout uses the last **server-acknowledged committed allocation**, not an unsaved dialog or offline local state.
7. Single-instance, restart-reset demo persistence is acceptable for the first implementation.
