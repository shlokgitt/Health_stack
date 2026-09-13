import { Router } from "express";
import { listPhcs, getPhc } from "../controllers/phcController.js";
import { getInventoryForPhc, getInventoryOverview } from "../controllers/inventoryController.js";
import { listAlerts } from "../controllers/alertController.js";

const router = Router();

router.get("/phcs", listPhcs);
router.get("/phcs/:id", getPhc);

router.get("/inventory", getInventoryOverview);
router.get("/inventory/:phcId", getInventoryForPhc);

router.get("/alerts", listAlerts);

// Forecast, stock-out prediction, and recommendation endpoints proxy to
// the Python AI service (see /ai) - stubbed for now, wire up once that
// service is running.
router.get("/forecasts/:phcId", (req, res) => {
  res.status(501).json({ error: "Not yet implemented - proxy to AI service" });
});
router.post("/predictions/stockout", (req, res) => {
  res.status(501).json({ error: "Not yet implemented - proxy to AI service" });
});
router.get("/recommendations", (req, res) => {
  res.status(501).json({ error: "Not yet implemented - proxy to AI service" });
});
router.post("/transfers", (req, res) => {
  res.status(501).json({ error: "Not yet implemented" });
});

export default router;
