# Duel REST API: next implementation slice

Status: implemented. Six HTTP routes now wrap the existing lifecycle through `DuelApiService`; frontend request functions/types are exported without adding matchmaking or screens. Match creation remains internal.

Verification: 76 backend tests pass, including four focused API-service cases; frontend build/lint pass with the existing bundle/Fast Refresh warnings. A temporary real-HTTP walkthrough outside the repository passed 70 assertions across all six routes, 400/401/404/409 problem responses, cache headers, privacy and repeated settlement reads. The sections below retain the implemented contract and acceptance scope.

## 1. Goal and boundaries

Let a signed-in demo learner discover their Duel points/current match, restore a match snapshot, save/submit their portfolio, and retrieve released results/settlement.

Reuse the existing lifecycle, simulation and rating services without duplicating their rules in controllers. Keep `createMatch(firstUserId, secondUserId)` internal for future matchmaking. Do not add a public arbitrary-opponent or development-only match-creation endpoint to make the API easier to demo.

No new dependency is expected. The existing mock `X-User-Email` identity remains demo-only: resource ownership checks are necessary, but do not make a spoofable header real authentication.

## 2. HTTP contract

All six endpoints require the learner header. UUIDs are typed path variables; portfolio amounts remain EUR with whole-cent validation, and all timestamps are UTC ISO strings.

| Endpoint | Success response | Responsibility |
|---|---|---|
| `GET /api/duels/me` | 200 `DuelMeResponse` | Current points and own recovery references |
| `GET /api/duels/{matchId}` | 200 `DuelMatchResponse` | Recipient-specific snapshot; reconcile deadlines |
| `PUT /api/duels/{matchId}/draft` | 200 `DuelMatchResponse` | Accept a full replacement draft with `expectedRevision` |
| `POST /api/duels/{matchId}/submit` | 200 `DuelMatchResponse` | Atomically save/lock a full plan, or return an existing submission |
| `GET /api/duels/{matchId}/result` | 200 `DuelResultResponse` | Both portfolios/curves at `EVALUATED`, `REPLAY` or `FINISHED` |
| `GET /api/duels/{matchId}/settlement` | 200 `DuelSettlementResponse` | Historical ranking changes at `FINISHED` |

Set `Cache-Control: no-store` on recipient-specific responses. No entities, email addresses, secret seeds, frozen market configuration or job tokens are serialized.

Example draft/submit body:

```json
{
  "expectedRevision": 2,
  "allocations": [
    { "instrumentId": 1013, "amount": 2500.00 }
  ]
}
```

An empty draft is valid. An empty manual submission is not. A submit at/after the deadline must retain the automatically locked server draft, never accept the late body. Existing submission idempotence remains unchanged.

### `/me` recovery response

```json
{
  "rating": { "userId": 4, "points": 1000 },
  "activeMatchId": null,
  "latestTerminalMatchId": null,
  "serverNow": "2026-11-21T12:00:00Z"
}
```

- Initialize the rating lazily using the existing rating service, including for seeded learners.
- Active phases: `BRIEFING`, `PLANNING`, `EVALUATING`, `EVALUATED`, `REPLAY`.
- Latest terminal reference: `FINISHED`, `CANCELLED` or `FAILED`, ordered by completion/cancellation/failure time with a deterministic tie-breaker.
- Query by the resolved learner ID, not a supplied query parameter. Do not return another learner's references or a whole history feed.
- References are recovery hints, not an atomic snapshot of all game state. A phase can change immediately after the lookup; the client always loads the referenced match to discover its authoritative current phase.
- Do not take a profile/user-row lock and then reconcile a match under that same `/me` transaction. This endpoint needs only reference queries; actual reconciliation belongs to `GET /duels/{id}`. Preserve the existing lock-order discipline.
- Do not fabricate queue fields while the queue is unimplemented.

## 3. Backend structure and transaction boundaries

### New files

- `controller/DuelController.java`: mapping, headers, bodies and response headers only.
- `service/DuelApiService.java`: resolve the current learner, delegate authorized operations, and construct `/me`.
- `dto/DuelMeResponse.java`: mirror the response above.
- A scoped Duel input-error advice if needed for malformed UUID/JSON problem details.

### Existing files to extend

- `repository/DuelMatchRepository.java`: small recipient-filtered active/latest-terminal reference queries, bounded to one result each.
- Existing exception mapping only where necessary; preserve the current `DuelConflictException` response and other resources' behavior.

### Identity boundary

