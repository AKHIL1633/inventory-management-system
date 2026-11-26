import { pool } from "../config/database.js";

export const getHealth = async (req, res) => {
  try {
    await pool.query("SELECT 1");

    return res.status(200).json({
      success: true,
      message: "Inventory Management API is running",
      services: {
        api: "healthy",
        database: "connected",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return res.status(503).json({
      success: false,
      message: "Database connection unavailable",
      services: {
        api: "running",
        database: "unavailable",
      },
    });
  }
};