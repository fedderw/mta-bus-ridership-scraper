import pytest
import pandas as pd
from pathlib import Path

from main import (check_for_directories, clean_column_names, data_transform,
                  get_num_days_in_month, load_data, process_data,
                  process_routes, run_node_script, save_data )

@pytest.fixture
def sample_df():
    return pd.DataFrame(
        {
            "A 1": [" a ", " b ", " c "],
            "B": [" d ", " e ", " f "],
            "C": [" g ", " h ", " i "],
        }
    )

@pytest.fixture
def output_df():
    return pd.DataFrame(
        {
            "route": ["CityLink Blue", "80", "80"],
            "date": ["2023-04-01", "2020-02-01", "2020-03-01"],
            "date_end": ["2023-04-30", "2020-02-29", "2020-03-31"],
            "ridership": [300000, 29000, 31000],
            "num_days_in_month": [30, 29, 31],
            "ridership_per_day": [10000, 1000, 1000],
        }
    )

def test_clean_column_names(sample_df):
    result = clean_column_names(sample_df)
    assert list(result.columns) == ["a_1", "b", "c"]

def test_load_data():
    # Assuming you have a test.csv file in your directory
    result = load_data.fn(Path("tests/data/raw/test.csv"))
    assert isinstance(result, pd.DataFrame)

def test_process_routes():
    result = process_routes("CityLink BLUE, CityLink GOLD")
    assert result == "CityLink Blue, CityLink Gold"

def test_get_num_days_in_month():
    result = get_num_days_in_month(pd.to_datetime("2022-02-01"))
    assert result == 28

def test_process_data():
    # Assuming you have a test.csv file in your directory
    df = load_data.fn(Path("tests/data/raw/test.csv"))
    result = process_data.fn(df)
    assert isinstance(result, pd.DataFrame)
    assert list(result.columns) == ["route", "date", "date_end", "ridership", "num_days_in_month", "ridership_per_day"]
    assert result.shape == (3, 6)

def test_save_data(output_df):
    file_path = "test_output.csv"
    save_data.fn(output_df, file_path)
    assert Path(file_path).exists()

def test_check_for_directories():
    # Set tmp_path as the working directory
    check_for_directories.fn()
    assert Path("data/raw").exists()
    assert Path("data/processed").exists()
