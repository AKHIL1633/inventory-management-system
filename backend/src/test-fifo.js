
import { pool } from "./config/database.js";
import {
  createPurchase,
  createSale,
} from "./services/inventory.service.js";

const runTest = async () => {
  try {
    const productResult = await pool.query(
      "SELECT id FROM products WHERE sku = $1",
      ["LAP-001"]
    );

    if (productResult.rowCount === 0) {
      throw new Error("Test product not found");
    }

    const productId = productResult.rows[0].id;

    // Purchase batch 1: 100 units at ₹10.
    const batch1 = await createPurchase({
      productId,
      quantity: "100",
      unitCost: "10",
      purchasedAt: "2026-01-01T10:00:00Z",
    });

    // Purchase batch 2: 50 units at ₹12.
    const batch2 = await createPurchase({
      productId,
      quantity: "50",
      unitCost: "12",
      purchasedAt: "2026-01-02T10:00:00Z",
    });

    console.log("Purchase batches created:");
    console.log({
      batch1: batch1.id,
      batch2: batch2.id,
    });

    // Sell 120 units.
    const result = await createSale({
      productId,
      quantity: "120",
      unitSalePrice: "20",
    });

    console.log("\nFIFO sale result:");
    console.log(JSON.stringify(result, null, 2));

    const remaining = await pool.query(
      `SELECT id, quantity_purchased, quantity_remaining, unit_cost
       FROM inventory_batches
       WHERE product_id = $1
       ORDER BY purchased_at ASC, id ASC`,
      [productId]
    );

    console.log("\nRemaining inventory:");
    console.table(remaining.rows);

    console.log("\nFIFO test completed.");
  } catch (error) {
    console.error("FIFO test failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

runTest();
