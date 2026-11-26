import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

// Create a reusable PostgreSQL connection pool
export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log unexpected idle-client errors
pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

// Test database connectivity
export const connectDatabase = async () => {
  const client = await pool.connect();

  try {
    const result = await client.query("SELECT NOW() AS current_time");

    console.log(
      "PostgreSQL connected successfully:",
      result.rows[0].current_time
    );
  } finally {
    client.release();
  }
};