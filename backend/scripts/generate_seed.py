#!/usr/bin/env python3
"""Generate the instrument seed (H2 and PostgreSQL) from local snapshots, without network access."""

import argparse
import csv
import hashlib
import io
import json
import os
import sys
from datetime import date
from decimal import Decimal, ROUND_HALF_EVEN, localcontext
from pathlib import Path
from tempfile import NamedTemporaryFile


BACKEND = Path(__file__).resolve().parents[1]
BEGIN = "-- BEGIN GENERATED INSTRUMENT SEED"
END = "-- END GENERATED INSTRUMENT SEED"
ID_RANGE = 1_000_000
SCALE = Decimal("0.00000001")
PERIODS_PER_YEAR = 252
# Names match the Java enums under model.enums, not an external risk rating.
ASSET_CLASSES = {"STOCK", "EQUITY_ETF"}
RISK_LEVELS = {"LOW", "MEDIUM", "HIGH"}


def parse_arguments():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=BACKEND / "seed-data")
    parser.add_argument(
        "--settings", type=Path,
        help="Settings JSON (default: seed-settings.json within --data-dir).",
    )
    parser.add_argument(
        "--seed-file", type=Path, default=BACKEND / "src/main/resources/data.sql",
        help="Existing SQL whose non-generated content must be preserved.",
    )
    parser.add_argument(
        "--output", type=Path,
        help="Alternative output path; defaults to updating --seed-file in place.",
    )
    args = parser.parse_args()
    args.settings = args.settings or args.data_dir / "seed-settings.json"
    args.output = args.output or args.seed_file
    return args


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def sql_string(value):
    return "'" + value.replace("'", "''") + "'"


def decimal_value(value):
    number = Decimal(str(value))
    if not number.is_finite():
        raise ValueError(f"Non-finite number: {value}")
    return number


def fixed_decimal(number):
    return format(number.quantize(SCALE, rounding=ROUND_HALF_EVEN), "f")


def load_observations(data_dir, instrument, anchor):
    metadata = instrument["csv"]
    path = (data_dir / metadata["path"]).resolve()
    if not path.is_relative_to(data_dir.resolve()):
        raise ValueError(f"CSV path escapes data directory: {path}")
    content = path.read_bytes()
    if hashlib.sha256(content).hexdigest() != metadata["sha256"]:
        raise ValueError(f"CSV checksum mismatch: {path.name}")
    observations = []
    for row in csv.DictReader(io.StringIO(content.decode("utf-8"))):
        day = date.fromisoformat(row["date"])
        value = decimal_value(row["adjusted_close"])
        if value <= 0 or day > anchor:
            raise ValueError(f"Invalid adjusted close or date in {path.name}: {day}")
        observations.append((day, value))
    observations.sort(key=lambda observation: observation[0])
    if len(observations) != instrument["row_count"] or len(observations) < 3:
        raise ValueError(f"Unexpected observation count: {path.name}")
    if len({day for day, _ in observations}) != len(observations):
        raise ValueError(f"Duplicate observation dates: {path.name}")
    if (observations[0][0].isoformat() != instrument["first_observation_date"]
            or observations[-1][0].isoformat() != instrument["last_observation_date"]):
        raise ValueError(f"Observation dates do not match manifest: {path.name}")
    return observations


def simulation_parameters(observations, instrument, settings):
    omitted = {date.fromisoformat(day) for day in instrument["skipped_incomplete_dates"]}
    returns = []
    excluded = 0
    for (previous_day, previous), (day, current) in zip(observations, observations[1:]):
        if any(previous_day < missing < day for missing in omitted):
            excluded += 1
            continue
        returns.append((current / previous).ln())
    if len(returns) < 2:
        raise ValueError(f"Insufficient calibration returns: {instrument['file_key']}")
    mean = sum(returns) / len(returns)
    variance = sum((value - mean) ** 2 for value in returns) / (len(returns) - 1)
    volatility = (variance * PERIODS_PER_YEAR).sqrt()
    # Quantize before conversion; JSON stores rates as numbers, not quoted strings.
    return {
        "annualExpectedReturn": float(decimal_value(settings["annualExpectedReturn"])),
        "annualVolatility": float(fixed_decimal(volatility)),
        "periodsPerYear": PERIODS_PER_YEAR,
        "expectedReturnSource": "CURATED_DEMO_ASSUMPTION",
        "volatilitySource": "HISTORICAL_ADJUSTED_CLOSE",
        "calibrationStartDate": observations[0][0].isoformat(),
        "calibrationEndDate": observations[-1][0].isoformat(),
        "calibrationReturnCount": len(returns),
        "excludedIncompleteIntervals": excluded,
        "distributionTreatment": "PROVIDER_ADJUSTED_CLOSE",
        "riskLevelSource": "CURATED_EDUCATIONAL_CLASSIFICATION",
    }


