import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import quote


PROJECT_ROOT = Path(__file__).resolve().parents[2]


def _build_postgres_url_from_env(db_name_override=None):
    user = quote(os.getenv('DB_USER', 'postgres'), safe='')
    password = quote(os.getenv('DB_PASSWORD', 'postgres'), safe='')
    host = os.getenv('DB_HOST', 'localhost')
    port = os.getenv('DB_PORT', '5432')
    db_name = quote(db_name_override or os.getenv('DB_NAME', 'postgres'), safe='')
    return f'postgresql://{user}:{password}@{host}:{port}/{db_name}'


@dataclass(frozen=True)
class ETLConfig:
    source_db_url: str
    target_db_url: str
    raw_dir: Path
    processed_dir: Path
    state_file: Path
    schema_file: Path
    mode: str
    log_level: str
    db_retry_attempts: int
    retry_delay_seconds: int

    DEFAULT_MODE = 'incremental'
    VALID_MODES = {'incremental', 'full_refresh'}

    @classmethod
    def from_env(cls, mode=None):
        source_db_url = os.getenv('ETL_SOURCE_DB_URL') or os.getenv('ETL_DB_URL')
        target_db_url = os.getenv('ETL_TARGET_DB_URL') or os.getenv('ETL_DB_URL')
        if not source_db_url or not target_db_url:
            required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
            missing = [name for name in required if not os.getenv(name)]
            if missing:
                raise ValueError(
                    f"Missing required environment variables: {', '.join(missing)}. "
                    'Set ETL_SOURCE_DB_URL/ETL_TARGET_DB_URL (or ETL_DB_URL) or provide DB_* variables.'
                )
            fallback_url = _build_postgres_url_from_env()
            if not source_db_url:
                source_db_url = fallback_url
            if not target_db_url:
                target_db_url = fallback_url

        configured_mode = mode or os.getenv('ETL_MODE', cls.DEFAULT_MODE)
        configured_mode = configured_mode.strip().lower()
        if configured_mode not in cls.VALID_MODES:
            raise ValueError(
                f"Invalid ETL_MODE '{configured_mode}'. Allowed values: {', '.join(sorted(cls.VALID_MODES))}"
            )

        raw_dir = _resolve_path(os.getenv('ETL_RAW_DIR', 'etl/data/raw'))
        processed_dir = _resolve_path(os.getenv('ETL_PROCESSED_DIR', 'etl/data/processed'))
        state_file = _resolve_path(os.getenv('ETL_STATE_FILE', 'etl/state/etl_state.json'))
        schema_file = _resolve_path(os.getenv('ETL_SCHEMA_FILE', 'etl/schema.sql'))

        return cls(
            source_db_url=source_db_url,
            target_db_url=target_db_url,
            raw_dir=raw_dir,
            processed_dir=processed_dir,
            state_file=state_file,
            schema_file=schema_file,
            mode=configured_mode,
            log_level=os.getenv('ETL_LOG_LEVEL', 'INFO').upper(),
            db_retry_attempts=int(os.getenv('ETL_DB_RETRY_ATTEMPTS', '3')),
            retry_delay_seconds=int(os.getenv('ETL_RETRY_DELAY_SECONDS', '2')),
        )

    @property
    def db_url(self):
        return self.target_db_url


def _resolve_path(path_value):
    path = Path(path_value)
    if path.is_absolute():
        return path
    return PROJECT_ROOT / path
