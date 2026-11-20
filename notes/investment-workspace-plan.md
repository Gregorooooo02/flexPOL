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
| 11 | **Fixed-duration, uninterrupted playback (latest decision).** Start requires a non-empty portfolio. Every selected horizon completes in 10 real seconds, with no Pause/Resume, forward stepping or speed selector. Dialogs and tab hiding cannot stop it. Mid-run trading remains available at current values; the final deadline makes positions read-only. This supersedes the earlier pausable replay design. |
| 12 | **Explicit modal removal.** Existing positions have a separate Remove button beside Cancel and Buy/Sell. Setting the draft amount or percentage to zero does not remove a holding: the primary confirmation is disabled, including Enter submission, and Cancel preserves the original allocation. Remove closes the position at its current simulated value and is unavailable after completion. |

Further decisions made while planning:

- **One position-sizing model.** The user sets a *target position size* (for example "SAP: €2,500"). The app derives the trade from the difference between the target and the current value, and the primary confirm button says what it will do ("Buy €500", "Sell €200"). A separate Remove button closes an existing position. Internally removal still uses a target of 0, but entering 0 in the editor cannot implicitly remove it. This also works for a future single-decision mode, where the allocation is simply the target.
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
| Playback duration | **10 seconds** | Fixed for every selected horizon. No pause, stepping or speed controls. |

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
    config.ts                # budget, horizons, fixed 10-second duration
