#!/usr/bin/env python3
"""Download offline historical snapshots using only the Python standard library."""

import argparse
import csv
import hashlib
import json
import math
import re
import sys
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo


BACKEND = Path(__file__).resolve().parents[1]
FIELDS = ["date", "open", "high", "low", "close", "adjusted_close", "volume"]
ADJUSTMENTS = {
    "close": "Provider close, split-adjusted; cash distributions are not reinvested.",
    "adjusted_close": (
        "Provider adjusted close, adjusted for applicable splits and dividend "
        "distributions. Use relative changes as a total-return proxy, not as "
        "historical executable prices. Do not add dividends again."
    ),
    "reference_url": "https://help.yahoo.com/kb/SLN28256.html",
    "limitations": (
        "Provider adjustments are not independently audited and may be revised. "
        "ETF accumulating distributions are already reflected in fund value."
    ),
}
USAGE = {
    "terms_url": "https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html",
    "finance_terms_url": "https://legal.yahoo.com/us/en/yahoo/terms/product-atos/finance/index.html",
    "permission_status": "NOT_VERIFIED",
    "notice": (
        "Third-party market data, not an openly licensed dataset. Yahoo terms "
        "restrict automated collection without prior permission, commercial "
        "reuse, and redistribution. Download access is not permission. Obtain "
        "appropriate rights before refreshing, publishing, or distributing "
        "these snapshots or derived datasets; attribution alone is insufficient."
    ),
}


def three_years_before(day):
    try:
        return day.replace(year=day.year - 3)
    except ValueError:
        return day.replace(year=day.year - 3, day=28)


def parse_arguments():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--catalog", type=Path, default=BACKEND / "seed-data/instruments.json"
    )
    parser.add_argument(
        "--output-dir", type=Path, default=BACKEND / "seed-data"
    )
    parser.add_argument(
        "--end-date", type=date.fromisoformat,
        default=date.today() - timedelta(days=1),
        help="Inclusive end date, YYYY-MM-DD (default: yesterday).",
    )
    parser.add_argument(
        "--start-date", type=date.fromisoformat,
        help="Inclusive start date (default: three years before end date).",
    )
    parser.add_argument(
        "--refresh", action="store_true",
        help="Explicitly replace an existing snapshot and manifest.",
    )
    args = parser.parse_args()
    args.start_date = args.start_date or three_years_before(args.end_date)
    if args.start_date >= args.end_date:
        parser.error("--start-date must precede --end-date")
    if args.end_date >= date.today():
        parser.error("--end-date must precede today to exclude incomplete sessions")
    if (args.output_dir / "manifest.json").exists() and not args.refresh:
        parser.error("Snapshot exists; use --refresh or a different --output-dir")
    return args


def load_catalog(path):
    instruments = json.loads(path.read_text(encoding="utf-8"))
    keys, symbols = set(), set()
    for instrument in instruments:
        key, symbol = instrument["file_key"], instrument["symbol"]
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", key):
            raise ValueError(f"Unsafe file_key: {key}")
        if key in keys or symbol in symbols:
            raise ValueError(f"Duplicate file_key or symbol: {key}, {symbol}")
        if instrument["currency"] != "EUR":
            raise ValueError(f"Only EUR quotations are supported: {symbol}")
        keys.add(key)
        symbols.add(symbol)
    if not instruments:
        raise ValueError("Catalog is empty")
    return instruments


def source_url(symbol, start, end):
    # Yahoo period2 is exclusive. UTC boundaries enclose these European sessions.
    start_timestamp = int(datetime.combine(start, time.min, timezone.utc).timestamp())
    end_timestamp = int(datetime.combine(
        end + timedelta(days=1), time.min, timezone.utc
    ).timestamp())
    query = urlencode({
        "period1": start_timestamp,
        "period2": end_timestamp,
        "interval": "1d",
        "events": "div,splits",
        "includeAdjustedClose": "true",
    })
    return f"https://query1.finance.yahoo.com/v8/finance/chart/{quote(symbol, safe='')}?{query}"


