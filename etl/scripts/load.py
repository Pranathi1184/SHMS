import time

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

try:
    from scripts.config import ETLConfig
    from scripts.logging_utils import get_logger
    from scripts.validation import ensure_expected_output_schema
except ModuleNotFoundError:
    from etl.scripts.config import ETLConfig
    from etl.scripts.logging_utils import get_logger
    from etl.scripts.validation import ensure_expected_output_schema


TABLES = {
    'daily_revenue.csv': {
        'table': 'daily_revenue',
        'key_columns': ['date'],
        'update_columns': ['total_revenue', 'total_bills'],
    },
    'patient_trends.csv': {
        'table': 'patient_trends',
        'key_columns': ['date'],
        'update_columns': ['new_patients', 'total_appointments'],
    },
    'popular_medicines.csv': {
        'table': 'popular_medicines',
        'key_columns': ['month', 'medicine_name'],
        'update_columns': ['total_quantity_sold', 'total_revenue'],
    },
    'average_stay_duration.csv': {
        'table': 'average_stay_duration',
        'key_columns': ['month'],
        'update_columns': ['avg_days_stay', 'total_discharges'],
    },
    'appointment_features.csv': {
        'table': 'appointment_features',
        'key_columns': ['appointment_id'],
        'update_columns': [
            'score_date',
            'patient_id',
            'doctor_id',
            'day_of_week',
            'hour_of_day',
            'lead_time_hours',
            'prior_appointments',
            'prior_cancellations',
        ],
    },
    'inventory_features.csv': {
        'table': 'inventory_features',
        'key_columns': ['medicine_id'],
        'update_columns': [
            'month',
            'medicine_name',
            'quantity_on_hand',
            'reorder_level',
            'recent_demand',
        ],
    },
}


def load_data(mode=None):
    config = ETLConfig.from_env(mode)
    logger = get_logger('etl.load', config.log_level)
    engine = create_engine(config.target_db_url)

    try:
        _ensure_schema(engine, config.schema_file)
        with engine.begin() as connection:
            if config.mode == 'full_refresh':
                _truncate_analytics_tables(connection, logger)

            loaded = {}
            for file_name, meta in TABLES.items():
                dataframe = pd.read_csv(config.processed_dir / file_name)
                ensure_expected_output_schema(dataframe, file_name)
                loaded[file_name] = _upsert_dataframe(
                    connection,
                    dataframe,
                    meta['table'],
                    meta['key_columns'],
                    meta['update_columns'],
                    config,
                    logger,
                )

        logger.info('Loading complete.')
        return loaded
    finally:
        engine.dispose()


def _ensure_schema(engine, schema_file):
    sql_text = schema_file.read_text(encoding='utf-8')
    with engine.begin() as connection:
        connection.execute(text(sql_text))


def _truncate_analytics_tables(connection, logger):
    table_names = sorted({meta['table'] for meta in TABLES.values()})
    for table_name in table_names:
        logger.info('Full refresh: truncating %s', table_name)
        connection.execute(text(f'TRUNCATE TABLE {table_name} RESTART IDENTITY'))


def _upsert_dataframe(connection, dataframe, table_name, key_columns, update_columns, config, logger):
    if dataframe.empty:
        logger.info('No rows to load for %s', table_name)
        return 0

    cols = key_columns + update_columns
    rows = dataframe[cols].to_dict(orient='records')

    insert_cols = ', '.join(cols)
    values_cols = ', '.join(f':{col}' for col in cols)
    conflict_target = ', '.join(key_columns)
    update_clause = ', '.join(f'{col} = EXCLUDED.{col}' for col in update_columns)

    statement = text(
        f'INSERT INTO {table_name} ({insert_cols}) VALUES ({values_cols}) '
        f'ON CONFLICT ({conflict_target}) DO UPDATE SET {update_clause}'
    )

    _execute_with_retries(connection, statement, rows, config.db_retry_attempts, config.retry_delay_seconds, logger)
    logger.info('Upserted %s rows into %s', len(rows), table_name)
    return len(rows)


def _execute_with_retries(connection, statement, rows, max_attempts, delay_seconds, logger):
    last_error = None
    for attempt in range(1, max_attempts + 1):
        try:
            connection.execute(statement, rows)
            return
        except SQLAlchemyError as error:
            last_error = error
            logger.warning('Write attempt %s/%s failed: %s', attempt, max_attempts, error)
            if attempt < max_attempts:
                time.sleep(delay_seconds)
    raise last_error


if __name__ == '__main__':
    load_data()
