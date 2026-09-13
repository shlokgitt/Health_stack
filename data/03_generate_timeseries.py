"""
Step 3: Generate synthetic daily time series for each PHC:
  - patient_visits.csv  : daily footfall per PHC
  - consumption.csv     : daily medicine consumption per PHC per medicine
  - inventory.csv        : daily stock snapshot per PHC per medicine

Design principles (this is what makes it "realistic" rather than random):
  1. Footfall has a base level per PHC (varies by facility size), a weekly
     pattern (Mondays busier), slow seasonal drift, and occasional random
     spikes (simulated local outbreak / emergency events).
  2. Medicine consumption is DERIVED FROM footfall (demand_per_100_patients
     from medicines.csv) plus small independent noise — not generated
     independently. This causal link is what your forecasting model will
     actually learn.
  3. Stock depletes daily by consumption, and refills after a simulated
     supplier lead time once it crosses a reorder threshold — this creates
     realistic stock-out risk patterns (some medicines will legitimately
     run low in the data), which is what your stock-out prediction model
     needs to train on.
"""

import pandas as pd
import numpy as np
from datetime import date, timedelta

np.random.seed(7)

N_DAYS = 180  # ~6 months of history
START_DATE = date(2026, 3, 1)

phcs = pd.read_csv("phcs.csv")
medicines = pd.read_csv("medicines.csv")

dates = [START_DATE + timedelta(days=i) for i in range(N_DAYS)]

visit_rows = []
consumption_rows = []
inventory_rows = []

for _, phc in phcs.iterrows():
    phc_id = phc["phc_id"]

    # Base daily footfall scaled loosely to facility size (beds/doctors)
    base_footfall = 30 + phc["beds"] * 5 + phc["doctors"] * 10
    base_footfall += np.random.randint(-5, 15)  # facility-specific variation

    # Pick 1-2 random "outbreak" windows in the 180 days for this PHC
    n_spikes = np.random.choice([0, 1, 2], p=[0.4, 0.4, 0.2])
    spike_windows = []
    for _ in range(n_spikes):
        spike_start = np.random.randint(20, N_DAYS - 15)
        spike_len = np.random.randint(5, 12)
        spike_windows.append((spike_start, spike_start + spike_len))

    footfall_series = []
    for day_idx, d in enumerate(dates):
        weekday = d.weekday()  # 0=Monday
        weekly_factor = 1.25 if weekday == 0 else (0.7 if weekday == 6 else 1.0)
        seasonal_factor = 1.0 + 0.1 * np.sin(2 * np.pi * day_idx / 180)

        spike_factor = 1.0
        for (s, e) in spike_windows:
            if s <= day_idx <= e:
                spike_factor = 2.2  # ~+120% footfall during an "outbreak"
                break

        noise = np.random.normal(1.0, 0.08)
        footfall = max(5, int(base_footfall * weekly_factor * seasonal_factor * spike_factor * noise))
        footfall_series.append(footfall)

        visit_rows.append({
            "date": d.isoformat(),
            "phc_id": phc_id,
            "patient_count": footfall,
            "beds_occupied": min(phc["beds"], max(0, int(footfall * 0.06 * spike_factor))),
        })

    # --- Consumption + inventory, per medicine, driven by footfall_series ---
    for _, med in medicines.iterrows():
        med_id = med["medicine_id"]
        demand_rate = med["demand_per_100_patients"] / 100.0

        # Starting stock: enough for roughly 20-30 days of average demand
        avg_daily_demand = base_footfall * demand_rate
        current_stock = int(avg_daily_demand * np.random.randint(20, 30))
        reorder_threshold = int(avg_daily_demand * 5)  # reorder when ~5 days remain
        max_stock = int(avg_daily_demand * 35)
        supplier_lead_time = np.random.randint(3, 8)  # days

        pending_delivery = None  # (arrival_day_idx, quantity)

        for day_idx, footfall in enumerate(footfall_series):
            # Apply any delivery arriving today
            if pending_delivery is not None and pending_delivery[0] == day_idx:
                current_stock = min(max_stock, current_stock + pending_delivery[1])
                pending_delivery = None

            # Consumption driven by today's footfall + small independent noise
            consumption = max(0, int(footfall * demand_rate * np.random.normal(1.0, 0.15)))
            consumption = min(consumption, current_stock)  # can't consume more than available
            current_stock -= consumption

            consumption_rows.append({
                "date": dates[day_idx].isoformat(),
                "phc_id": phc_id,
                "medicine_id": med_id,
                "quantity_used": consumption,
            })
            inventory_rows.append({
                "date": dates[day_idx].isoformat(),
                "phc_id": phc_id,
                "medicine_id": med_id,
                "stock": current_stock,
                "minimum_stock": reorder_threshold,
                "maximum_stock": max_stock,
            })

            # Trigger reorder if stock crosses threshold and nothing pending
            if current_stock <= reorder_threshold and pending_delivery is None:
                order_qty = max_stock - current_stock
                pending_delivery = (day_idx + supplier_lead_time, order_qty)

visits_df = pd.DataFrame(visit_rows)
consumption_df = pd.DataFrame(consumption_rows)
inventory_df = pd.DataFrame(inventory_rows)

visits_df.to_csv("patient_visits.csv", index=False)
consumption_df.to_csv("consumption.csv", index=False)
inventory_df.to_csv("inventory.csv", index=False)

print(f"Wrote patient_visits.csv: {len(visits_df)} rows")
print(f"Wrote consumption.csv: {len(consumption_df)} rows")
print(f"Wrote inventory.csv: {len(inventory_df)} rows")

# Quick sanity check: show a stock-out-risk example
print("\nSample — Insulin stock trend for PHC001 (last 15 days):")
sample = inventory_df[(inventory_df.phc_id == "PHC001") & (inventory_df.medicine_id == "MED004")].tail(15)
print(sample.to_string(index=False))
