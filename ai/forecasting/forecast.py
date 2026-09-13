"""
Medicine demand forecasting.

Trains a simple XGBoost regressor on the consumption.csv + patient_visits.csv
data (per the plan doc, Section 6.1) to predict next-day medicine consumption
per PHC per medicine. This is a baseline - good enough to demo the pipeline
end-to-end; feature engineering (day-of-week, rolling averages, seasonality)
can be extended incrementally.

Run directly to train and save a model:
    python forecast.py
"""

import os
import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")


def build_features():
    consumption = pd.read_csv(os.path.join(DATA_DIR, "consumption.csv"), parse_dates=["date"])
    visits = pd.read_csv(os.path.join(DATA_DIR, "patient_visits.csv"), parse_dates=["date"])

    df = consumption.merge(visits, on=["date", "phc_id"], how="left")
    df = df.sort_values(["phc_id", "medicine_id", "date"])

    df["day_of_week"] = df["date"].dt.dayofweek
    df["day_of_year"] = df["date"].dt.dayofyear

    # Rolling 7-day average consumption per phc/medicine as a lag feature
    df["consumption_7d_avg"] = (
        df.groupby(["phc_id", "medicine_id"])["quantity_used"]
        .transform(lambda s: s.shift(1).rolling(7, min_periods=1).mean())
    )
    df["consumption_7d_avg"] = df["consumption_7d_avg"].fillna(df["quantity_used"])

    # Encode phc_id / medicine_id as categorical codes for the model
    df["phc_code"] = df["phc_id"].astype("category").cat.codes
    df["medicine_code"] = df["medicine_id"].astype("category").cat.codes

    return df


def train():
    df = build_features()

    features = ["patient_count", "day_of_week", "day_of_year",
                "consumption_7d_avg", "phc_code", "medicine_code"]
    target = "quantity_used"

    X = df[features]
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = XGBRegressor(n_estimators=200, max_depth=5, learning_rate=0.1, random_state=42)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))

    print(f"Demand forecast model - MAE: {mae:.2f}, RMSE: {rmse:.2f}")
    return model


if __name__ == "__main__":
    train()
