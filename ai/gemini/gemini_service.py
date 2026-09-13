"""
Google Gemini integration - satisfies the hackathon's mandatory GenAI
requirement (see plan doc Section 6a).

Uses the current `google-genai` SDK (the older `google-generativeai`
package is deprecated and no longer receiving updates).

Two functions:
  1. explain_recommendation() - turns a structured transfer recommendation
     into a natural-language explanation for the "AI Recommendation" card.
  2. translate_alert() - localizes alert/summary text into Hindi (or
     another language) for the multilingual requirement.

Requires GEMINI_API_KEY in the environment.
"""

import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
MODEL_NAME = "gemini-2.5-flash"  # fast + cheap, good fit for short generations

_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


def explain_recommendation(source_phc: str, destination_phc: str, medicine: str,
                            quantity: int, distance_km: float, shortage_risk_pct: float) -> str:
    """
    Generates the natural-language "Reasons" text shown on the AI
    Recommendation card (plan doc Section 12, Screen 6).
    """
    if _client is None:
        # Fallback so the app doesn't break in dev without a key configured
        return (f"{destination_phc} has a {shortage_risk_pct}% shortage risk for {medicine}. "
                f"{source_phc} has surplus stock {distance_km}km away. "
                f"Recommending a transfer of {quantity} units.")

    prompt = f"""You are explaining a medicine redistribution recommendation for a
healthcare resource management system. Write a short, clear, 2-3 sentence
explanation for a hospital administrator, based on these facts:

- Destination facility: {destination_phc}
- Shortage risk: {shortage_risk_pct}%
- Medicine: {medicine}
- Source facility (has surplus): {source_phc}
- Distance: {distance_km} km
- Recommended transfer quantity: {quantity} units

Be direct and factual. Do not invent additional facts beyond what's given."""

    response = _client.models.generate_content(model=MODEL_NAME, contents=prompt)
    return response.text.strip()


def translate_alert(english_text: str, target_language: str = "Hindi") -> str:
    """
    Translates an alert or summary message into the target language for
    the multilingual requirement. Kept as a thin, reusable wrapper so the
    same pattern covers alerts, dashboard summaries, etc.
    """
    if _client is None:
        return english_text  # fallback: return English unchanged

    prompt = f"""Translate the following healthcare alert message into {target_language}.
Keep it natural for a healthcare worker to read, not a literal word-for-word
translation. Return only the translated text, nothing else.

Message: {english_text}"""

    response = _client.models.generate_content(model=MODEL_NAME, contents=prompt)
    return response.text.strip()


if __name__ == "__main__":
    # Quick manual test (requires GEMINI_API_KEY set)
    explanation = explain_recommendation(
        source_phc="PHC-107", destination_phc="PHC-204", medicine="Insulin",
        quantity=250, distance_km=42, shortage_risk_pct=91,
    )
    print("Explanation:", explanation)

    hindi = translate_alert("Insulin stock-out predicted within 3 days at PHC-204.")
    print("Hindi:", hindi)
