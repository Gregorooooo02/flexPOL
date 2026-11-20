# Investment workspace page: implementation plan

The workspace is the shared "dashboard" page that will eventually serve three use cases: **Sandbox** (predefined scenario), **Playground** (free play with replay) and **1v1 Duel**. **For now we implement the shared page and the Playground use case only.** The page must be built so the other two can be added later by writing a new mode, not by changing the shared parts.

## Scope

| In scope now | Deferred (not built, but the page must not block it) |
|---|---|
| The shared workspace page and its components | Sandbox mode (scenarios, rules checklist, briefing, results) |
| The Playground mode: replay, trading during replay, header, action bar | Duel mode (countdown, lock in, opponent) |
| Backend batch simulation endpoint (`POST /api/simulations/batch`) | Server-side portfolio evaluation, scoring, server-owned scenarios and matches |
| Route `/playground` and a nav link | The AI coach (leave the layout slot only) |

Do not build code for deferred modes (no rules module, no confirm-submit dialog, no countdown, no evaluation endpoint, no placeholder routes). See "Extension points" for what keeps the page adaptable.

## Decisions (agreed)

| # | Decision |
|---|---|
| 1 | **Playground uses a replay.** The user builds a portfolio and presses play. A simulated future is replayed day by day, and the header shows the value as of the replay date. |
| 2 | **Instruments are simulated independently.** Each instrument gets its own seed, derived from a master seed. There is no correlation (see "Known limitations"). |
| 3 | **Playground allows trading during the replay** (buy, sell, rebalance). The other modes will be a single decision, later. |
| 4 | **Amount is the source of truth.** Positions are integer cents. Percentages are derived for display and are only an input convenience (slider and chips). |
| 5 | **The AI coach is out of scope.** Leave a slot in the layout, but build nothing. |
| 6 | **Testing follows the policy in `AGENTS.md`.** Backend: JUnit tests for the changed service only, with a few focused cases. No controller or MockMvc tests unless asked. Frontend: no tests and no test runner. Verification is `npm run build`, `npm run lint` and the manual checklist below. |
| 7 | **All state lives in the page itself, like the demo.** `PlaygroundPage` owns the portfolio, replay, simulated market, instrument data and filters with `useState` and `useReducer`. No context provider, no global store, no `localStorage`, no URL state. Leaving the page or refreshing resets everything. This will be refactored later. |
| 8 | **Playground defaults:** €10,000 starting budget, selectable horizons (1, 3, 5 or 10 years, default 5). |
| 9 | **A "Start over" button after the simulation finishes** resets the page to a fresh run. |
| 10 | **One batch endpoint simulates the whole catalogue.** `POST /api/simulations/batch` takes an array of the existing `SimulationRequest` and returns an array of the existing `SimulationResult`. No new DTOs. |

Further decisions made while planning:

- **One position-sizing model.** The user sets a *target position size* (for example "SAP: €2,500"). The app derives the trade from the difference between the target and the current value, and the confirm button says what it will do ("Buy €500", "Sell €200", "Remove"). "Sell all" is a target of 0. This also works unchanged for a future single-decision mode, where the allocation is simply the target.
- **The page builds a "market tape" from the batch results.** A tape is the simulated future of every instrument on a shared timeline: one `dates` array and one price series per instrument, normalised to a base of 10,000. The portfolio is valued as `units × tape price`, which supports trades at any replay date. The tape is a client-side structure, not a backend type.
- **No new dependencies.** Charts are hand-written SVG, like the existing sandbox charts. Data fetching uses the repo's `useEffect` plus `AbortController` pattern.

## Known limitations (state them in the UI and docs)

- **No correlation.** Independent instruments make diversification look stronger than reality. For example, two near-identical world ETFs would look like unrelated assets. Show a short "How this market works" note on the page.
- **All data is synthetic.** Keep a persistent "Simulated market, not real data" label. Do not present the app as investment advice.
- **No fees, taxes, slippage or inflation.** Trades fill instantly at the replay-day price. Cash earns nothing, because no deposit instrument is selectable yet.
- **The simulated future is visible to the client.** That is fine for Playground, where nothing is ranked. It is not acceptable for a scored mode (see "Extension points").
- **The same seed on several items gives identical shocks**, which means perfect correlation. The Playground never sends explicit seeds.

