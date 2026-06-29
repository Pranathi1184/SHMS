import time

import pandas as pd
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import NoSuchTableError, SQLAlchemyError

try:
    from scripts.config import ETLConfig
    from scripts.logging_utils import get_logger
    from scripts.state import load_state, save_state
except ModuleNotFoundError:
    from etl.scripts.config import ETLConfig
    from etl.scripts.logging_utils import get_logger
    from etl.scripts.state import load_state, save_state


TABLES = [
    'patients',
    'appointments',
    'bills',
    'medicines',
    'admissions',
    'prescription_items',
]

TABLE_FALLBACK_COLUMNS = {
    'patients': ['created_at'],
    'appointments': ['id', 'patient_id', 'doctor_id', 'appointment_date', 'start_time', 'created_at', 'status'],
    'bills': ['bill_date', 'payment_status', 'net_amount'],
    'medicines': ['id', 'name', 'quantity', 'reorder_level', 'updated_at'],
    'admissions': ['admission_date', 'discharge_date'],
    'prescription_items': ['medicine_id', 'quantity', 'created_at'],
}

INCREMENTAL_CANDIDATES = [
    'updated_at',
    'created_at',
    'bill_date',
    'appointment_date',
    'admission_date',
]


def extract_data(mode=None):
    config = ETLConfig.from_env(mode)
    logger = get_logger('etl.extract', config.log_level)
    config.raw_dir.mkdir(parents=True, exist_ok=True)
    config.state_file.parent.mkdir(parents=True, exist_ok=True)

    engine = create_engine(config.source_db_url)
    state = load_state(config.state_file)
    extraction_meta = {'mode': config.mode, 'tables': {}}

    try:
        inspector = inspect(engine)
        for table in TABLES:
            logger.info('Extracting table: %s', table)
            output_path = config.raw_dir / f'{table}.csv'

            try:
                table_columns = {col['name'] for col in inspector.get_columns(table)}
            except NoSuchTableError:
                fallback_columns = TABLE_FALLBACK_COLUMNS.get(table, [])
                pd.DataFrame(columns=fallback_columns).to_csv(output_path, index=False)
                extraction_meta['tables'][table] = {
                    'row_count': 0,
                    'incremental_column': None,
                    'watermark': None,
                    'missing_source_table': True,
                }
                logger.warning('Source table %s is missing. Wrote empty extract file.', table)
                continue

            incremental_column = _pick_incremental_column(table_columns)
            watermark = state.get('watermarks', {}).get(table)

            query, params = _build_query(table, incremental_column, watermark, config.mode)
            df = _read_sql_with_retries(
                engine,
                query,
                params,
                config.db_retry_attempts,
                config.retry_delay_seconds,
                logger,
            )

            df.to_csv(output_path, index=False)

            latest_watermark = watermark
            if incremental_column and not df.empty:
                latest_watermark = str(df[incremental_column].max())
                state.setdefault('watermarks', {})[table] = latest_watermark

            extraction_meta['tables'][table] = {
                'row_count': int(len(df.index)),
                'incremental_column': incremental_column,
                'watermark': latest_watermark,
            }
            logger.info('Extracted %s rows from %s', len(df.index), table)

        save_state(config.state_file, state)
        logger.info('Extraction complete.')
        return extraction_meta
    finally:
        engine.dispose()


def _pick_incremental_column(table_columns):
    for candidate in INCREMENTAL_CANDIDATES:
        if candidate in table_columns:
            return candidate
    return None


def _build_query(table, incremental_column, watermark, mode):
    if mode == 'incremental' and incremental_column and watermark:
        return (
            text(
                f"SELECT * FROM {table} "
                f"WHERE {incremental_column} > :watermark ORDER BY {incremental_column}"
            ),
            {'watermark': watermark},
        )
    return text(f'SELECT * FROM {table}'), {}


def _read_sql_with_retries(engine, query, params, max_attempts, delay_seconds, logger):
    last_error = None
    for attempt in range(1, max_attempts + 1):
        try:
            with engine.connect() as conn:
                return pd.read_sql(query, conn, params=params)
        except SQLAlchemyError as error:
            last_error = error
            logger.warning('Read attempt %s/%s failed: %s', attempt, max_attempts, error)
            if attempt < max_attempts:
                time.sleep(delay_seconds)
    raise last_error


if __name__ == '__main__':
    extract_data()
