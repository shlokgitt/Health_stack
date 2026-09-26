import { pool } from "../models/db.js";
import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateRisk(currentStock, minimumStock, avgDailyConsumption) {
  if (!avgDailyConsumption || avgDailyConsumption <= 0) {
    if (currentStock <= minimumStock) {
      return {
        risk_level: "CRITICAL",
        shortage_risk_pct: 90,
        days_remaining: null,
      };
    }

    return {
      risk_level: "LOW",
      shortage_risk_pct: 5,
      days_remaining: null,
    };
  }

  const daysRemaining = currentStock / avgDailyConsumption;

  let riskLevel = "LOW";
  let riskPercentage = 5;

  if (daysRemaining < 5) {
    riskLevel = "CRITICAL";
    riskPercentage = 90;
  } else if (daysRemaining < 10) {
    riskLevel = "HIGH";
    riskPercentage = 65;
  } else if (daysRemaining < 15) {
    riskLevel = "WARNING";
    riskPercentage = 35;
  }

  return {
    risk_level: riskLevel,
    shortage_risk_pct: riskPercentage,
    days_remaining: Number(daysRemaining.toFixed(1)),
  };
}

function fallbackExplanation(rec) {
  return (
    `${rec.destination_phc_name} has a ${rec.shortage_risk_pct}% shortage risk ` +
    `for ${rec.medicine_name}. ${rec.source_phc_name} has surplus stock and ` +
    `is approximately ${rec.distance_km} km away. A transfer of ` +
    `${rec.quantity} units is recommended to reduce the shortage risk.`
  );
}

