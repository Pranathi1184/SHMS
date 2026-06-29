from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import sys
import os

# Add scripts path to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from scripts.config import ETLConfig


def run_extract(mode):
    from scripts.extract import extract_data
    return extract_data(mode=mode)


def run_transform(mode):
    from scripts.transform import transform_data
    return transform_data(mode=mode)


def run_load(mode):
    from scripts.load import load_data
    return load_data(mode=mode)


def run_predict(mode):
    from scripts.predict import run_predictions
    return run_predictions(mode=mode)

default_args = {
    'owner': 'shms_admin',
    'depends_on_past': False,
    'start_date': datetime(2026, 6, 23),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

etl_mode = os.getenv('ETL_MODE', ETLConfig.DEFAULT_MODE)

with DAG(
    'shms_daily_analytics_etl',
    default_args=default_args,
    description='Daily ETL pipeline for SHMS analytics',
    schedule='0 0 * * *',
    catchup=False,
    max_active_runs=1,
    tags=['shms', 'etl', 'analytics'],
) as dag:

    extract_task = PythonOperator(
        task_id='extract_data',
        python_callable=run_extract,
        op_kwargs={'mode': etl_mode},
    )

    transform_task = PythonOperator(
        task_id='transform_data',
        python_callable=run_transform,
        op_kwargs={'mode': etl_mode},
    )

    load_task = PythonOperator(
        task_id='load_data',
        python_callable=run_load,
        op_kwargs={'mode': etl_mode},
    )

    predict_task = PythonOperator(
        task_id='run_predictions',
        python_callable=run_predict,
        op_kwargs={'mode': etl_mode},
    )

    extract_task >> transform_task >> load_task >> predict_task
