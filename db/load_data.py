"""
Load the cleaned CSVs in /data into the Postgres database defined by
db/schema.sql. Run this after creating the database and applying the
schema:

    psql "$DATABASE_URL" -f db/schema.sql
    python db/load_data.py

Requires: pip install psycopg2-binary pandas python-dotenv
"""

import os
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def load_table(conn, csv_name, table, columns):
    df = pd.read_csv(os.path.join(DATA_DIR, csv_name))
    df = df[columns]
    rows = [tuple(r) for r in df.itertuples(index=False, name=None)]
    cols_sql = ", ".join(columns)
    with conn.cursor() as cur:
        execute_values(
            cur,
            f"INSERT INTO {table} ({cols_sql}) VALUES %s ON CONFLICT DO NOTHING",
            rows,
        )
    conn.commit()
    print(f"Loaded {len(rows)} rows into {table}")


def main():
    conn = psycopg2.connect(DATABASE_URL)

    load_table(conn, "phcs.csv", "phc",
               ["phc_id", "name", "district", "state", "subdistrict",
                "latitude", "longitude", "beds", "doctors", "nurses"])

    load_table(conn, "medicines.csv", "medicine",
               ["medicine_id", "name", "category", "unit"])

    load_table(conn, "patient_visits.csv", "patient_visit",
               ["date", "phc_id", "patient_count", "beds_occupied"])

    load_table(conn, "consumption.csv", "consumption",
               ["date", "phc_id", "medicine_id", "quantity_used"])

    inv_df = pd.read_csv(os.path.join(DATA_DIR, "inventory.csv"))
    inv_df = inv_df.rename(columns={"stock": "current_stock"})
    rows = [tuple(r) for r in inv_df[
        ["date", "phc_id", "medicine_id", "current_stock",
         "minimum_stock", "maximum_stock"]
    ].itertuples(index=False, name=None)]
    with conn.cursor() as cur:
        execute_values(
            cur,
            "INSERT INTO inventory (date, phc_id, medicine_id, current_stock, "
            "minimum_stock, maximum_stock) VALUES %s ON CONFLICT DO NOTHING",
            rows,
        )
    conn.commit()
    print(f"Loaded {len(rows)} rows into inventory")

    conn.close()
    print("\nDone. All CSVs loaded into Postgres.")


if __name__ == "__main__":
    main()
