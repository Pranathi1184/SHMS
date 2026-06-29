import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from etl.scripts.config import ETLConfig


def test_config_requires_db_env(monkeypatch):
    for key in ['ETL_DB_URL', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']:
        monkeypatch.delenv(key, raising=False)

    try:
        ETLConfig.from_env()
    except ValueError as error:
        assert 'Missing required environment variables' in str(error)
        return

    raise AssertionError('Expected ValueError when DB config is missing')


def test_config_accepts_valid_mode(monkeypatch):
    monkeypatch.setenv('ETL_DB_URL', 'postgresql://x:y@localhost:5432/shms')
    config = ETLConfig.from_env(mode='full_refresh')
    assert config.mode == 'full_refresh'
