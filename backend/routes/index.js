import { Router } from "express";
import axios from "axios";

import { listPhcs, getPhc } from "../controllers/phcController.js";
import {
  getInventoryForPhc,
  getInventoryOverview,
} from "../controllers/inventoryController.js";
import { listAlerts } from "../controllers/alertController.js";
import {
  listRecommendations,
} from "../controllers/recommendationController.js";
import { pool } from "../models/db.js";

const router = Router();

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || "http://localhost:8000";

/* =========================
   PHC ROUTES
========================= */

router.get("/phcs", listPhcs);

router.get("/phcs/:id", getPhc);

/* =========================
   INVENTORY ROUTES
========================= */

router.get("/inventory", getInventoryOverview);

router.get("/inventory/:phcId", getInventoryForPhc);

/* =========================
   ALERT ROUTES
========================= */

router.get("/alerts", listAlerts);

/* =========================
   AI FORECAST
========================= */

router.get("/forecasts/:phcId", async (req, res) => {
  try {
    const response = await axios.get(
      `${AI_SERVICE_URL}/forecasts/${req.params.phcId}`,
      {
        timeout: 8000,
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Forecast service error:", error.message);

    res.status(503).json({
      error: "AI forecast service unavailable",
      message:
        "Start the Python AI service on port 8000 to use forecasting.",
    });
  }
});

/* =========================
   AI STOCKOUT PREDICTION
========================= */

router.post("/predictions/stockout", async (req, res) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/predictions/stockout`,
      req.body,
      {
        timeout: 8000,
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Stockout prediction error:", error.message);

    res.status(503).json({
      error: "AI stock-out service unavailable",
      message:
        "Start the Python AI service on port 8000 to use stock-out prediction.",
    });
  }
});

/* =========================
   RECOMMENDATIONS
========================= */

router.get("/recommendations", listRecommendations);

/* =========================
   TRANSFER APPROVAL
========================= */

router.post("/transfers", async (req, res) => {
  try {
    const {
      source_phc,
      destination_phc,
      medicine_id,
      quantity,
      distance_km,
      explanation,
    } = req.body;

    if (
      !source_phc ||
      !destination_phc ||
      !medicine_id ||
      !quantity
    ) {
      return res.status(400).json({
        error:
          "source_phc, destination_phc, medicine_id and quantity are required",
      });
    }

    if (source_phc === destination_phc) {
      return res.status(400).json({
        error: "Source and destination PHCs must be different",
      });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({
        error: "Transfer quantity must be greater than zero",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO transfer (
        source_phc,
        destination_phc,
        medicine_id,
        quantity,
        distance_km,
        status,
        explanation
      )
      VALUES ($1, $2, $3, $4, $5, 'approved', $6)
      RETURNING *
      `,
      [
        source_phc,
        destination_phc,
        medicine_id,
        Number(quantity),
        distance_km || null,
        explanation || null,
      ]
    );

    res.status(201).json({
      message: "Transfer approved successfully",
      transfer: result.rows[0],
    });
  } catch (error) {
    console.error("Transfer error:", error);

    res.status(500).json({
      error: "Failed to create transfer",
      details: error.message,
    });
  }
});

export default router;