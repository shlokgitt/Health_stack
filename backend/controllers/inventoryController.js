import { pool } from "../models/db.js";

// Latest inventory snapshot per medicine for a given PHC
export async function getInventoryForPhc(req, res) {
  try {
    const { phcId } = req.params;
    const result = await pool.query(
      `SELECT DISTINCT ON (i.medicine_id)
              i.medicine_id, m.name AS medicine_name, m.unit,
              i.current_stock, i.minimum_stock, i.maximum_stock, i.date
       FROM inventory i
       JOIN medicine m ON m.medicine_id = i.medicine_id
       WHERE i.phc_id = $1
       ORDER BY i.medicine_id, i.date DESC`,
      [phcId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
}

// Overview across all PHCs - latest snapshot, flagged by risk level
export async function getInventoryOverview(req, res) {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (i.phc_id, i.medicine_id)
              i.phc_id, p.name AS phc_name, i.medicine_id, m.name AS medicine_name,
              i.current_stock, i.minimum_stock,
              CASE
                WHEN i.current_stock <= i.minimum_stock THEN 'CRITICAL'
                WHEN i.current_stock <= i.minimum_stock * 2 THEN 'WARNING'
                ELSE 'LOW_RISK'
              END AS risk_level
       FROM inventory i
       JOIN phc p ON p.phc_id = i.phc_id
       JOIN medicine m ON m.medicine_id = i.medicine_id
       ORDER BY i.phc_id, i.medicine_id, i.date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch inventory overview" });
  }
}