## Playground defaults (agreed)

| Setting | Value | Notes |
|---|---|---|
| Starting budget | **€10,000** | A fixed constant in the Playground config, no selector. Returns are proportional, so the number only affects readability. |
| Horizon | **Selectable: 1, 3, 5 or 10 years; default 5** | Choosable before the first play. 10 years is the batch limit of 3,650 days. A 5-year run is long enough for the drift and diversification to show. |
| Replay speeds | 1 week/s, 1 month/s, 1 quarter/s | At 1 month/s a 5-year run takes about a minute. |

## Architecture

### Frontend structure

```text
frontend/src/
  model/
    instrument.ts            # mirrors InstrumentResponse, HistoricalObservationResponse
    simulation.ts            # mirrors SimulationRequest, SimulationResult, SimulationPoint
  api/
    instrumentApi.ts         # getInstruments, getInstrumentHistory
    simulationApi.ts         # simulateBatch(requests, signal)
  workspace/                 # shared page parts: presentational, knows nothing about Playground
    WorkspaceLayout.tsx      # slots: header, actionBar, notice; instrument list and portfolio columns
    portfolio/
      money.ts               # cents helpers, formatMoney, parseAmountInput
      portfolioReducer.ts    # pure state transitions: state, actions, selectors
    components/              # AllocationBar, InstrumentList, InstrumentRow, InstrumentPanel,
                             # AmountField, PortfolioList, HoldingRow, MoneyValue, SignedChange,
                             # Sparkline, PriceChart, WorkspaceStates
  playground/                # the only mode implemented now
    PlaygroundPage.tsx       # OWNS ALL STATE; fetches data, runs the reducer and replay,
                             # passes data and callbacks down as props, fills the layout slots
    PlaygroundHeader.tsx
    PlaygroundActions.tsx
    marketTape.ts            # pure: SimulationResult[] -> MarketTape (dates, price series)
    equityCurve.ts           # pure: total value per day from the trade log
    config.ts                # budget, horizons, speeds
```

Boundary rule: files under `workspace/` must not import from `playground/`.

### State and props (decision 7)

- `PlaygroundPage` holds everything with `useState` / `useReducer`, in the same way as `LearningPathDemo` does: the instrument catalogue and its load state, the simulated market (tape) and its load state, the selected horizon, the portfolio reducer, the replay state, the filters, the open instrument panel, and a page-level `useRef` cache of fetched histories.
- Fetching follows the demo's pattern (`useEffect` with an `AbortController`), written directly in the page. Small helper functions are fine, but no state lives outside the page component. There are no module-level caches.
- Shared components under `workspace/` are presentational. They receive data and callbacks as props and own no data state beyond trivial local UI state (for example the text typed in the amount field).
- Per-row P/L is shown only when the page passes prices. Before the first play every price is 1, so units are cents and the same code path applies.
- `workspace/portfolio/` modules are pure functions, so they can be reused unchanged when the state is later moved into a context or store.
- Leaving the page unmounts it and discards the run, exactly like the demo.

### Routes

| Route | Content |
|---|---|
| `/playground` | Playground workspace |

Add "Playground" to the `AppLayout` navigation. The page's sticky headers use the existing `--app-header-height` offset, and the workspace is wider than the demo's `max-w-md`.

### Page anatomy

```text
┌ Playground header (information only) ─────────────────────┐
│ "Simulated market, not real data" chip                    │
│ Total value, P/L, cash, invested %, replay date, curve    │
│ Allocation bar: cash | stocks | ETFs (with text legend)   │
├──────────────────────────────┬────────────────────────────┤
│ Instruments                  │ Portfolio                  │
│ search, class + risk filters │ holdings: amount, %, P/L   │
│ row: name, class, risk,      │ cash left                  │
│ volatility, sparkline, [Add] │                            │
├──────────────────────────────┴────────────────────────────┤
│ Sticky action bar: horizon, play / pause / step / speed;  │
│ after the simulation finishes: "Start over"               │
└───────────────────────────────────────────────────────────┘
```

On mobile the two columns become tabs, **Instruments | Portfolio**. Selecting an instrument opens `InstrumentPanel` in the existing `Dialog` component. Bottom-sheet styling is a polish item.

