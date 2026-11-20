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

### Status

Completed: 20 EUR-quoted instruments (12 stocks and 8 ETFs), with 15,258 daily observations spanning 20 November 2023–19 November 2026. Yahoo Finance chart responses and extracted CSVs are stored locally with provenance, checksums, and documented usage restrictions. Fourteen incomplete rows were omitted and recorded in the manifest.

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

## Part 2 — Implement the data model and startup initialization (completed)

### Status

Completed: three entities under `model/` and three repositories were added. Packaging with tests skipped and a manual application startup/schema inspection succeeded. Hibernate created the expected foreign keys, unique constraints, `NUMERIC(24,8)` observation values, and CLOB parameter storage. Repository lookups executed successfully; all three existing users loaded and the new tables remained empty. Existing configuration and `data.sql` were unchanged.

Follow-up changes completed: `AssetClass`, `RiskLevel`, and `HistoryValueType` are string-backed enums under `model.enums`, mapped with `EnumType.STRING`. Enum persistence was checked manually, and a clean package build succeeded with tests skipped after moving the enums. `modelKey` and `currency` remain strings. Part 3 (seed generation) is next.

### Goal

Create the Java persistence model first and let Hibernate create its empty tables. The existing user seed continues to load unchanged. Instrument data will be added in Part 3, after the schema exists.

### Classes

```text
model/
  Instrument
  HistoricalObservation
  SimulationConfiguration
  enums/
    AssetClass
    RiskLevel
    HistoryValueType

repository/
  InstrumentRepository
  HistoricalObservationRepository
  SimulationConfigurationRepository
```

Leave the existing `entity/User` untouched rather than reorganizing unrelated code.

### Entity mappings

Use the base package `com.flexpol.backend`, with new entities under `model/`. Apply explicit `@Table`, `@Column`, and `@JoinColumn` names so generated SQL does not depend on implicit naming conventions.

#### Instrument

Table: `instrument`.

| Java field | SQL column | Type / mapping |
| --- | --- | --- |
| `id` | `id` | `Long`, manually assigned primary key; no `@GeneratedValue` |
| `name` | `name` | Required string, length 255 |
| `description` | `description` | Optional string, length 2000 |
| `assetClass` | `asset_class` | Required `AssetClass`, persisted using `EnumType.STRING`, length 64 |
| `currency` | `currency` | Required string, length 3; seeded as `EUR` |
| `riskLevel` | `risk_level` | Required `RiskLevel`, persisted using `EnumType.STRING`, length 32; educational classification |
| `historyValueType` | `history_value_type` | Required `HistoryValueType`, persisted using `EnumType.STRING`, length 64 |
| `historySource` | `history_source` | Required string, length 255 |
| `historyDescription` | `history_description` | Optional string, length 2000 |
| `historyRebased` | `history_rebased` | Required boolean |

Use string-backed enums for `assetClass` (`STOCK`, `EQUITY_ETF`, `DEPOSIT`), `riskLevel` (`LOW`, `MEDIUM`, `HIGH`), and `historyValueType` (`PRICE`, `TOTAL_RETURN_INDEX`, `ACCRUED_VALUE_INDEX`). Adding or renaming enum values requires corresponding code and seed updates. Keep model keys and currency as strings, and do not couple simulation dispatch to asset class. History metadata distinguishes actual EUR prices from dimensionless normalized indices; EUR remains the investment currency when the observations are index levels. Hibernate may generate native enum types or constraints while storing enum names, not ordinals.

#### HistoricalObservation

Table: `historical_observation`.

| Java field | SQL column | Type / mapping |
| --- | --- | --- |
| `id` | `id` | `Long`, manually assigned primary key |
| `instrument` | `instrument_id` | Required lazy `@ManyToOne` foreign key |
| `date` | `observation_date` | Required `LocalDate`; startup-relative display date |
| `originalDate` | `original_date` | Required `LocalDate`; unchanged source date |
| `value` | `observation_value` | Required `BigDecimal`, precision 24, scale 8 |

Add a unique constraint on `(instrument_id, observation_date)`. Its backing index supports instrument/date lookups without an additional duplicate index. Use descriptive column names instead of generic SQL identifiers such as `date` or `value`.

#### SimulationConfiguration

Table: `simulation_configuration`.

| Java field | SQL column | Type / mapping |
| --- | --- | --- |
| `id` | `id` | `Long`, manually assigned primary key |
| `instrument` | `instrument_id` | Required lazy `@OneToOne` foreign key, unique |
| `modelKey` | `model_key` | Required string, length 64; initially `GBM` |
| `parametersJson` | `parameters_json` | Required `String` with `@Lob`; H2 character large object |

Keep the JSON opaque in the persistence layer. Each future simulation engine will decode it into its own parameter DTO. No native JSON database type, financial calculation, or JSON parsing is needed in this part.

### Relationship and entity conventions

- Relationships point from observations/configurations to the instrument. Do not add a large observation collection or inverse configuration association to `Instrument` initially.
- No cascade operations or orphan removal are needed for SQL-seeded data.
- One configuration per instrument is enforced by uniqueness; an instrument can temporarily exist without a configuration until seeded.
- Use Lombok getters, setters, and a no-argument constructor, consistent with the existing entity. Avoid `@Data` and relationship-based `equals`, `hashCode`, or `toString` methods.
- Keep database nullability and relational constraints, but do not add Bean Validation, custom validators, or tests.
- Preserve existing user code and unfamiliar changes; do not move `entity/User` into `model/`.

### Repositories