def generate_section(data_dir, manifest, settings):
    instruments = manifest["instruments"]
    keys = [instrument["file_key"] for instrument in instruments]
    if len(set(keys)) != len(keys) or set(keys) != set(settings):
        raise ValueError("Manifest and seed settings must contain the same unique file keys")
    ids = [settings[key]["instrumentId"] for key in keys]
    max_instrument_id = (2**63 - 1 - (ID_RANGE - 1)) // ID_RANGE
    if (any(type(value) is not int or not 0 < value <= max_instrument_id for value in ids)
            or len(set(ids)) != len(ids)):
        raise ValueError("Instrument IDs must be unique positive integers within the observation ID range")
    if manifest["currency"] != "EUR" or manifest["dates_rebased"]:
        raise ValueError("Expected original, non-rebased EUR source snapshots")
    if manifest["instrument_count"] != len(instruments):
        raise ValueError("Manifest instrument count mismatch")

    anchor = date.fromisoformat(manifest["requested_end_date"])
    instrument_sql, configuration_sql, observation_sql = [], [], []
    total_rows = 0
    for instrument in sorted(instruments, key=lambda item: settings[item["file_key"]]["instrumentId"]):
        configuration = settings[instrument["file_key"]]
        instrument_id = configuration["instrumentId"]
        if instrument["asset_class"] not in ASSET_CLASSES:
            raise ValueError(f"Unsupported market asset class: {instrument['asset_class']}")
        if configuration["riskLevel"] not in RISK_LEVELS:
            raise ValueError(f"Unknown risk level: {configuration['riskLevel']}")
        if instrument["currency"] != "EUR" or instrument["verified_currency"] != "EUR":
            raise ValueError(f"Non-EUR instrument: {instrument['file_key']}")
        observations = load_observations(data_dir, instrument, anchor)
        if len(observations) >= ID_RANGE:
            raise ValueError(f"Observation ID range exhausted: {instrument['file_key']}")
        total_rows += len(observations)
        history_description = (
            "Adjusted-close-based total-return proxy normalized to 100; dimensionless index, "
            "not an executable EUR price. Includes provider split/distribution adjustments; "
            "do not add dividends again. Historical demo replay with original dates retained; "
            f"display dates shifted from shared anchor {anchor} to initialization date. "
            "Not actual current market data; shifted dates do not preserve exchange weekdays. "
            "Source is not independently audited; missing sessions are not interpolated."
        )
        values = [
            str(instrument_id), sql_string(instrument["name"]),
            sql_string(configuration["description"]), sql_string(instrument["asset_class"]),
            "'EUR'", sql_string(configuration["riskLevel"]), "'TOTAL_RETURN_INDEX'",
            "'Yahoo Finance'", sql_string(history_description), "TRUE",
        ]
        instrument_sql.append(
            "INSERT INTO instrument (id, name, description, asset_class, currency, risk_level, "
            "history_value_type, history_source, history_description, history_rebased) VALUES ("
            + ", ".join(values) + ");"
        )
        parameters = simulation_parameters(observations, instrument, configuration)
        parameters_json = json.dumps(parameters, sort_keys=True, separators=(",", ":"), allow_nan=False)
        configuration_sql.append(
            "INSERT INTO simulation_configuration (id, instrument_id, model_key, parameters_json) "
            f"VALUES ({instrument_id}, {instrument_id}, 'GBM', {sql_string(parameters_json)});"
        )
        first_value = observations[0][1]
        rows = []
        for sequence, (day, value) in enumerate(observations, start=1):
            observation_id = instrument_id * ID_RANGE + sequence
            offset = (day - anchor).days
            index = Decimal(100) * value / first_value
            normalized = fixed_decimal(index)
            if not 0 < Decimal(normalized) < Decimal("1e16"):
                raise ValueError(f"Index does not fit NUMERIC(24,8): {instrument['file_key']}, {day}")
            rows.append(
                # Plain date arithmetic works on both H2 and PostgreSQL.
                f"    ({observation_id}, {instrument_id}, CURRENT_DATE {'-' if offset < 0 else '+'} {abs(offset)}, "
                f"DATE '{day.isoformat()}', {normalized})"
            )
        observation_sql.append(
            "INSERT INTO historical_observation "
            "(id, instrument_id, observation_date, original_date, observation_value) VALUES\n"
            + ",\n".join(rows) + ";"
        )
    if total_rows != manifest["total_observations"]:
        raise ValueError("Total observation count does not match manifest")
    header = [
        BEGIN,
        "-- Generated by backend/scripts/generate_seed.py; edit seed-settings.json instead.",
        "-- Real historical inputs rebased for a demo; not synthetic source history or current prices.",
        "-- Index levels are dimensionless; EUR is the investment currency.",
        "-- Returns and risk labels are educational assumptions, not forecasts or official ratings.",
        "-- Third-party data rights are NOT VERIFIED; see backend/seed-data/README.md.",
        f"-- Shared source date anchor: {anchor}.",
        f"-- Records: {len(instruments)} instruments, {len(instruments)} configurations, {total_rows} observations.",
    ]
    return "\n".join([
        *header, "", "-- Instruments", *instrument_sql, "",
        "-- Simulation configurations", *configuration_sql, "",
        "-- Historical performance indices", "\n\n".join(observation_sql), END,
    ]), total_rows


