import crypto from "crypto";
import bcrypt from "bcryptjs";
import { pool } from "../models/db.js";

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const result = await pool.query(
      `SELECT user_id, phc_id, username, password_hash, role, is_active FROM app_user WHERE username = $1`,
      [username.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: "Account is inactive" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    
    // Set expiry to 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const sessionId = crypto.randomUUID();

    // Store session
    await pool.query(
      `INSERT INTO user_session (session_id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, user.user_id, tokenHash, expiresAt]
    );

    // Update last login
    await pool.query(
      `UPDATE app_user SET last_login_at = NOW() WHERE user_id = $1`,
      [user.user_id]
    );

    // Return user (without password) and token
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        phc_id: user.phc_id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Failed to authenticate" });
  }
};

export const getMe = async (req, res) => {
  // Uses authenticate middleware, so req.user is populated
  res.status(200).json({ user: req.user });
};

export const logout = async (req, res) => {
  try {
    // Delete current session
    const sessionId = req.user.session_id;
    await pool.query(`DELETE FROM user_session WHERE session_id = $1`, [sessionId]);
    
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ error: "Failed to logout" });
  }
};