def extract_rows(payload, instrument, start, end):
    chart = json.loads(payload)["chart"]
    if chart.get("error") or not chart.get("result"):
        raise ValueError(f"Provider error: {chart.get('error')}")
    result = chart["result"][0]
    meta = result["meta"]
    if meta.get("symbol") != instrument["symbol"]:
        raise ValueError(f"Unexpected provider symbol: {meta.get('symbol')}")
    if meta.get("currency") != "EUR":
        raise ValueError(f"Non-EUR quotation returned: {meta.get('currency')}")
    expected_type = "EQUITY" if instrument["asset_class"] == "STOCK" else "ETF"
    if meta.get("instrumentType") != expected_type:
        raise ValueError(f"Unexpected instrument type: {meta.get('instrumentType')}")

    exchange_timezone = ZoneInfo(meta["exchangeTimezoneName"])
    timestamps = result["timestamp"]
    quotes = result["indicators"]["quote"][0]
    adjusted = result["indicators"]["adjclose"][0]["adjclose"]
    arrays = [quotes[field] for field in ("open", "high", "low", "close", "volume")]
    if any(len(values) != len(timestamps) for values in [*arrays, adjusted]):
        raise ValueError("Mismatched timestamp/price array lengths")

    rows, skipped = [], []
    for index, timestamp in enumerate(timestamps):
        day = datetime.fromtimestamp(timestamp, exchange_timezone).date()
        if not start <= day <= end:
            continue
        values = [quotes[field][index] for field in ("open", "high", "low", "close")]
        values.append(adjusted[index])
        if any(value is None for value in values):
            skipped.append(day.isoformat())
            continue
        if any(not math.isfinite(value) or value <= 0 for value in values):
            raise ValueError(f"Invalid provider price on {day}")
        if rows and day.isoformat() <= rows[-1][0]:
            raise ValueError(f"Duplicate or unordered provider date: {day}")
        rows.append([day.isoformat(), *values, quotes["volume"][index]])
    if len(rows) < 2:
        raise ValueError("Fewer than two complete observations returned")
    return rows, meta, skipped


def file_metadata(path, root):
    content = path.read_bytes()
    return {
        "path": path.relative_to(root).as_posix(),
        "bytes": len(content),
        "sha256": hashlib.sha256(content).hexdigest(),
    }


def download(instrument, start, end, staging):
    url = source_url(instrument["symbol"], start, end)
    request = Request(url, headers={
        "User-Agent": "FinanceQuest-HistoryDownloader/1.0",
        "Accept": "application/json",
    })
    with urlopen(request, timeout=45) as response:
        payload = response.read()
    downloaded_at = datetime.now(timezone.utc).isoformat()
    rows, meta, skipped = extract_rows(payload, instrument, start, end)
    raw_path = staging / "raw" / f"{instrument['file_key']}.json"
    csv_path = staging / "raw" / f"{instrument['file_key']}.csv"
    raw_path.write_bytes(payload)
    with csv_path.open("w", encoding="utf-8", newline="") as output:
        writer = csv.writer(output, lineterminator="\n")
        writer.writerow(FIELDS)
        writer.writerows(rows)
    return {
        **instrument,
        "provider_name": meta.get("longName") or meta.get("shortName"),
        "provider_instrument_type": meta["instrumentType"],
        "exchange": meta.get("fullExchangeName") or meta["exchangeName"],
        "exchange_timezone": meta["exchangeTimezoneName"],
        "verified_currency": meta["currency"],
        "source_url": url,
        "quote_url": f"https://finance.yahoo.com/quote/{quote(instrument['symbol'], safe='')}/history/",
        "downloaded_at_utc": downloaded_at,
        "first_observation_date": rows[0][0],
        "last_observation_date": rows[-1][0],
        "row_count": len(rows),
        "skipped_incomplete_dates": skipped,
        "original_response": file_metadata(raw_path, staging),
        "csv": file_metadata(csv_path, staging),
    }


def main():
    args = parse_arguments()
    instruments = load_catalog(args.catalog)
    args.output_dir.parent.mkdir(parents=True, exist_ok=True)
    # Do not publish a partial dataset if one of the instruments fails.
    with TemporaryDirectory(prefix="history-download-", dir=args.output_dir.parent) as temp:
        staging = Path(temp)
        (staging / "raw").mkdir()
        entries = []
        for instrument in instruments:
            print(f"Downloading {instrument['symbol']}...", flush=True)
            try:
                entry = download(instrument, args.start_date, args.end_date, staging)
            except (OSError, ValueError, KeyError, TypeError) as error:
                raise ValueError(f"{instrument['symbol']}: {error}") from error
            entries.append(entry)
            print(f"  {entry['row_count']} rows, {entry['first_observation_date']} to {entry['last_observation_date']}")

        manifest = {
            "schema_version": 1,
            "provider": "Yahoo Finance chart endpoint (unofficial integration)",
            "selection": "20 representative EUR-quoted instruments; not a popularity ranking.",
            "requested_start_date": args.start_date.isoformat(),
            "requested_end_date": args.end_date.isoformat(),
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
            "instrument_count": len(entries),
            "total_observations": sum(entry["row_count"] for entry in entries),
            "currency": "EUR",
            "synthetic": False,
            "dates_rebased": False,
            "csv_columns": FIELDS,
            "adjustments": ADJUSTMENTS,
            "usage": USAGE,
            "instruments": entries,
        }
        (staging / "manifest.json").write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        (args.output_dir / "raw").mkdir(parents=True, exist_ok=True)
        for path in sorted((staging / "raw").iterdir()):
            path.replace(args.output_dir / "raw" / path.name)
        (staging / "manifest.json").replace(args.output_dir / "manifest.json")
    print(f"Saved {len(entries)} instruments and {manifest['total_observations']} observations to {args.output_dir}")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f"Download failed: {error}", file=sys.stderr)
        sys.exit(1)