async function generateAIExplanation(rec) {
  const fallback = fallbackExplanation(rec);

  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/recommendations/explain`,
      {
        source_phc: rec.source_phc_name,
        destination_phc: rec.destination_phc_name,
        medicine: rec.medicine_name,
        quantity: rec.quantity,
        distance_km: rec.distance_km,
        shortage_risk_pct: rec.shortage_risk_pct,
      },
      {
        timeout: 5000,
      }
    );

    return response.data?.explanation_en || fallback;
  } catch (error) {
    console.warn(
      "AI explanation unavailable, using fallback:",
      error.message
    );

    return fallback;
  }
}

export async function listRecommendations(req, res) {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "12", 10), 1),
      30
    );

    const medicineFilter = req.query.medicine_id
      ? "AND i.medicine_id = $1"
      : "";

    const queryParams = req.query.medicine_id
      ? [req.query.medicine_id]
      : [];

    const result = await pool.query(
      `
      WITH latest_inventory AS (
        SELECT DISTINCT ON (i.phc_id, i.medicine_id)
          i.phc_id,
          i.medicine_id,
          i.current_stock,
          i.minimum_stock,
          i.maximum_stock,
          i.date
        FROM inventory i
        WHERE 1=1
        ${medicineFilter}
        ORDER BY i.phc_id, i.medicine_id, i.date DESC
      ),

      consumption_30 AS (
        SELECT
          c.phc_id,
          c.medicine_id,
          AVG(c.quantity_used)::numeric AS avg_daily_consumption
        FROM consumption c
        WHERE c.date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY c.phc_id, c.medicine_id
      )

      SELECT
        li.phc_id,
        li.medicine_id,
        li.current_stock,
        li.minimum_stock,
        li.maximum_stock,
        li.date,
        p.name AS phc_name,
        p.district,
        p.state,
        p.latitude,
        p.longitude,
        m.name AS medicine_name,
        m.unit,
        COALESCE(c30.avg_daily_consumption, 0) AS avg_daily_consumption
      FROM latest_inventory li
      JOIN phc p ON p.phc_id = li.phc_id
      JOIN medicine m ON m.medicine_id = li.medicine_id
      LEFT JOIN consumption_30 c30
        ON c30.phc_id = li.phc_id
        AND c30.medicine_id = li.medicine_id
      WHERE p.is_active = TRUE
      ORDER BY p.state, p.district, p.name
      `,
      queryParams
    );

    const inventory = result.rows;

    const destinations = inventory.filter((item) => {
      const risk = calculateRisk(
        Number(item.current_stock),
        Number(item.minimum_stock),
        Number(item.avg_daily_consumption)
      );

      return (
        Number(item.current_stock) <= Number(item.minimum_stock) * 2 ||
        ["CRITICAL", "HIGH", "WARNING"].includes(risk.risk_level)
      );
    });

    const sources = inventory.filter(
      (item) =>
        Number(item.current_stock) >
        Number(item.minimum_stock) * 2
    );

    const recommendations = [];

    for (const destination of destinations) {
      const destinationRisk = calculateRisk(
        Number(destination.current_stock),
        Number(destination.minimum_stock),
        Number(destination.avg_daily_consumption)
      );

      for (const source of sources) {
        if (
          source.phc_id === destination.phc_id ||
          source.medicine_id !== destination.medicine_id
        ) {
          continue;
        }

        const distance = haversineDistance(
          Number(source.latitude),
          Number(source.longitude),
          Number(destination.latitude),
          Number(destination.longitude)
        );

        if (distance > 250) {
          continue;
        }

        const sourceStock = Number(source.current_stock);
        const sourceMinimum = Number(source.minimum_stock);
        const destinationStock = Number(destination.current_stock);
        const destinationMinimum = Number(destination.minimum_stock);

        const sourceSurplus = Math.floor(
          sourceStock - sourceMinimum * 1.5
        );

        const destinationNeed = Math.ceil(
          Math.max(destinationMinimum - destinationStock, 0)
        );

        const quantity = Math.min(
          sourceSurplus,
          destinationNeed > 0
            ? destinationNeed
            : Math.ceil(destinationMinimum * 0.5)
        );

        if (quantity <= 0) {
          continue;
        }

        recommendations.push({
          source_phc: source.phc_id,
          source_phc_name: source.phc_name,
          source_district: source.district,
          destination_phc: destination.phc_id,
          destination_phc_name: destination.phc_name,
          destination_district: destination.district,
          medicine_id: destination.medicine_id,
          medicine_name: destination.medicine_name,
          unit: destination.unit,
          source_stock: sourceStock,
          destination_stock: destinationStock,
          source_minimum: sourceMinimum,
          destination_minimum: destinationMinimum,
          quantity,
          distance_km: Number(distance.toFixed(1)),
          shortage_risk_pct: destinationRisk.shortage_risk_pct,
          risk_level: destinationRisk.risk_level,
          days_remaining: destinationRisk.days_remaining,
          avg_daily_consumption: Number(
            destination.avg_daily_consumption
          ),
        });
      }
    }

    recommendations.sort((a, b) => {
      if (b.shortage_risk_pct !== a.shortage_risk_pct) {
        return b.shortage_risk_pct - a.shortage_risk_pct;
      }

      return a.distance_km - b.distance_km;
    });

    const uniqueRecommendations = [];
    const usedDestinations = new Set();

    for (const recommendation of recommendations) {
      const key = `${recommendation.destination_phc}-${recommendation.medicine_id}`;

      if (usedDestinations.has(key)) {
        continue;
      }

      usedDestinations.add(key);
      uniqueRecommendations.push(recommendation);

      if (uniqueRecommendations.length >= limit) {
        break;
      }
    }

    const enriched = await Promise.all(
      uniqueRecommendations.map(async (recommendation) => {
        const explanation = await generateAIExplanation(recommendation);

        return {
          ...recommendation,
          explanation,
        };
      })
    );

    res.json({
      count: enriched.length,
      generated_at: new Date().toISOString(),
      recommendations: enriched,
    });
  } catch (error) {
    console.error("Recommendation error:", error);

    res.status(500).json({
      error: "Failed to generate redistribution recommendations",
      details: error.message,
    });
  }
}