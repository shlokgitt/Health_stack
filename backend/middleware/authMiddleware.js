import crypto from "crypto";
import { pool } from "../models/db.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing token" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Missing token" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const result = await pool.query(
      `
      SELECT s.session_id, s.user_id, s.expires_at,
             u.phc_id, u.username, u.role, u.is_active
      FROM user_session s
      JOIN app_user u ON s.user_id = u.user_id
      WHERE s.token_hash = $1
      `,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const session = result.rows[0];

    if (new Date() > new Date(session.expires_at)) {
      // Delete expired session
      await pool.query("DELETE FROM user_session WHERE session_id = $1", [
        session.session_id,
      ]);
      return res.status(401).json({ error: "Unauthorized: Session expired" });
    }

    if (!session.is_active) {
      return res.status(403).json({ error: "Forbidden: User is inactive" });
    }

    // Update last_seen_at
    await pool.query(
      "UPDATE user_session SET last_seen_at = NOW() WHERE session_id = $1",
      [session.session_id]
    );

    // Attach user to request
    req.user = {
      user_id: session.user_id,
      phc_id: session.phc_id,
      username: session.username,
      role: session.role,
      session_id: session.session_id,
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
