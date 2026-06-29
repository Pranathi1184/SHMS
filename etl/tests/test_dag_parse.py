import py_compile
from pathlib import Path


def test_dag_file_parses_without_syntax_error():
    dag_path = Path(__file__).resolve().parents[1] / 'dags' / 'shms_daily_etl.py'
    py_compile.compile(str(dag_path), doraise=True)
