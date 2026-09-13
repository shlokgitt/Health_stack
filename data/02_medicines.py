"""
Step 2: Medicine master list.

A small, realistic set of essential medicines commonly stocked at Indian
PHCs (aligned with the National List of Essential Medicines / typical PHC
formularies mentioned in your briefing doc). Each medicine gets a baseline
daily-demand-per-100-patients figure, used to drive consumption generation
in step 3 — this is what makes consumption realistically tied to footfall
rather than random.
"""

import pandas as pd

medicines = [
    # name, category, unit, demand_per_100_patients (avg units consumed per 100 patient visits)
    ("Paracetamol", "Analgesic", "tablet", 60),
    ("ORS", "Rehydration", "sachet", 25),
    ("Amoxicillin", "Antibiotic", "capsule", 20),
    ("Insulin", "Chronic care", "vial", 4),
    ("Metformin", "Chronic care", "tablet", 15),
    ("Iron Folic Acid", "Supplement", "tablet", 18),
    ("Cough Syrup", "Respiratory", "bottle", 8),
    ("Ciprofloxacin", "Antibiotic", "tablet", 10),
    ("Antacid", "Gastro", "tablet", 22),
    ("Antiseptic Solution", "First aid", "bottle", 6),
]

df = pd.DataFrame(medicines, columns=["name", "category", "unit", "demand_per_100_patients"])
df.insert(0, "medicine_id", ["MED" + str(i + 1).zfill(3) for i in range(len(df))])
df.to_csv("medicines.csv", index=False)
print(f"Wrote medicines.csv with {len(df)} medicines.")
print(df.to_string())