def replace_generated_section(existing, section):
    lines = existing.splitlines(keepends=True)
    begins = [index for index, line in enumerate(lines) if line.strip() == BEGIN]
    ends = [index for index, line in enumerate(lines) if line.strip() == END]
    if not begins and not ends:
        separator = "\n" if existing.endswith("\n") else "\n\n"
        return existing + (separator if existing else "") + section + "\n"
    if len(begins) != 1 or len(ends) != 1 or begins[0] >= ends[0]:
        raise ValueError("Malformed or ambiguous generated seed markers; SQL left unchanged")
    ending = "\r\n" if lines[ends[0]].endswith("\r\n") else "\n" if lines[ends[0]].endswith("\n") else ""
    return "".join(lines[:begins[0]]) + section + ending + "".join(lines[ends[0] + 1:])


def write_atomic(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with NamedTemporaryFile(mode="w", encoding="utf-8", newline="", dir=path.parent,
                                prefix=f".{path.name}.", suffix=".tmp", delete=False) as stream:
            temporary = Path(stream.name)
            stream.write(text)
        temporary.chmod(path.stat().st_mode & 0o777 if path.exists() else 0o644)
        os.replace(temporary, path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def main():
    args = parse_arguments()
    manifest = read_json(args.data_dir / "manifest.json")
    settings = read_json(args.settings)
    # Preserve exact line endings outside the generated section.
    existing = args.seed_file.read_bytes().decode("utf-8")
    with localcontext() as context:
        context.prec = 40
        context.rounding = ROUND_HALF_EVEN
        section, count = generate_section(args.data_dir, manifest, settings)
    result = replace_generated_section(existing, section)
    output = args.output.resolve()
    if output.is_relative_to(args.data_dir.resolve()) or output == args.settings.resolve():
        raise ValueError("Output must not overwrite source snapshots or seed settings")
    write_atomic(args.output, result)
    print(f"Generated {manifest['instrument_count']} instruments, {manifest['instrument_count']} configurations, "
          f"and {count} observations in {args.output}")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError, ArithmeticError) as error:
        print(f"Seed generation failed: {error}", file=sys.stderr)
        sys.exit(1)
