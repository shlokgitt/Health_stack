"""
Stock-out risk calculation.

Implements the formula from the project plan doc (Section 6.2):
    days_remaining ≈ current_stock / average_daily_consumption
    risk = HIGH/CRITICAL if days_remaining is low relative to supplier lead time

This is intentionally simple and explainable - a good baseline before
(optionally) layering a trained classifier on top using the historical
consumption.csv data for richer features (seasonality, trend, etc).
"""

from dataclasses import dataclass


@dataclass
class StockoutRisk:
    days_remaining: float
    risk_level: str
    stockout_probability: float


def calculate_stockout_risk(
    current_stock: float,
    avg_daily_consumption: float,
    supplier_lead_time_days: int = 5,
) -> StockoutRisk:
    """
    Basic, explainable stock-out risk estimate.

    days_remaining < lead_time        -> CRITICAL (will run out before resupply arrives)
    days_remaining < 2 * lead_time    -> HIGH
    days_remaining < 3 * lead_time    -> WARNING
    otherwise                          -> LOW
    """
    if avg_daily_consumption <= 0:
        return StockoutRisk(days_remaining=float("inf"), risk_level="LOW", stockout_probability=0.0)

    days_remaining = current_stock / avg_daily_consumption

    if days_remaining < supplier_lead_time_days:
        risk_level = "CRITICAL"
        probability = 0.9
    elif days_remaining < 2 * supplier_lead_time_days:
        risk_level = "HIGH"
        probability = 0.65
    elif days_remaining < 3 * supplier_lead_time_days:
        risk_level = "WARNING"
        probability = 0.35
    else:
        risk_level = "LOW"
        probability = 0.05

    return StockoutRisk(
        days_remaining=round(days_remaining, 1),
        risk_level=risk_level,
        stockout_probability=probability,
    )


if __name__ == "__main__":
    # Matches the worked example in the plan doc
    result = calculate_stockout_risk(current_stock=80, avg_daily_consumption=25, supplier_lead_time_days=7)
    print(result)
    # Expect: days_remaining ~3.2, risk_level CRITICAL
