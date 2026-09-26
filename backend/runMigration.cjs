require("dotenv").config();
const fs = require("fs");
const { Client } = require("pg");

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();

        const sql = fs.readFileSync("../db/auth_migration.sql", "utf8");

        await client.query(sql);

        console.log("AUTH MIGRATION SUCCESS");
    } catch (error) {
        console.error("MIGRATION FAILED:", error.message);
        process.exitCode = 1;
    } finally {
        await client.end();
    }
}

main();
