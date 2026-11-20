# Historical source snapshots

Part 1 of the investment simulation plan: offline source material only. Nothing
here is loaded by the application yet; `data.sql` generation is Part 2.

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
- These values are not normalized index levels. A later seed generator may
  normalize adjusted close to 100 and must then label it as an index, not EUR.
- An ETF name containing “USD” can describe its fund/share-class currency even
  though this exchange listing trades in EUR. EUR quotation does **not** mean
  currency hedging or removal of underlying foreign-currency exposure.

These are real historical source snapshots, **not synthetic market outcomes**.
Do not present them as synthetic source history. The educational sandbox's future
paths will be simulated. If the seed generator shifts dates, preserve the original
date and label the result as a historical demo replay, not recent actual prices.

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