### Playground header content

- **Primary:** total value, with signed € and % change since the start and ▲/▼.
- **Secondary:** cash, invested % of total value, biggest gainer and biggest loser (by P/L).
- **Replay:** current date, "day N of M", horizon and a mini equity curve.
- **Information and actions stay separate.** The header shows numbers. The action bar holds all buttons.

### Data contract: batch simulation (new endpoint, existing DTOs)

```http
POST /api/simulations/batch
Content-Type: application/json

[
  { "instrumentId": 1001, "initialInvestment": 10000, "durationDays": 1825 },
  { "instrumentId": 1013, "initialInvestment": 10000, "durationDays": 1825 }
]
```

The response is a JSON array of `SimulationResult` in the same order: `instrumentId`, `currency`, `initialInvestment`, `durationDays`, `startDate`, `endDate`, `randomSeed` (the actual seed used), `finalValue`, `totalReturn` and `points` (`date`, `investmentValue`). The existing `POST /api/simulations` is unchanged.

Rules:

- **Seeds.** An item that omits `randomSeed` gets an independent seed: the server generates one master seed per request and derives each item's seed from the master and the instrument ID (see below). An explicit `randomSeed` is used verbatim. Each result returns the seed actually used, so a single item can be replayed through `POST /api/simulations`.
- **Validation (400):** the array must contain 1–50 items; all items must have the same `durationDays`, and it must be 1–3,650; no duplicate `instrumentId`. Each item is also checked by the existing single-simulation rules. Unknown instruments return 404 through the existing handler.
- **Shared timeline.** All results must have the same start date. Today every instrument is anchored to the same date, so this holds. If it ever does not, the endpoint fails explicitly (`IllegalStateException`) rather than returning misaligned series.
- **Payload size.** Each point is a small JSON object (about 49 bytes). A 20-instrument, 5-year batch is about 26,000 points, roughly 1.3 MB. A 10-year batch is about 2.6 MB. That is fine locally. Enabling response compression (`server.compression.enabled=true`) would cut it a lot and is optional. If size becomes a problem, a compact response shape (one shared dates array) can replace this later without changing the page logic, because the tape builder isolates the format.
- **Base amount.** The Playground sends 10,000 as `initialInvestment` for every item, so a series is `value ÷ 10,000` relative to day 0. 10,000 rather than 100 because the engine rounds each point to cents; at 10,000 the rounding error is about 1e-6 relative.
- **Timeout.** The axios default is 10 s. The calculation is trivial (about 1,300 steps per instrument), so this should be enough. If a 10-year batch is slow, raise the timeout for this one call.
- Existing endpoints used as-is: `GET /api/instruments`, `GET /api/instruments/{id}/history`.

**Building the tape on the client** (`marketTape.ts`, a pure function): take the dates from the first result, check that every result has the same number of points and the same first and last dates (otherwise treat it as a load error), and build `series[instrumentId] = points.map(p => p.investmentValue)`. Dates are weekdays only, so the replay clock counts trading days.

**Loading sequence:** the page loads the catalogue first, then sends one batch request containing every catalogue instrument ID. The user can already browse and build a portfolio while the batch loads, because before the first play every price is 1. "Start" is disabled until the batch is ready. If the batch fails, the action bar shows an error with retry. Changing the horizon before the first play sends a new batch.

### Seed independence (decision 2)

The existing engine calls `new Random(seed)` and draws one Gaussian per weekday. If the same seed were used for several instruments, they would receive identical shocks, which is perfect correlation, not independence. So:

- A new `SeedMixer` derives `instrumentSeed = mix(masterSeed, instrumentId)` with a SplitMix64-style integer mixer.
- The derived seed is masked to 53 bits (`& ((1L << 53) − 1)`), so it stays exactly representable as a JavaScript JSON number, like the existing generated seeds.
- The returned seed per result lets the client (or a later server-side flow) replay any item.

### Backend changes

