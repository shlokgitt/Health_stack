"""
AI service entrypoint. Run with:
    uvicorn main:app --reload --port 8000

Exposes the endpoints the Node backend proxies to (see plan doc Section 15).
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from fastapi import FastAPI
from pydantic import BaseModel

from stockout.risk import calculate_stockout_risk
from gemini.gemini_service import explain_recommendation, translate_alert

app = FastAPI(title="Health Resilience AI Service")


@app.get("/")
def root():
    return {"status": "ok", "service": "health-resilience-ai"}


class StockoutRequest(BaseModel):
    phc_id: str
    medicine_id: str
    current_stock: float
    avg_daily_consumption: float
    supplier_lead_time_days: int = 5


@app.post("/predictions/stockout")
def predict_stockout(req: StockoutRequest):
    result = calculate_stockout_risk(
        current_stock=req.current_stock,
        avg_daily_consumption=req.avg_daily_consumption,
        supplier_lead_time_days=req.supplier_lead_time_days,
    )
    return {
        "phc_id": req.phc_id,
        "medicine_id": req.medicine_id,
        "days_remaining": result.days_remaining,
        "risk_level": result.risk_level,
        "stockout_probability": result.stockout_probability,
    }


class RecommendationExplainRequest(BaseModel):
    source_phc: str
    destination_phc: str
    medicine: str
    quantity: int
    distance_km: float
    shortage_risk_pct: float
    translate_to: str | None = None  # e.g. "Hindi" - optional


@app.post("/recommendations/explain")
def explain(req: RecommendationExplainRequest):
    explanation = explain_recommendation(
        source_phc=req.source_phc,
        destination_phc=req.destination_phc,
        medicine=req.medicine,
        quantity=req.quantity,
        distance_km=req.distance_km,
        shortage_risk_pct=req.shortage_risk_pct,
    )
    result = {"explanation_en": explanation}
    if req.translate_to:
        result[f"explanation_{req.translate_to.lower()}"] = translate_alert(explanation, req.translate_to)
    return result


# Demand forecast endpoint - wire up once ai/forecasting/forecast.py's
# trained model is saved/loaded (see that file's train() function).
@app.get("/forecasts/{phc_id}")
def get_forecast(phc_id: str):
    return {"error": "not yet implemented - train and load a model from ai/forecasting/forecast.py"}
