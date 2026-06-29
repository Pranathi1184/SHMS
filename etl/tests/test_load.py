import sys
from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from etl.scripts.load import _upsert_dataframe


class DummyConnection:
    def __init__(self):
        self.executed = []

    def execute(self, statement, rows):
        self.executed.append((statement, rows))


class DummyConfig:
    db_retry_attempts = 1
    retry_delay_seconds = 0


class DummyLogger:
    def info(self, *args, **kwargs):
        return None

    def warning(self, *args, **kwargs):
        return None


def test_upsert_dataframe_executes_idempotent_insert():
    connection = DummyConnection()
    df = pd.DataFrame(
        [
            {'date': '2026-06-01', 'total_revenue': 100.0, 'total_bills': 2},
            {'date': '2026-06-02', 'total_revenue': 200.0, 'total_bills': 1},
        ]
    )

    inserted = _upsert_dataframe(
        connection=connection,
        dataframe=df,
        table_name='daily_revenue',
        key_columns=['date'],
        update_columns=['total_revenue', 'total_bills'],
        config=DummyConfig(),
        logger=DummyLogger(),
    )

    assert inserted == 2
    assert len(connection.executed) == 1

    statement, rows = connection.executed[0]
    sql_text = str(statement)
    assert 'ON CONFLICT (date) DO UPDATE' in sql_text
    assert rows[0]['date'] == '2026-06-01'