Every operation calls `UserService.requireCurrentUser(userEmail)` and uses that user's ID when invoking the existing services. Request bodies/URLs never select the acting learner. Controllers must not return a user entity or contain portfolio, timing or scoring logic.

### Critical transaction rule

The API service methods delegating to match operations must use a short write transaction with `noRollbackFor = DuelConflictException.class`, just like `DuelMatchService`.

Reads can advance deadlines and settle ranking. Marking those wrappers read-only is incorrect. Likewise, adding an outer transaction that rolls back a conflict would undo timeout/replay transitions that the inner service deliberately committed logically. Add a focused test through this new API service boundary, not just another test calling the inner service directly.

`/me` is also allowed to write for initial rating creation, but should not nest match reconciliation after profile locking. No transaction performs simulation, waits for replay, sends WebSocket data or calls external services.

## 4. Errors and recovery

| Status | Cases |
|---|---|
| 400 | Malformed UUID/JSON; missing/invalid revision or allocations; invalid amount/whitelist/budget; empty manual submission |
| 401 | Missing header or header naming no known learner |
| 404 | Unknown match or a match belonging to different learners |
| 409 | Stale draft revision, noneditable phase, results/settlement not released yet |

- Keep RFC 9457 bodies. A known Duel conflict may include the current caller-specific snapshot under the existing `match` extension.
- Validate authentication in the service before accessing match data. Normal Spring request binding may reject malformed syntax before the service is invoked; do not promise a different status precedence for malformed requests.
- If Spring's default UUID/JSON binding responses do not use problem details, add narrow advice for Duel input errors rather than changing the whole application's error format/configuration.
- Never echo a complete malformed request body or internal exception into an error response.
- A `FAILED`/`CANCELLED` match is still readable as a snapshot; result/settlement reads return 409, not invented output.
- A lost submit response is recovered by fetching the snapshot or repeating submit, which is already idempotent. Do not automatically retry stale saves with a newer revision or overwrite another tab's draft.

## 5. Frontend transport layer only

Add `frontend/src/api/duelApi.ts` and export it from the API barrel:

- `getDuelMe(signal?)`
- `getDuel(matchId, signal?)`
- `saveDuelDraft(matchId, request, signal?)`
- `submitDuelPortfolio(matchId, request, signal?)`
- `getDuelResult(matchId, signal?)`
- `getDuelSettlement(matchId, signal?)`

Use the shared axios client, its relative `/duels` routes, abort signals, learner-header interceptor and existing 401 re-login behavior. These requests read stored output or perform short commands; do not introduce a simulation-length request timeout or a second HTTP client.

Extend `frontend/src/model/duel.ts` with `DuelMe` and a typed conflict-problem extension if useful. Keep backend and frontend contracts in the same change. The existing error interceptor retains response properties at runtime; do not discard the optional conflict snapshot or automatically resubmit failed writes. UI recovery logic can reload the canonical snapshot when handling a 409.

No route, navigation item, provider/global store, polling loop, WebSocket client or UI is added yet.

## 6. Focused verification

Follow the repository policy: new JUnit tests target the API service only. No new controller/MockMvc, repository or frontend test suites/dependencies.

Add a few focused cases:

1. Missing/unknown identity returns unauthorized; valid identity gets one 1,000-point account with no match references initially, and cannot access another learner's match.
2. Recovery references include only the learner's active/latest-terminal match; after finish the profile exposes settled points and no active reference.
3. Portfolio operations use the header's resolved learner, preserve stale-revision conflicts, and return the existing typed snapshot/result/settlement contracts.
4. A late save through the **API service wrapper** returns a conflict while the timeout/finish transition remains persisted. Existing lifecycle tests keep covering the underlying calculations and concurrency.

Run `bash mvnw test`, `npm run build`, `npm run lint` and `git diff --check`.

Manually smoke-check the six HTTP routes with two learners and a locally service-created fixture match: status codes, problem content types, no-store headers, ownership, snapshot privacy, result availability and repeated settlement reads. Use a temporary local fixture/bootstrap rather than committing a production create-match shortcut.

## 7. Done when and handoff

- All six routes use the existing learner identity, return DTOs, and preserve service behavior/transaction guarantees.
- The frontend exports matching, abortable API calls and types.
- Existing tests and frontend checks pass; manual HTTP checks confirm the contract.
- `AGENTS.md` documents the routes, response/error conventions and demo-only authentication. No dependency or port changes are required.

Next after this slice: FIFO matchmaking and WebSocket notifications, then the lobby, briefing, workspace, replay and summary screens.