1. `SeedMixer` (in `simulation/`): derives and masks per-instrument seeds.
2. `SimulationService.simulateBatch(List<SimulationRequest>)`: validates the batch, generates the master seed if any item has no seed, derives the seeds, calls the existing `simulate` for each item, and checks that the start dates match. It reuses `simulate` unchanged, so no engine-registry extraction, no bulk definition loader and no new DTOs are needed. (Each item reads its definition separately, which is fine for at most 50 small read-only queries.)
3. `SimulationController`: `@PostMapping("/batch")` taking `List<SimulationRequest>` and returning `List<SimulationResult>`, with no logic in the controller.
4. **Tests: `SimulationService.simulateBatch` only, following the `AGENTS.md` testing policy (about four cases).** Use the seeded database through the existing Spring test setup. No controller or MockMvc tests, and no separate tests of `SeedMixer`:
   - **Independence and replay:** with omitted seeds, two instruments get different seeds, and replaying one item through `simulate` with its returned seed gives identical points.
   - **Shape and order:** results come back in request order, share the same start date and dates, and each starts at its `initialInvestment`.
   - **Explicit seed:** an explicit seed is used verbatim.
   - **Rejection:** one invalid-batch case (for example mismatched `durationDays`, or a duplicate instrument ID).
   - The existing tests must keep passing.

### Portfolio logic (frontend, pure functions)

All money is integer **cents**. State:

```ts
interface Holding { units: number; costCents: number }
   interface Trade { dayIndex: number; instrumentId: number; cashDeltaCents: number; unitsAfter: number }
interface PortfolioState { budgetCents: number; cashCents: number; holdings: Record<number, Holding>; trades: Trade[] }
```

The action `setPosition({ instrumentId, targetCents, price, dayIndex })`:

1. `currentValueCents = round(units × price)`; `delta = targetCents − currentValueCents`.
2. If `delta > 0`, buy: reject if it exceeds cash, then `units += delta / price`, `cost += delta`, `cash −= delta`.
3. If `delta < 0`, sell. For a target of 0, sell everything (units become exactly 0, with no dust). Otherwise `units −= |delta| / price` and `cash += |delta|`, and the cost basis shrinks proportionally.
4. Cash can never go negative, and a target above `currentValue + cash` is rejected.

Total value = `cash + Σ round(units × price)`, so displayed rows always sum to the displayed total. Before the first play every price is exactly 1 (every series starts at its base), so positions built on day 0 are integer cents.

**Amount input** (`AmountField`):
- A text field, a slider and chips (0 / 25% / 50% / Max).
- `parseAmountInput` accepts `.` or `,` and spaces, rounds to cents (HALF_EVEN), and rejects negatives.
- The slider is a percentage of the current total value. The displayed percentage is **derived** from cents, and the slider **never writes on render**. Only a user drag converts to cents, using `round(basis × pct / 100)`. This avoids feedback loops, and typing €333.33 shows 3.3% without changing the amount.
- The upper limit is `currentValue + cash`. If it is below 100%, show "Limited by available cash".
- The button text states the delta: "Buy €500", "Sell €200", "Update" or "Remove".

### Replay

- State: `{ status: 'idle' | 'playing' | 'paused' | 'finished', dayIndex, speed }`. A tick runs about every 100 ms and advances `speed × elapsed` days with fractional accumulation, so the clock does not drift. `dayIndex` indexes the tape's weekday dates. Plus step buttons (+1 week, +1 month).
- No seeking backwards (the portfolio would no longer match).
- Prices: `priceOf(id) = series[id][dayIndex] / 10_000`. The tape and replay state live in `PlaygroundPage`. Because all state is in the page, every tick re-renders it, so memoise the shared rows (`React.memo`) and keep the tick rate near 10 updates per second. If this proves too slow, optimising it is part of the later state refactor.
- Equity curve: `buildEquityCurve(tape, trades, upToIndex)` reconstructs total value per day from the trade log, so skipped days are filled correctly.
- **A pause control is mandatory**, because auto-advancing numbers are moving content.
- Trades are only possible at the current replay date, and are disabled while the replay has finished. Before the first play they are allowed at day 0 even if the batch is still loading.
- When the replay reaches the last day it moves to `finished`. Show a summary (final value, total return, best and worst holding) with a primary **"Start over"** button.
- **Start over** resets the whole page to a fresh run:
  - the portfolio returns to €10,000 cash with no holdings and an empty trade log;
  - the replay returns to `idle` at day 0;
  - a new batch is requested with no explicit seeds, so the market is different;
  - the last selected horizon is kept and can be changed again before the first play;
  - the catalogue, filters and cached histories are kept, and any open panel is closed.