Add Spring Data `JpaRepository<..., Long>` interfaces:

- `InstrumentRepository`: inherited CRUD methods initially.
- `HistoricalObservationRepository`: add `findByInstrumentIdOrderByDateAsc(Long instrumentId)` for ordered history retrieval.
- `SimulationConfigurationRepository`: add `findByInstrumentId(Long instrumentId)` returning `Optional<SimulationConfiguration>`.

Controllers, services, DTOs, date-range filters, and simulation engines remain out of scope until Parts 4–5.

### Configuration

Reuse the existing configuration:

```properties
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.defer-datasource-initialization=true
spring.sql.init.mode=always
```

Preserve the current H2 URL and `NON_KEYWORDS=USER` setting.

No new dependencies, migrations, profiles, or configuration changes should be necessary. Leave the existing `data.sql` intact in this part.

### Implementation sequence

1. Add `Instrument` with explicit table/column mappings.
2. Add `HistoricalObservation`, its instrument relationship, decimal mapping, and unique constraint.
3. Add `SimulationConfiguration`, its unique instrument relationship, and JSON text storage.
4. Add the three repositories and their lookup methods.
5. Compile/package with tests skipped, then perform a manual application startup check.
6. Confirm all three tables, foreign keys, and unique constraints exist, existing users still load, and the new tables are empty.

### Completion criteria

The application compiles and starts with Hibernate-created instrument tables, functioning repository discovery, and the existing user seed intact. No instrument inserts or API/simulation behavior are introduced yet.

## Part 3 — Generate and load data.sql

### Goal

Convert the downloaded snapshots into reproducible startup data against the entity mappings completed in Part 2. Generate directly into a clearly marked section of `backend/src/main/resources/data.sql`; no staging SQL file is needed now that the tables exist.

### Files

```text
backend/
  scripts/
    generate_seed.py
  seed-data/
    seed-settings.json
    README.md
  src/main/resources/
    data.sql
```

### Stable IDs and editable assumptions

- Explicitly map the existing snapshot `file_key` values to instrument IDs `1001–1020` in `seed-settings.json`. The lookup key is not a database `code` field.
- Keep existing IDs unchanged when instruments are added or catalog order changes.
- Store curated annual expected returns, educational risk labels, and descriptions alongside the ID mapping.
- Proposed initial expected return: a common annual GBM drift of `0.06` for equity instruments, explicitly labeled as a curated demo assumption and overridable per instrument. This is not CAGR or a forecast.
- Use deterministic configuration IDs and observation IDs; reserve non-overlapping observation ID ranges by instrument, with a documented capacity and overflow check.

### Historical value conversion

Use source `adjusted_close` and normalize each instrument independently:

```text
index[t] = 100 × adjustedClose[t] / adjustedClose[first]
```

- Set `history_value_type` to `TOTAL_RETURN_INDEX` and explain that the series is an adjusted-close-based total-return proxy.
- Use `Decimal` calculations, fixed rounding, and eight decimal places to match `DECIMAL(24,8)`.
- Index levels are dimensionless, not executable EUR prices. EUR is the investment currency.
- Do not add dividends again, interpolate missing observations, modify source files, or convert currencies.

### Historical dates

Use the manifest's `requested_end_date` as one shared anchor for every instrument. Calculate each row's calendar-day offset from that anchor and emit H2 expressions:

```sql
DATEADD('DAY', -123, CURRENT_DATE)
```

Keep the source date in `original_date`, set `history_rebased = true`, and describe the result as a rebased historical demo replay. The latest source date appears as today at initialization. This does not constitute actual current market data and does not preserve exchange weekdays after shifting.

### Simulation parameters

- Generate `GBM` configurations for the 20 market instruments.
- Calculate sample standard deviation of daily log returns from the original adjusted-close values, annualized using `sqrt(252)`.
- Exclude return intervals spanning dates explicitly recorded as omitted/incomplete in the manifest, rather than treating those multi-session changes as one-session returns. Do not treat ordinary weekends and holidays as missing observations.
- Calculate volatility before normalizing/rounding index levels.
- Store annual expected return, annual volatility, periods per year, original calibration dates, parameter provenance, and distribution treatment in `parameters_json`.
- Keep limitations and upstream adjustment semantics explicit; source data is not independently audited and has no full exchange-calendar completeness guarantee.

### Generator behavior

1. Read only local manifest, settings, and CSV inputs; make no network calls.
2. Check input checksums against the manifest before conversion.
3. Sort instruments by stable database ID and observations by original date.
4. Generate instruments first, then configurations and observations, respecting foreign keys.
5. Escape SQL strings and serialize JSON consistently.
6. Replace only the explicitly marked generated section in `data.sql`, preserving all unrelated seed content. If no markers exist, append the section; reject malformed/ambiguous markers rather than overwrite unrelated SQL.
7. Publish the output only after successful generation. Avoid changing timestamps in generated SQL so identical inputs produce byte-identical output.
8. Update the seed-data README's workflow and part references to match the reordered plan. Retain the source usage restrictions; derived SQL does not acquire redistribution permission through conversion.

### Completion criteria

- Two runs against identical inputs produce identical SQL.
- The initial seed contains 20 instruments, 20 configurations, and 15,258 historical observations.
- Every normalized series starts at 100 and retains its original dates.
- The application starts with all generated records loaded, and the existing user records remain intact.
- No automated tests are added; use manual generation, count, determinism, and startup checks.

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

Local dataset (completed) → entity model and empty tables → generated SQL and populated database → stable API skeleton → functioning simulation.
