
import { pool } from "../config/database.js";

export const createProduct = async ({ name, sku, description }) => {
  const result = await pool.query(
    `INSERT INTO products (name, sku, description)
     VALUES ($1, $2, $3)
     RETURNING id, name, sku, description, created_at, updated_at`,
    [name.trim(), sku.trim().toUpperCase(), description?.trim() || null]
  );

  return result.rows[0];
};

export const getAllProducts = async () => {
  const result = await pool.query(
    `SELECT
       p.id,
       p.name,
       p.sku,
       p.description,
       p.created_at,
       p.updated_at,
       COALESCE(SUM(b.quantity_remaining), 0) AS current_stock
     FROM products p
     LEFT JOIN inventory_batches b ON b.product_id = p.id
     GROUP BY p.id
     ORDER BY p.id DESC`
  );

  return result.rows;
};

export const getProductById = async (id) => {
  const result = await pool.query(
    `SELECT
       p.id,
       p.name,
       p.sku,
       p.description,
       p.created_at,
       p.updated_at,
       COALESCE(SUM(b.quantity_remaining), 0) AS current_stock
     FROM products p
     LEFT JOIN inventory_batches b ON b.product_id = p.id
     WHERE p.id = $1
     GROUP BY p.id`,
    [id]
  );

  return result.rows[0] || null;
};

export const updateProduct = async (id, { name, sku, description }) => {
  const result = await pool.query(
    `UPDATE products
     SET name = $1,
         sku = $2,
         description = $3,
         updated_at = NOW()
     WHERE id = $4
     RETURNING id, name, sku, description, created_at, updated_at`,
    [name.trim(), sku.trim().toUpperCase(), description?.trim() || null, id]
  );

  return result.rows[0] || null;
};

export const deleteProduct = async (id) => {
  const result = await pool.query(
    `DELETE FROM products p
     WHERE p.id = $1
       AND NOT EXISTS (
         SELECT 1 FROM inventory_batches b WHERE b.product_id = p.id
       )
       AND NOT EXISTS (
         SELECT 1 FROM sale_items s WHERE s.product_id = p.id
       )
     RETURNING p.id`,
    [id]
  );

  return result.rows.length > 0;
};
