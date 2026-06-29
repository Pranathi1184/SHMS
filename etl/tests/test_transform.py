import sys
from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from etl.scripts.transform import transform_data


def test_transform_generates_expected_outputs(tmp_path, monkeypatch):
    raw_dir = tmp_path / 'raw'
    processed_dir = tmp_path / 'processed'
    raw_dir.mkdir(parents=True, exist_ok=True)

    sample_raw = PROJECT_ROOT / 'etl' / 'sample_data' / 'raw'
    for file_path in sample_raw.glob('*.csv'):
        (raw_dir / file_path.name).write_text(file_path.read_text(encoding='utf-8'), encoding='utf-8')

    monkeypatch.setenv('ETL_DB_URL', 'postgresql://x:y@localhost:5432/shms')
    monkeypatch.setenv('ETL_RAW_DIR', str(raw_dir))
    monkeypatch.setenv('ETL_PROCESSED_DIR', str(processed_dir))
    monkeypatch.setenv('ETL_STATE_FILE', str(tmp_path / 'state.json'))
    monkeypatch.setenv('ETL_SCHEMA_FILE', str(PROJECT_ROOT / 'etl' / 'schema.sql'))

    result = transform_data(mode='incremental')

    assert result['daily_revenue.csv'] == 2
    assert (processed_dir / 'daily_revenue.csv').exists()
    assert (processed_dir / 'patient_trends.csv').exists()
    assert (processed_dir / 'popular_medicines.csv').exists()
    assert (processed_dir / 'average_stay_duration.csv').exists()

    daily_revenue = pd.read_csv(processed_dir / 'daily_revenue.csv')
    assert set(daily_revenue.columns) == {'date', 'total_revenue', 'total_bills'}


def test_transform_missing_required_file_raises(tmp_path, monkeypatch):
    raw_dir = tmp_path / 'raw'
    processed_dir = tmp_path / 'processed'
    raw_dir.mkdir(parents=True, exist_ok=True)

    monkeypatch.setenv('ETL_DB_URL', 'postgresql://x:y@localhost:5432/shms')
    monkeypatch.setenv('ETL_RAW_DIR', str(raw_dir))
    monkeypatch.setenv('ETL_PROCESSED_DIR', str(processed_dir))
    monkeypatch.setenv('ETL_STATE_FILE', str(tmp_path / 'state.json'))
    monkeypatch.setenv('ETL_SCHEMA_FILE', str(PROJECT_ROOT / 'etl' / 'schema.sql'))

    try:
        transform_data(mode='incremental')
    except FileNotFoundError as error:
        assert 'Missing required raw files' in str(error)
        return

    raise AssertionError('Expected FileNotFoundError for missing raw files')
