
import { pool } from "../config/database.js";

export const getDashboardSummary = async () => {
  const result = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM products) AS total_products,

       (
         SELECT COALESCE(SUM(quantity_remaining), 0)
         FROM inventory_batches
       ) AS total_stock,

       (
         SELECT COALESCE(
           SUM(quantity_remaining * unit_cost), 0
         )
         FROM inventory_batches
       ) AS inventory_value,

       (
         SELECT COALESCE(SUM(total_revenue), 0)
         FROM sales
       ) AS total_revenue,

       (
         SELECT COALESCE(SUM(total_cost), 0)
         FROM sales
       ) AS total_cost,

       (
         SELECT COALESCE(SUM(total_revenue - total_cost), 0)
         FROM sales
       ) AS gross_profit`
  );

  return result.rows[0];
};
