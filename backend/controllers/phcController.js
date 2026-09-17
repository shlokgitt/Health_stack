import { pool } from "../models/db.js";

export async function listPhcs(req, res) {
  try {
    // ?active=true returns only the demo facilities with real operational
    // data (inventory, forecasts, etc). Omit it (or use ?active=false) to
    // get the full national reference layer too (~29.5k real PHCs, shown
    // on the map for scale/context - see data/01b_build_full_phc_layer.py).
    const activeOnly = req.query.active === "true";
    const query = activeOnly
      ? "SELECT * FROM phc WHERE is_active = TRUE ORDER BY state, district, name"
      : "SELECT * FROM phc ORDER BY is_active DESC, state, district, name";
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch PHCs" });
  }
}

export async function getPhc(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM phc WHERE phc_id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "PHC not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch PHC" });
  }
}
