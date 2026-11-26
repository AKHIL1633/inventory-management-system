
import { pool } from "../config/database.js";

export const getInventoryLedger = async (productId = null) => {
  const result = await pool.query(
    `SELECT *
     FROM (
       -- Purchase transactions
       SELECT
         'PURCHASE' AS transaction_type,
         b.id AS transaction_id,
         b.product_id,
         p.name AS product_name,
         p.sku,
         b.quantity_purchased AS quantity,
         b.unit_cost AS unit_price,
         (b.quantity_purchased * b.unit_cost) AS total_cost,
         NULL::NUMERIC AS revenue,
         NULL::NUMERIC AS gross_profit,
         b.purchased_at AS transaction_date
       FROM inventory_batches b
       JOIN products p ON p.id = b.product_id

       UNION ALL

       -- Sale transactions
       SELECT
         'SALE' AS transaction_type,
         si.id AS transaction_id,
         si.product_id,
         p.name AS product_name,
         p.sku,
         -si.quantity_sold AS quantity,
         si.unit_sale_price AS unit_price,
         si.cost_of_goods_sold AS total_cost,
         si.revenue,
         (si.revenue - si.cost_of_goods_sold) AS gross_profit,
         si.created_at AS transaction_date
       FROM sale_items si
       JOIN products p ON p.id = si.product_id
     ) AS ledger
     WHERE ($1::BIGINT IS NULL OR product_id = $1)
     ORDER BY transaction_date DESC, transaction_id DESC`,
    [productId]
  );

  return result.rows;
};
