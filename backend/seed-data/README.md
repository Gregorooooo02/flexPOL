# Historical source snapshots

Part 1 supplies offline source snapshots; Part 2 defines the persistence model.
Part 3 converts the snapshots into a generated section of
`backend/src/main/resources/data.sql`, loaded after Hibernate creates the schema.
The application needs neither Python nor network access to load the checked-in SQL.

## Contents

- `instruments.json`: editable selection of 12 stocks and 8 equity ETFs.
- `raw/*.json`: original, unmodified Yahoo Finance chart responses, including
  provider metadata and any returned corporate actions.
- `raw/*.csv`: daily observations extracted from those responses, without date
  shifting, normalization, currency conversion, interpolation, or price rounding.
  These are extracted CSVs, not provider-issued CSV downloads.
- `manifest.json`: exact source URLs, UTC download times, provider names,
  exchanges, verified currencies, actual date ranges, row counts, omitted
  incomplete dates, adjustment conventions, and SHA-256 checksums for both files.
- `seed-settings.json`: stable database IDs, curated educational risk labels,
  descriptions, and editable expected-return assumptions, keyed by snapshot
  `file_key`. This lookup key is not a database instrument code.

The selection is representative, **not an authoritative top-20 popularity
ranking**. Stooq returned a browser-verification page during source discovery;
Yahoo's chart endpoint supplied all 20 proposed EUR listings without substitutions.

## Initial snapshot

- Downloaded on **20 November 2026**, with a requested window of 19 November 2023
  through 19 November 2026 (inclusive).
- Actual observations: **20 November 2023–19 November 2026**.
- **20 instruments**, **15,258 observations**, all quotations verified as EUR.
- **14 incomplete rows** were omitted; their dates are recorded per instrument
  in the manifest. Each instrument has between 760 and 766 complete observations.
- 20 original JSON responses and 20 extracted CSVs, approximately 3.2 MB total.

## Download / refresh

Use Python **3.10+** with system IANA timezone data. No pip packages or application
dependencies are required. Run from the repository root:

```sh
python3 backend/scripts/download_history.py --help
python3 backend/scripts/download_history.py --end-date 2026-11-19 --refresh
```

The default window is three years ending yesterday, excluding incomplete current
sessions. Specify `--start-date YYYY-MM-DD` for another inclusive start date.
Existing snapshots require `--refresh`; use `--output-dir PATH` to write a separate
snapshot instead. Paths default relative to the script, not the current directory.

The downloader requests one instrument at a time and fails visibly on provider
errors; it does not bypass access challenges, silently substitute instruments,
or fabricate missing prices. Files are staged until all downloads succeed. A
provider failure leaves existing snapshots unchanged. There are no automatic
retries or external calls during application startup.

Refreshing is repeatable, but upstream prices and adjustments may be revised.
Use the committed original responses and checksums for an exact local snapshot.
Provider daily data is not independently audited. Missing market days are not
filled; dates are interpreted in the listing's exchange timezone. Rows with
missing OHLC or adjusted-close values are omitted and listed in the manifest.
An absent provider bar is not proof of an exchange holiday: no official trading
calendar completeness audit is performed.

## Generate the database seed

Run offline from the repository root with Python 3.10+ and no pip packages:

```sh
python3 backend/scripts/generate_seed.py
```

To inspect output without modifying the active seed:

```sh
python3 backend/scripts/generate_seed.py --output /tmp/opencode/flexpol-seed-preview.sql
```

Optional `--data-dir`, `--settings`, and `--seed-file` arguments select alternative
local inputs. `--seed-file` defaults to the application's existing `data.sql` and
supplies the content to preserve, even when `--output` is specified. The generated
output must be outside the source snapshot directory to protect source inputs.

The generator checks CSV checksums, sorts by instrument ID and original date,
and replaces only the section between these markers:

```sql
-- BEGIN GENERATED INSTRUMENT SEED
-- END GENERATED INSTRUMENT SEED
```

If absent, the section is appended; missing, reversed, or duplicate marker pairs
cause failure without changing the seed. All unrelated SQL outside
the section are preserved. Output is written atomically only after conversion
succeeds. There are no generation timestamps, and identical inputs produce
byte-identical SQL. The current seed contains 20 instruments, 20 configurations,
and 15,258 observations. The obsolete user seed has been removed. It uses ordinary
inserts, not upserts: Hibernate recreates the schema on every startup.

### Stable identifiers

- Instrument IDs `1001–1020` are explicitly assigned in `seed-settings.json` and
  remain stable regardless of catalog ordering. Assign a new ID for a new instrument.
