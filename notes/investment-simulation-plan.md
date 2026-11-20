# Investment simulation implementation plan

## Shared decisions

- All monetary values are in EUR.
- Instrument IDs are assigned explicitly in SQL; there is no `code` field.
- Use Spring Data JPA and an in-memory H2 database.
- Hibernate recreates the schema on startup; `data.sql` populates it afterward.
- No migrations, profiles, saved simulation runs, tests, or dedicated validation layer for now.
- Download historical files once; the application runs entirely offline.
- New instruments using existing behavior should require only seed changes. New simulation behaviors belong in isolated engine implementations.
- Distinguish real source history, rebased historical demo data, and synthetic future outcomes. Keep the project's educational-demo positioning explicit.
- Preserve existing user entities, repositories, configuration, and seed records.

## Part 1 — Download historical data for 20 instruments

### Goal

Produce a local, documented dataset for seed generation.

### Instrument selection

Use 20 widely recognized instruments available through EUR quotations. This is a representative selection, not an authoritative popularity ranking; that would require an agreed market and ranking metric.

| Group | Proposed instruments |
| --- | --- |
| 12 stocks | SAP, Siemens, Allianz, Deutsche Telekom, Airbus, Schneider Electric, TotalEnergies, LVMH, L’Oréal, ASML, ING, Santander |
| 8 ETFs | Broad world equities, developed-world equities, S&P 500, Nasdaq-100, Euro Stoxx 50, emerging markets, world small caps, global equity ESG |

Choose exact ETF products and EUR exchange listings according to downloadable data availability. Different ETF exposures can share the same simulation engine.

Deposits have no comparable exchange-price histories. Add fictional deposit fixtures separately when implementing the fixed-rate engine.

### Tasks

1. Confirm provider symbols, EUR quotation, and download availability.
2. Download approximately three years of daily history from Stooq or another suitable source.
3. Preserve original CSV files.
4. Record metadata for each dataset:
   - Instrument name and provider symbol.
   - Source URL and download date.
   - Currency.
   - Actual date range.
   - Split/dividend adjustment semantics.
   - Usage and redistribution restrictions.
5. Provide a repeatable, development-only download script.

### Proposed files

```text
backend/
  scripts/
    download_history.py
  seed-data/
    manifest.json
    raw/
      ...
```

### Completion criteria

Twenty usable local datasets with known currency and adjustment semantics. If a listing is unavailable, substitute another EUR listing or propose an explicit replacement.

## Part 2 — Generate data.sql

### Goal

Convert downloaded snapshots into reproducible startup data.

Agree on table and column names before generating SQL, although Java entities are implemented in Part 3.

### Tasks

1. Assign stable instrument IDs, for example `1001–1020`.
2. Normalize data into a consistent observation format.
3. Generate inserts for instruments, simulation configurations, and historical observations.
4. Preserve existing user inserts in `backend/src/main/resources/data.sql`.
5. Add a repeatable conversion script at `backend/scripts/generate_seed.py`.

### Historical dates

Support relative dates anchored to application startup using H2 expressions:

```sql
DATEADD('DAY', -123, CURRENT_DATE)
```

Calculate offsets against one shared dataset anchor to preserve relative timing between instruments. Keep original observation dates as well.

Rebased real prices are a demo replay of historical data, not actual recent quotations. Label them accordingly. Calendar-day shifting does not preserve the original exchange calendar.

### Simulation parameters

- Estimate annualized volatility from daily log returns.
- Use curated expected returns rather than blindly extrapolating historical growth.
- Record parameter provenance and distribution treatment.
- Retain explicit adjustment metadata; do not assume every source series is a total-return series.

### Completion criteria

SQL generation is deterministic for the same input files, includes all 20 instruments, and preserves existing application seed data.

### Dependency note

The expanded seed cannot execute until Part 3 creates its tables. If every intermediate commit must start successfully, generate a staging SQL file in this part and merge it into `data.sql` in Part 3.

## Part 3 — Implement the data model and startup initialization

### Goal

Start the application with the complete seeded instrument database.

### Classes

```text
model/
  Instrument
  HistoricalObservation
  SimulationConfiguration

repository/
  InstrumentRepository
  HistoricalObservationRepository
```

Leave the existing `entity/User` untouched rather than reorganizing unrelated code.

### Model outline

#### Instrument

```text
id
name
description
assetClass
currency
riskLevel
historyValueType
historySource
historyDescription
historyRebased
```

#### HistoricalObservation

```text
id
instrument
date
originalDate
value
```

#### SimulationConfiguration

```text
id
instrument
modelKey
parametersJson
```

