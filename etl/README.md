# SHMS ETL Module

This module contains the SHMS analytics ETL pipeline and supporting tests.

## What It Does

- Extracts source data from SHMS transactional tables.
- Transforms raw data into analytics datasets.
- Loads analytics datasets using transactional, idempotent upserts.
- Supports both incremental and full refresh execution modes.

## Pipeline Files

- `dags/shms_daily_etl.py`: Airflow DAG definition.
- `scripts/extract.py`: Extract stage with incremental watermarks.
- `scripts/transform.py`: Transform stage with schema checks.
- `scripts/load.py`: Transactional upsert load stage.
- `scripts/config.py`: Environment/config management.
- `scripts/validation.py`: Input and output schema validation helpers.
- `scripts/state.py`: ETL state persistence.
- `schema.sql`: Analytics table schema.

## Environment Variables

Either set `ETL_DB_URL` or provide the full DB variable set.

Required when `ETL_DB_URL` is not set:
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

When ETL falls back to `DB_*`, credentials are URL-encoded automatically before building the PostgreSQL URI.
Do not store a separate URL-encoded password variable.

Optional:
- `ETL_MODE`: `incremental` (default) or `full_refresh`
- `ETL_RAW_DIR`: defaults to `etl/data/raw`
- `ETL_PROCESSED_DIR`: defaults to `etl/data/processed`
- `ETL_STATE_FILE`: defaults to `etl/state/etl_state.json`
- `ETL_SCHEMA_FILE`: defaults to `etl/schema.sql`
- `ETL_LOG_LEVEL`: defaults to `INFO`
- `ETL_DB_RETRY_ATTEMPTS`: defaults to `3`
- `ETL_RETRY_DELAY_SECONDS`: defaults to `2`

## Execution

Run stage-by-stage locally:

```bash
python etl/scripts/extract.py
python etl/scripts/transform.py
python etl/scripts/load.py
```

Run the DAG in Airflow:

- DAG ID: `shms_daily_analytics_etl`
- Schedule: `0 0 * * *` (daily at midnight)
- Retries: configured in DAG default args

## Loading Modes

### Incremental

- Extract uses per-table watermark state from `ETL_STATE_FILE`.
- If a table has an incremental column (`updated_at`, `created_at`, `bill_date`, `appointment_date`, `admission_date`) and an existing watermark, only newer rows are extracted.
- Load uses upsert (`ON CONFLICT`) to keep writes idempotent.

### Full Refresh

- Extract reads complete source tables.
- Load truncates analytics tables inside a transaction and reloads all transformed rows.

## Idempotency and Transactions

- Load stage uses a single DB transaction per run (`engine.begin()`).
- Rows are written with `INSERT ... ON CONFLICT DO UPDATE`.
- Re-running the same processed files does not create duplicates.

## Validation and Reliability

- Environment variables are validated in `ETLConfig.from_env`.
- Input and output schemas are validated in transform and load stages.
- DB reads/writes include retry handling with configurable attempts and delay.
- Structured logging is provided per stage.

## Sample Data

Sample raw data for local transformation tests is in:
- `sample_data/raw`

Generated sample processed outputs are written to:
- `sample_data/processed`

## Tests

Tests are in `etl/tests` and include:
- DAG syntax parse check (`test_dag_parse.py`)
- Config validation (`test_config.py`)
- Transform output validation (`test_transform.py`)
- Load upsert SQL behavior (`test_load.py`)

Run tests:

```bash
python -m pytest etl/tests -q
```