- Configuration IDs reuse the corresponding instrument's ID in a separate table.
- Observation IDs are `instrumentId * 1_000_000 + rowNumber`, starting at row 1.
  Each instrument reserves 999,999 observation IDs; overflow is rejected.
  Row IDs are deterministic for the same snapshot but change if earlier history
  is inserted. Do not treat them as durable external identifiers.

### Seed value and date semantics

Each series uses `100 * adjusted_close / first_adjusted_close`, calculated with
40-digit Decimal precision and round-half-even to eight fractional digits.
`history_value_type` is `TOTAL_RETURN_INDEX`: an adjusted-close-based total-return
proxy, not an independently audited total-return index. The starting level is
`100.00000000`, **not EUR 100**. A future simulation scales relative index growth
to the learner's EUR investment. Dividends must not be added again.

Original dates are retained in `original_date`. Display dates use
`DATEADD('DAY', offset, CURRENT_DATE)`, where `offset` is measured from the shared
manifest `requested_end_date`, currently 19 November 2026. Thus that source date
appears as the database initialization date. `history_rebased` is true, and each
instrument explains that this is a historical demo replay, not actual current
market data. Shifting does not preserve exchange weekdays. Raw files stay intact;
no interpolation or currency conversion is performed.

### Simulation assumptions

All 20 configurations use `GBM`; the engine itself is implemented in Part 5.
The parameter JSON includes:

- Annual expected return, initially `0.06` for every instrument. This is a curated
  illustrative **model drift**, not CAGR, a historical growth extrapolation,
  or a forecast. Override it per instrument in `seed-settings.json`.
- Annual volatility, derived from sample variance of original adjusted-close log
  returns, annualized using 252 sessions per year and rounded to eight decimals.
- Original calibration dates, included return count, excluded incomplete interval
  count, and parameter/distribution provenance.

Return intervals spanning dates explicitly recorded as incomplete in the manifest
are excluded from calibration. Ordinary weekends and holidays are not excluded;
unknown provider omissions are not identified by a complete exchange calendar.
Historical rows themselves are retained, and calibration uses unrounded source
values rather than rounded indices. All calculations are deterministic Decimal
operations before serialization to numeric JSON values.

Risk labels (`LOW`, `MEDIUM`, `HIGH`) are editable educational classifications,
not official fund risk indicators or a calculated ranking. Asset-class and history
type strings must match the Java enums in `model.enums`; model keys remain strings.
Adding a new simulation behavior requires converter support as well as a future
engine. Deposits are not fabricated from market-price snapshots.

## CSV fields and interpretation

```text
date,open,high,low,close,adjusted_close,volume
```

- Dates are original exchange-local session dates, sorted ascending.
- Prices are for EUR-quoted listings. Volume is the provider's traded-unit count;
  a blank volume means unavailable, not zero.
- `close` is the provider's split-adjusted close, without dividend reinvestment.
- `adjusted_close` includes applicable split and distribution adjustments. Relative
  changes can be used as a total-return proxy, not as historical executable prices.
  See [Yahoo's adjustment explanation](https://help.yahoo.com/kb/SLN28256.html).
- Do not add dividends again when using adjusted-close returns. For accumulating
  ETFs, reinvested fund income is already reflected in the fund value.
- These raw values are not normalized index levels. The seed generator normalizes
  adjusted close to 100 and labels the derived observations as an index, not EUR.
- An ETF name containing “USD” can describe its fund/share-class currency even
  though this exchange listing trades in EUR. EUR quotation does **not** mean
  currency hedging or removal of underlying foreign-currency exposure.

These are real historical source snapshots, **not synthetic market outcomes**.
Do not present them as synthetic source history. The educational sandbox's future
paths will be simulated. The seed generator preserves original dates and labels
the shifted series as a historical demo replay, not recent actual prices.

## Usage restrictions

**These files are not an openly licensed market-data dataset.** Copyright and
provider/exchange rights remain with their respective owners. Repository code
licensing does not grant rights to the data.

- [Yahoo terms](https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html)
- [Yahoo Finance additional terms](https://legal.yahoo.com/us/en/yahoo/terms/product-atos/finance/index.html)

Yahoo's terms restrict automated collection without prior permission, commercial
reuse, and redistribution. The chart endpoint is an unofficial integration, not
a supported or guaranteed API. Successful download does not establish permission.
Permission has **not** been verified for this project: obtain appropriate rights
before further collection, publishing/distributing snapshots, or distributing
derived SQL. Attribution and educational use alone do not establish permission.

If the intended distribution is not permitted, replace these inputs with a
suitably licensed source or explicitly synthetic data. Never claim these inputs
or a derived dataset have cleared redistribution rights.