### Modeling conventions

- Explicitly assigned instrument IDs.
- `BigDecimal` for persisted values.
- `LocalDate` for observation dates.
- Explicit table and column names matching generated SQL.
- An index on instrument and observation date.
- A text column containing model-specific JSON parameters.
- Separate asset classification from simulation behavior: stocks and ETFs can both use `GBM`.
- Keep history semantics explicit: prices in EUR versus normalized total-return or accrued-value indices. An index level is not a euro amount.

### Configuration

Reuse the existing configuration:

```properties
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.defer-datasource-initialization=true
spring.sql.init.mode=always
```

Preserve the current H2 URL and `NON_KEYWORDS=USER` setting.

### Completion criteria

The application starts, Hibernate creates the tables, and H2 contains existing users plus all instrument data.

## Part 4 — Add controllers, DTOs, and service skeletons

### Goal

Establish the API contract without implementing retrieval or simulation behavior yet.

### Structure

```text
controller/
  InstrumentController
  SimulationController

service/
  InstrumentService
  SimulationService

dto/
  InstrumentResponse
  HistoricalObservationResponse
  SimulationRequest
  SimulationResult
  SimulationPoint
  SimulationAssumptions
```

### Routes

```http
GET  /api/instruments
GET  /api/instruments/{id}
GET  /api/instruments/{id}/history
POST /api/simulations
```

### Example simulation request

```json
{
  "instrumentId": 1001,
  "initialInvestment": 10000,
  "durationMonths": 24,
  "randomSeed": 42
}
```

### Result contract

Include:

- Instrument ID and currency.
- Initial investment.
- Start and end dates.
- Random seed and model identifier.
- Applied assumptions.
- Dated investment-value points.
- Final value and total return.

### Placeholder behavior

Controllers and injected service classes compile and start. Unimplemented operations return HTTP `501 Not Implemented`, rather than fabricated successful results or ambiguous null responses.

### Completion criteria

All routes are registered, request and response types exist, and the application starts successfully.

## Part 5 — Implement retrieval and simulation

### Goal

Replace placeholders with working, on-demand functionality.

### Instrument retrieval

Implement repository-backed instrument listing, instrument details with simulation assumptions, and historical observations ordered by date. Return DTOs rather than serializing JPA entities directly.

### Extensible engine structure

```text
simulation/
  SimulationEngine
  GbmSimulationEngine
  FixedRateSimulationEngine

dto/
  GbmParameters
  FixedRateParameters
```

`SimulationService` selects an injected engine using `modelKey`; avoid a growing switch over instrument categories. Each engine interprets its own parameters through a typed DTO. Keep financial calculations independent of repository access.

### GBM engine

For stocks and equity ETFs:

- Generate one daily path using geometric Brownian motion.
- Use configured annual expected return and volatility.
- Approximate market sessions with weekdays; no exchange-holiday calendar initially.
- Scale the path to the initial EUR investment.
- Support an optional random seed; generate and return one when omitted.
- Return the assumptions used.
- Do not persist results.

The transition formula is:

```text
nextValue = currentValue × exp(
    (annualExpectedReturn − 0.5 × annualVolatility²) × dt
    + annualVolatility × sqrt(dt) × Z
)

dt = 1 / 252
Z = standard normal random value
```

The expected-return parameter is the model drift, not historical CAGR. Use floating-point calculations internally where logarithms and exponentials are required, and round monetary outputs at the boundary.

### Fixed-rate engine

Add a small fictional deposit seed fixture if this behavior is included in the initial demo:

- Deterministic interest accrual.
- Explicit rate and compounding frequency.
- Explicit maturity behavior.
- No assumption that the same rate remains available after maturity.

A fixed-coupon bond is not automatically suitable for this engine because its market price can fluctuate.

### Initial boundaries

- One instrument per simulation.
- One initial contribution.
- One trajectory.
- No taxes, inflation, trading constraints, or FX conversion.
- No portfolio correlations or authored market events yet.
- No multiple-path percentile bands initially.

Expose exclusions in response assumptions rather than leaving them implicit. EUR quotation does not mean an internationally invested ETF is currency-hedged.

### Completion criteria

A caller can retrieve an instrument, request a duration-based simulation, and receive a plausible EUR-valued trajectory reproducible from the same inputs, parameters, algorithm, and random seed.

## Verification approach

Do not add tests for this implementation. Perform compilation and startup checks for each runnable part, followed by manual endpoint smoke checks once functionality is implemented.

## Delivery sequence

Local dataset → SQL seed → working persistence → stable API skeleton → functioning simulation.
