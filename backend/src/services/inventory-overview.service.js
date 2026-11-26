
import { pool } from "../config/database.js";

export const getInventoryOverview = async () => {
  const result = await pool.query(
    `SELECT
       p.id AS product_id,
       p.name,
       p.sku,

       COALESCE(SUM(b.quantity_purchased), 0) AS total_purchased,

       COALESCE(SUM(b.quantity_remaining), 0) AS current_stock,

       COALESCE(
         SUM(b.quantity_remaining * b.unit_cost),
         0
       ) AS inventory_value,

       COUNT(b.id) AS total_batches

     FROM products p

     LEFT JOIN inventory_batches b
       ON b.product_id = p.id

     GROUP BY p.id

     ORDER BY p.name ASC`
  );

  return result.rows;
};
