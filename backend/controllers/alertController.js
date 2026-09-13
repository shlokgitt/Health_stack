import { pool } from "../models/db.js";

// Derives alerts on the fly from the latest inventory snapshot.
// (A real alert table gets populated once the stock-out prediction
// service - see /ai/stockout - is wired in; this endpoint works
// standalone off simple thresholds in the meantime.)
export async function listAlerts(req, res) {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (i.phc_id, i.medicine_id)
              i.phc_id, p.name AS phc_name, i.medicine_id, m.name AS medicine_name,
              i.current_stock, i.minimum_stock,
              CASE
                WHEN i.current_stock <= i.minimum_stock THEN 'CRITICAL'
                ELSE 'WARNING'
              END AS risk_level
       FROM inventory i
       JOIN phc p ON p.phc_id = i.phc_id
       JOIN medicine m ON m.medicine_id = i.medicine_id
       WHERE i.current_stock <= i.minimum_stock * 2
       ORDER BY i.phc_id, i.medicine_id, i.date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
}