- "Start over" is only offered after the simulation finishes. A mid-run reset is not planned, but would be a small addition.

### Visual and accessibility conventions

- **Numbers:** all money uses `MoneyValue` with `tabular-nums`. Raleway's default digits are old-style numerals, so check in the browser. If digits misalign, use `font-heading` (Figtree) for numbers.
- **Gain and loss colours:** add `--gain` and `--loss` tokens in `index.css` and `@theme inline`, distinct from the amber accent and the orange destructive colour. Every change is shown with a sign and ▲/▼, and text contrast must be at least 4.5:1.
- **Dates:** the API sends `LocalDate` strings. Do not parse them with `new Date('YYYY-MM-DD')`, because that reads as UTC and can shift the day. Format them with explicit UTC handling.
- **Currency:** `Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' })`. The backend currency is EUR, unlike the PLN in the older demo sandbox.
- **Screen readers:** the list is a real list of buttons ("Edit position: SAP SE"). The slider has `aria-valuetext` ("€2,500, 25% of portfolio"). A polite live region reports cash changes. The replay date announces only on pause or finish, not every tick. The dialog traps focus.
- **Hard states are designed first:** loading skeletons, error with retry (for the catalogue and for the simulation batch), empty filter results ("Clear filters"), empty portfolio, over-cash attempt.
- **Instrument rows:** name, class badge, risk badge (text, not colour only), annual volatility from `simulationConfiguration.parameters`, a past-1Y change labelled "Past 1Y, not a forecast", and a sparkline. **Do not show expected return.** It is a curated assumption, not a forecast. Sparklines load lazily with an `IntersectionObserver`: a row asks the page for its history when it scrolls into view, and the page caches the result in its own `useRef` map, so 20 histories are not fetched on page load.
- **Instrument panel:** the history chart with ranges (1M, 6M, 1Y, ALL), description, risk, the history disclaimer, and `AmountField`. The chart continues past "today" with the replay path so far (scaled so the simulated series joins the last history value), with a marker at the replay start. The panel takes the future path as an optional prop, so it works without one.
- **Allocation bar:** segments for cash, stocks and ETFs with a text legend and percentages.

## Implementation milestones

Rough sizes are for one developer and are only a guide. M1 (backend) and M2 (frontend foundation) are independent and can run in parallel.

| # | Milestone | Size | Done when |
|---|---|---|---|
| M0 | **Contracts.** TS types in `model/` (`instrument.ts`, `simulation.ts`), the batch contract (this document) | 0.5 d | Types compile, and the contract is agreed |
| M1 | **Backend.** `SeedMixer`, `SimulationService.simulateBatch`, `POST /api/simulations/batch` and the few service tests | 0.5 d | Service tests pass, and `bash mvnw test` is green |
| M2 | **Frontend foundation.** `money.ts`, `portfolioReducer.ts`, `equityCurve.ts`, `marketTape.ts`, gain/loss tokens, route, nav link, `WorkspaceLayout` shell, `PlaygroundPage` skeleton owning the state | 0.75 d | `npm run build` and `npm run lint` pass, and the shell renders inside `AppLayout` |
| M3 | **Shared workspace without prices.** `instrumentApi`, list with filters and lazy sparklines, `InstrumentPanel` and `AmountField`, `PortfolioList`, `AllocationBar`, hard states, horizon selector | 2.5 d | A user can build a portfolio from the real catalogue within the €10,000 budget (every price is 1) |
| M4 | **Playground.** `simulationApi`, batch loading, replay clock, trading at replay prices, header, equity curve, finish summary, **Start over** | 3 d | Trades during the replay produce correct values, Pause works, and Start over gives a fresh run |
| M5 | **Polish and docs.** Accessibility pass, mobile pass, hard states, manual checklist, `AGENTS.md` | 1–1.5 d | The checklist below passes |

Total: about 8.5 developer-days.