```

Boundary rule: files under `workspace/` must not import from `playground/`.

### State and props (decision 7)

- `PlaygroundPage` holds everything with `useState` / `useReducer`, in the same way as `LearningPathDemo` does: the instrument catalogue and its load state, the simulated market (tape) and its load state, the selected horizon, the portfolio reducer, the replay state, the filters, the open instrument panel, and page-local cached history/load states. Refs track in-flight requests and deduplication.
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
│ Sticky action bar: horizon, Start / Running indicator;   │
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
- The primary button states the delta for a positive target: "Buy €500" or "Sell €200". Zero targets cannot be confirmed; use the separate Remove button to close an existing position. New instruments and read-only results do not show Remove.

### Replay

- State: `{ status: 'idle' | 'playing' | 'finished', dayIndex }`. Absolute elapsed time maps the entire market timeline onto `SIMULATION_DURATION_MS = 10_000`, independent of the selected horizon. A roughly 100 ms interval updates the UI, and a deadline timeout finishes the run. `dayIndex` indexes actual tape points: the initial point, weekdays and possibly a terminal weekend carry-forward point. The UI calls these market steps, not elapsed calendar days.
- No seeking backwards (the portfolio would no longer match).
- Prices: `priceOf(id) = series[id][dayIndex] / 10_000`. The tape and replay state live in `PlaygroundPage`. Because all state is in the page, every tick re-renders it, so memoise the shared rows (`React.memo`) and keep the tick rate near 10 updates per second. If this proves too slow, optimising it is part of the later state refactor.
- Equity curve: `buildEquityCurve(tape, trades, upToIndex)` reconstructs total value per day from the trade log, so skipped days are filled correctly.
- **There is no pause, resume, stepping or speed control.** The latest user decision explicitly replaces the earlier pausable design. Start is blocked for an empty portfolio. After Start, the horizon is locked and the only playback control is a disabled Running indicator until the result is ready.
- Dialogs, trades and hidden tabs never pause or reset the start time. If the browser throttles background callbacks, visibility/focus changes synchronise to elapsed time; an expired run goes straight to its final point. Timers/listeners are cleared on unmount.
- Opening an editor shows live values while the clock continues. Confirming or removing a position samples the current replay time and price, revalidates the trade, and records that point atomically. Orders are rejected once the 10-second deadline has passed, even if a UI tick has not rendered the finished state yet.
- Trades are only possible at the current replay date, and are disabled while the replay has finished. Before the first play they are allowed at day 0 even if the batch is still loading.
- When the replay reaches the last day it moves to `finished`. Show a summary (final value, total return, largest positive/negative instrument contributions including closed positions) with a primary **"Start over"** button. Holdings show unrealised P/L separately; overall P/L includes realised trades. Finished positions are read-only but instrument details remain inspectable.
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
- **Screen readers:** the list is a real list of buttons ("Edit position: SAP SE"). The slider has `aria-valuetext` ("€2,500, 25% of portfolio"). A polite live region reports cash changes and simulation start/finish, not every tick. The dialog traps focus.
- **Hard states are designed first:** loading skeletons, error with retry (for the catalogue and for the simulation batch), empty filter results ("Clear filters"), empty portfolio, over-cash attempt.
- **Instrument rows:** name, class badge, risk badge (text, not colour only), annual volatility from `simulationConfiguration.parameters`, a past-1Y change labelled "Past 1Y, not a forecast", and a sparkline. **Do not show expected return.** It is a curated assumption, not a forecast. Sparklines load lazily with an `IntersectionObserver`: a row asks the page for its history when it scrolls into view, and the page caches the response/load state and deduplicates in-flight requests, so all 20 histories are not fetched on page load.
- **Instrument panel:** the history chart with ranges (1M, 6M, 1Y, ALL), description, risk, the history disclaimer, and `AmountField`. M4 uses separate **History** and **This simulation** views rather than joining original source dates to shifted/synthetic dates. The optional simulation chart is a dimensionless index starting at 100 and only reveals points through the current replay date. Shared components receive a chart slot, not a Playground type. The historical view remains available even if simulation data is unavailable, and vice versa.
- **Allocation bar:** segments for cash, stocks and ETFs with a text legend and percentages.

## Implementation milestones

**Current scope status:** M0–M4 are complete. M5 is complete for responsive polish, loading/error states, formatting/copy and documentation. The user explicitly excluded the accessibility part of M5; that review remains deferred.

Rough sizes are for one developer and are only a guide. M1 (backend) and M2 (frontend foundation) are independent and can run in parallel.

| # | Milestone | Size | Done when |
|---|---|---|---|
| M0 | **Contracts.** TS types in `model/` (`instrument.ts`, `simulation.ts`), the batch contract (this document) | 0.5 d | Types compile, and the contract is agreed |
| M1 | **Backend.** `SeedMixer`, `SimulationService.simulateBatch`, `POST /api/simulations/batch` and the few service tests | 0.5 d | Service tests pass, and `bash mvnw test` is green |
| M2 | **Frontend foundation.** `money.ts`, `portfolioReducer.ts`, `equityCurve.ts`, `marketTape.ts`, gain/loss tokens, route, nav link, `WorkspaceLayout` shell, `PlaygroundPage` skeleton owning the state | 0.75 d | `npm run build` and `npm run lint` pass, and the shell renders inside `AppLayout` |
| M3 | **Shared workspace without prices.** `instrumentApi`, list with filters and lazy sparklines, `InstrumentPanel` and `AmountField`, `PortfolioList`, `AllocationBar`, hard states, horizon selector | 2.5 d | A user can build a portfolio from the real catalogue within the €10,000 budget (every price is 1) |
| M4 | **Playground.** `simulationApi`, batch loading, fixed-duration clock, trading at replay prices, header, equity curve, finish summary, **Start over** | 3 d | Every horizon finishes in 10 seconds without pausing, trades use current prices, and Start over gives a fresh run |
| M5 | **Polish and docs (complete, accessibility excluded).** Responsive pass, hard states, formatting/copy, manual walkthrough and `AGENTS.md` | 1–1.5 d | Responsive/error-state walkthrough completed; accessibility review explicitly deferred |

Total: about 8.5 developer-days.

**M1 status: done.** `SeedMixer`, `SimulationService.simulateBatch`, `POST /api/simulations/batch` and four service tests (`SimulationServiceTests`) are in, and `bash mvnw test` is green (32 tests). A smoke test against the running app confirmed a 20-instrument, 5-year batch returns 200 with 20 aligned results (1.27 MB, about 65 ms), distinct seeds below 2^53, an identical replay of an item through `POST /api/simulations`, and different markets on repeated calls. Two existing problems had to be fixed along the way, because the plan depends on 404 and 400 responses:
- The old simulation error handler had been lost in a merge, so unknown instruments and invalid input returned 500. Unknown instruments now map to 404 in `ApiExceptionHandler`, and invalid simulation input maps to 400 through a handler scoped to `SimulationController`.
- `InstrumentService.getSimulationDefinition` looked up the configuration before checking the instrument existed, so an unknown ID gave a 500 on POST while GET gave 404. It now checks the instrument first.

### M3 status: done — portfolio builder

- The Playground now loads the real catalogue through `src/api/instrumentApi.ts`, with search, class/risk filters, alphabetical ordering, catalogue loading/error/empty states and retry.
- `PlaygroundPage` owns the catalogue, per-instrument history load states/cache, request controllers, filters, selected instrument, amount draft, historical range and selected horizon alongside its portfolio reducer. No state provider, persistence, global cache or data-fetching dependency was added.
- `InstrumentRow`, `InstrumentPanel`, `AmountField`, `PortfolioList`, `HoldingRow`, `AllocationBar`, `MoneyValue` and `SignedChange` replace the placeholders. Edits are targets, not additional purchases; `planPosition` determines the Buy/Sell/Remove action. Confirm commits, Cancel discards the draft, and focus returns to the opener. Over-cash and malformed inputs are rejected. The slider and quick allocations update the amount, not a second percentage state.
- Rows request history as they approach the viewport; opening the dialog reuses that request/cache. Failed histories can be retried without disabling allocations. `workspace/history.ts` and the SVG `Sparkline`/`PriceChart` components use original source dates, with 1M/6M/1Y/All ranges anchored to the last available observation, date-based annual returns, explicit UTC date formatting, and unavailable states instead of fabricated zero returns. Index values are not shown as EUR share prices.
- `PlaygroundHeader` shows cash, invested amount, allocated percentage and total. A labelled cash/asset-class allocation bar updates on confirmation/removal. A controlled horizon selector offers 1/3/5/10 years without changing allocations. M3 continues to use relative price 1 on day 0; no simulation request, replay, P/L or post-simulation Start over is implemented until M4.
- Added the missing shadcn source components (`Field`, `Label`, `Select`, `Skeleton`, `ToggleGroup` and its toggle helpers) using the existing style/dependencies, without overwriting existing components or changing manifests. `Slider` gained an optional `thumbProps` prop for accessible labels. No test runner or frontend test files were added.
- Verification: `npm run build` passes and `npm run lint` reports only the pre-existing UI Fast Refresh warnings. A browser walkthrough against the running backend covered add/reduce/remove (EUR 2,500 → EUR 1,000 → removed, returning cash to EUR 10,000), insufficient cash and malformed input, Cancel, catalogue/history retries, filters, historical ranges, horizon selection, dialog focus restoration, and page-local reset after navigation. At 375 px there is no horizontal overflow and the dialog fits the viewport with a scrollable body. `AGENTS.md` documents the current state and the M4 boundary.

### M4 status: done — simulation, trading and restart

- `src/api/simulationApi.ts` calls the existing batch endpoint with the whole available EUR catalogue at base EUR 10,000 and the selected duration, without seeds. Catalogue completion, horizon changes, Retry market and Start over drive requests; filters and trades do not. Abort signals prevent stale results from replacing a newer market. Initial allocations can be edited while loading or after an error; Start requires a valid market and at least one holding.
- `marketTape.ts` now validates the instrument set, currency, initial amount, calendar-day horizon/end date, ordered aligned dates, finite non-negative values, initial/final consistency and safe numeric seeds. Missing prices during an active run are errors, never a fallback to price 1. Zero-valued paths are supported: existing worthless holdings can be removed for no proceeds, but buying at zero is rejected.
- `playground/replay.ts` maps absolute elapsed time to the current point. The page owns replay state, the start timestamp, interval/deadline handles and a synchronous state ref. Controls are Start and post-result Start over only: all horizons complete in 10 seconds. There is no paused state, speed selection or forward/backward seeking. Dialogs and hidden tabs cannot extend the deadline, and navigation cleans up timers/listeners.
- All holdings, allocations, affordability checks, edits, removals and trade-log entries use the current relative simulated price and replay index. Trading stays available while the clock runs; handlers synchronise time and validate at confirmation. At the deadline the editor becomes read-only, including an editor left open throughout the run. `performance.ts` includes realised trades in instrument contributions; overall P/L uses total value minus starting budget and holding P/L uses remaining average cost.
- `PlaygroundHeader`, `PlaygroundActions`, `ReplaySummary` and shared `ValueChart` provide current value, signed P/L, date/progress, a revealed-only equity curve, and a final read-only summary including closed-position contributions. The dialog offers separate historical and synthetic-so-far views. Charts handle flat/one-point data and bound rendered samples. The synthetic-model limitations remain visible in an expandable explanation.
- At the final point, editing/removal is disabled while details remain viewable. Start over restores EUR 10,000 cash, clears holdings/trades and resets the clock/chart, requests a fresh market, closes any dialog and focuses the page heading. Horizon, filters, catalogue and history cache remain. Start is disabled again until a position is added. Leaving or refreshing still resets everything.
- Verification: build and lint pass (only existing UI Fast Refresh warnings). Earlier M4 walkthroughs covered market retry, P/L including realised trades, zero-valued positions and restart. After the fixed-duration update, a real-backend browser walkthrough measured both 1-year and 10-year horizons at about 10.01 seconds, confirmed there are no Pause/Resume/step/speed controls, observed progress and a live trade with the dialog open, and confirmed a hidden-tab visibility override did not pause playback. An editor left open became read-only at the deadline. Empty Start remained blocked initially and after Start over; mobile 375 px had no horizontal overflow. No backend code, dependencies, frontend test runner or frontend test files were added.

### M5 status: done — responsive/state polish, excluding accessibility

- **Scope:** the accessibility review was explicitly excluded. Existing roles, labels and focus logic were preserved, but keyboard-only behaviour, screen readers and accessibility conformance were not audited or reworked in M5. This is not a claim that the accessibility review is complete.
- **Responsive fixes:** an initial 320 px viewport had horizontal overflow, and the sticky header/footer left only about 33 px of usable space; a short landscape viewport had about 10 px. The navigation now fits at 320 px, the workspace header uses normal document flow at heights up to 650 px, and the compact two-column action bar avoids stacking all controls/copy. Measured usable scrolled content space is now about 376 px at 320×568 and 199 px at 667×375. Normal-height screens keep the sticky workspace header.
- **Content sizing:** title/value layout, names, error details, holding/result amounts and large percentages wrap without clipping. Large totals receive a full row on narrow screens. Dialogs retain 16 px viewport margins, a height limit and a scrollable body, including in landscape and with long unbroken names/descriptions. Historical charts fill their available width with consistent strokes; loading/error/empty history reserves chart space to reduce layout jumps.
- **Hard states:** catalogue loading/error/empty/unsupported states no longer masquerade as an indefinitely preparing market or offer a Retry market button that cannot do anything. Empty catalogues use Reload catalogue; catalogue failures use Try again; actual batch failures use Retry market and preserve allocations. History errors can be retried independently; the error copy no longer promises editing after the run is read-only. Header state labels and the footer explain the current blocking condition.
- **Formatting/copy:** amounts remain EUR to cents, input accepts the agreed decimal/grouping formats, percentages remain consistently formatted, historical indices are not represented as executable prices, and holding copy spells out unrealised profit/loss. No lesson content, simulation rules, state ownership or 10-second timing was changed.
- **Walkthrough:** checked 320×568, 375×812, 768×1024, 1440×900 and 667×375 with no horizontal overflow; reached and used the editor in short portrait/landscape; exercised long unbroken names/descriptions, delayed catalogue and batch requests, catalogue/batch errors and recovery, an empty catalogue with zero batch calls, missing history and over-budget validation. An input of `1.234,56` produced an allocation of EUR 1,234.56 and cash of EUR 8,765.44 while the batch was pending; retry preserved it. Targeted response overrides produced a large EUR 1,234,568,765.44 final value to check wrapping without truncation. The run still completed in about 10.01 seconds, and Start over left Start disabled until a new holding was added.
- **Delivery:** `AGENTS.md` reflects the current layout/state behaviour. No new dependencies, backend changes, frontend test files or test runner were added. Remaining work outside this agreed slice is unchanged: accessibility review, other modes, coach, persistence and the later state-management refactor.

## Verification (no automated frontend tests)

- `npm run build` and `npm run lint` pass. Existing Fast Refresh warnings in `components/ui` are known.
- Manual checklist:
  - Build a portfolio on day 0: cash falls by exactly what is invested, and rows sum to the total.
  - Over-cash attempt is rejected with a message.
  - Start plays the selected horizon in 10 seconds, with no pause, stepping or speed controls; date and total value update automatically.
  - Buy and sell mid-replay: cash and P/L change correctly, and "Remove" returns the position's value to cash.
  - Choose each horizon (1, 3, 5, 10 years) before playing: the simulated date range changes, playback remains 10 seconds, and the selector is locked after Start.
  - Finish a run: the summary appears with a "Start over" button. Pressing it gives €10,000 cash, no holdings, day 0, a different market, and keeps the chosen horizon.
  - Leave the page and come back: everything is reset (state is page-local).
  - Catalogue error and batch error show retry, and the page recovers. Browsing and building still work while the batch loads.
  - Responsive layouts: 320 px and 375 px portrait, tablet, desktop and short landscape; editor and controls remain usable with no horizontal scroll.
- Deferred, explicitly excluded from M5: keyboard-only flow, screen-reader announcements, focus review and accessibility conformance checks.
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
- Accessibility review/enhancements (excluded from M5 by the user; existing semantics are retained).
