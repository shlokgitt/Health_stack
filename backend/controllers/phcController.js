import { pool } from "../models/db.js";

export async function listPhcs(req, res) {
  try {
    const result = await pool.query("SELECT * FROM phc ORDER BY state, district, name");
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