**M1 status: done.** `SeedMixer`, `SimulationService.simulateBatch`, `POST /api/simulations/batch` and four service tests (`SimulationServiceTests`) are in, and `bash mvnw test` is green (32 tests). A smoke test against the running app confirmed a 20-instrument, 5-year batch returns 200 with 20 aligned results (1.27 MB, about 65 ms), distinct seeds below 2^53, an identical replay of an item through `POST /api/simulations`, and different markets on repeated calls. Two existing problems had to be fixed along the way, because the plan depends on 404 and 400 responses:
- The old simulation error handler had been lost in a merge, so unknown instruments and invalid input returned 500. Unknown instruments now map to 404 in `ApiExceptionHandler`, and invalid simulation input maps to 400 through a handler scoped to `SimulationController`.
- `InstrumentService.getSimulationDefinition` looked up the configuration before checking the instrument existed, so an unknown ID gave a 500 on POST while GET gave 404. It now checks the instrument first.

## Verification (no automated frontend tests)

- `npm run build` and `npm run lint` pass. The three existing Fast Refresh warnings in `components/ui` are known.
- Manual checklist:
  - Build a portfolio on day 0: cash falls by exactly what is invested, and rows sum to the total.
  - Over-cash attempt is rejected with a message.
  - Play, pause, step and speed all work, and the date and total value update.
  - Buy and sell mid-replay: cash and P/L change correctly, and "Remove" returns the position's value to cash.
  - Choose each horizon (1, 3, 5, 10 years) before playing: the replay length changes, and the selector is locked after the first play.
  - Finish a run: the summary appears with a "Start over" button. Pressing it gives €10,000 cash, no holdings, day 0, a different market, and keeps the chosen horizon.
  - Leave the page and come back: everything is reset (state is page-local).
  - Catalogue error and batch error show retry, and the page recovers. Browsing and building still work while the batch loads.
  - Mobile at 375 px: tabs, panel, action bar, no horizontal scroll.
  - Keyboard-only: add a position, change it, play and pause.
- Throwaway browser scripts kept outside the repo (as in earlier layout work) are optional. Nothing is committed.

## Extension points (how the other modes plug in later)

| Concern | Playground (now) | Sandbox (later) | Duel (later) |
|---|---|---|---|
| State | Page-local (`useState` / `useReducer`) | To be moved into a shared provider or store in the planned refactor, reusing the pure `portfolio/` modules | Same |
| Config | €10,000, all instruments | Scenario budget and allowed instruments | Match budget |
| Pricing | Prices from the replay | none (every price is 1, single decision) | none |
| Header | Value, P/L, replay | Budget, cash, rules checklist, goal | Budget, cash, countdown, opponent status |
| Action bar | Replay controls | "Review and submit" with a confirm dialog | "Lock in" with a confirm dialog |
| Needs added | | A rules module (required and advisory rules, checked in integer cents), briefing and result pages | Countdown from a server `endsAt`, lock-in, opponent status |
| Backend | Batch simulation (client-visible results) | The same batch endpoint can evaluate a submitted allocation (the items are the allocation amounts), but the seed and results must stay server-side until the player has submitted | The same, plus a server-owned match with its seed and deadline |

Header ideas for the deferred modes: Sandbox shows "x of y rules met" with text and icon status, never predicted returns. Duel shows a `role="timer"` countdown computed from `endsAt` and `Date.now()` (never by decrementing), with a visually hidden polite announcement at 60, 30 and 10 seconds. Both will need server-owned seeds so a player cannot request the simulation in advance.

## Documentation

When implemented, update `AGENTS.md`:
- The `/playground` route and the `workspace/` and `playground/` folders, including the boundary rule.
- The new `POST /api/simulations/batch` endpoint in the REST notes, with the seed-derivation, same-duration and no-correlation notes.
- The "simulated future is visible to the client, so scored modes need server-side evaluation" limitation.
- That the Playground keeps all of its state in the page (in memory only), like the demo.
- No new dependency is expected, so the Tech stack table should not change.

## Out of scope

- Sandbox and Duel modes, scoring, scenarios, matches, the leaderboard and server-side evaluation.
- Correlated markets, a cash or deposit instrument, fees and slippage.
- The AI coach.
- Saving portfolios or progress (no persistence, no URL state).
- A shared provider, context or global store (planned as a later refactor).
- A mid-run reset (only "Start over" after the simulation finishes).
- Frontend automated tests, and backend controller or integration tests.
