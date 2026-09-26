import crypto from "crypto";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { pool } from "../models/db.js";

dotenv.config();

function generatePassword() {
  return crypto.randomBytes(12).toString("base64url");
}

async function main() {
  try {
    const result = await pool.query(`
      SELECT phc_id, name
      FROM phc
      WHERE is_active = TRUE
      ORDER BY phc_id
    `);

    if (result.rows.length === 0) {
      console.log("No active PHCs found.");
      return;
    }

    console.log("");
    console.log("==============================================");
    console.log("PHC ACCOUNT CREDENTIALS");
    console.log("==============================================");
    console.log("");

    for (const phc of result.rows) {
      const username = phc.phc_id.toLowerCase();
      const password = generatePassword();

      const passwordHash = await bcrypt.hash(
        password,
        12
      );

      await pool.query(
        `
        INSERT INTO app_user (
          phc_id,
          username,
          password_hash,
          role
        )
        VALUES ($1, $2, $3, 'PHC')
        ON CONFLICT (username)
        DO UPDATE SET
          phc_id = EXCLUDED.phc_id,
          password_hash = EXCLUDED.password_hash,
          is_active = TRUE
        `,
        [
          phc.phc_id,
          username,
          passwordHash,
        ]
      );

      console.log(
        `${phc.phc_id} | ${phc.name}`
      );

      console.log(
        `Username: ${username}`
      );

      console.log(
        `Password: ${password}`
      );

      console.log("");
    }

    console.log(
      "Account provisioning completed."
    );
  } catch (error) {
    console.error(
      "Provisioning failed:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
