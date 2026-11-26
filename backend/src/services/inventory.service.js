
import Decimal from "decimal.js";
import { pool } from "../config/database.js";
import { addOutboxEvent } from "./outbox.service.js";

// Execute inventory operations inside a PostgreSQL transaction.
const withTransaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await callback(client);

    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Validate quantity and monetary values.
const validateNumbers = (quantity, price, priceLabel = "Unit price") => {
  const parsedQuantity = new Decimal(quantity);
  const parsedPrice = new Decimal(price);

  if (!parsedQuantity.isFinite() || !parsedQuantity.isPositive()) {
    throw new Error("Quantity must be greater than zero");
  }

  if (!parsedPrice.isFinite() || parsedPrice.isNegative()) {
    throw new Error(`${priceLabel} cannot be negative`);
  }

  return { parsedQuantity, parsedPrice };
};

// Create a purchase batch and its outbox event atomically.
export const createPurchase = async ({
  productId,
  quantity,
  unitCost,
  purchasedAt = new Date(),
}) => {
  const { parsedQuantity, parsedPrice } = validateNumbers(
    quantity,
    unitCost,
    "Unit cost"
  );

  return withTransaction(async (client) => {
    const productResult = await client.query(
      "SELECT id FROM products WHERE id = $1 FOR UPDATE",
      [productId]
    );

    if (productResult.rowCount === 0) {
      throw new Error("Product not found");
    }

    const result = await client.query(
      `INSERT INTO inventory_batches
        (product_id, quantity_purchased, quantity_remaining,
         unit_cost, purchased_at)
       VALUES ($1, $2, $2, $3, $4)
       RETURNING *`,
      [
        productId,
        parsedQuantity.toFixed(3),
        parsedPrice.toFixed(2),
        purchasedAt,
      ]
    );

    const batch = result.rows[0];

    // Save the event in the same transaction.
    await addOutboxEvent(client, {
      eventType: "PURCHASE",
      productId,
      quantity: parsedQuantity.toFixed(3),
      unitPrice: parsedPrice.toFixed(2),
      timestamp: purchasedAt,
    });

    return batch;
  });
};

// Sell stock using FIFO and save its outbox event atomically.
export const createSale = async ({
  productId,
  quantity,
  unitSalePrice,
}) => {
  const { parsedQuantity, parsedPrice } = validateNumbers(
    quantity,
    unitSalePrice,
    "Sale price"
  );

  return withTransaction(async (client) => {
    const productResult = await client.query(
      "SELECT id FROM products WHERE id = $1 FOR UPDATE",
      [productId]
    );

    if (productResult.rowCount === 0) {
      throw new Error("Product not found");
    }

    const batchesResult = await client.query(
      `SELECT *
       FROM inventory_batches
       WHERE product_id = $1
         AND quantity_remaining > 0
       ORDER BY purchased_at ASC, id ASC
       FOR UPDATE`,
      [productId]
    );

    const batches = batchesResult.rows;

    const availableQuantity = batches.reduce(
      (total, batch) =>
        total.plus(new Decimal(batch.quantity_remaining)),
      new Decimal(0)
    );

    if (availableQuantity.lessThan(parsedQuantity)) {
      throw new Error(
        `Insufficient stock. Available: ${availableQuantity.toFixed(3)}, requested: ${parsedQuantity.toFixed(3)}`
      );
    }

    const revenue = parsedQuantity
      .mul(parsedPrice)
      .toDecimalPlaces(2);

    let remainingToSell = parsedQuantity;
    let totalCost = new Decimal(0);

    const allocations = [];

    for (const batch of batches) {
      if (remainingToSell.isZero()) break;

      const batchAvailable = new Decimal(batch.quantity_remaining);

      const consumed = Decimal.min(
        remainingToSell,
        batchAvailable
      );

      const batchUnitCost = new Decimal(batch.unit_cost);

      const allocationCost = consumed
        .mul(batchUnitCost)
        .toDecimalPlaces(2);

      const newRemaining = batchAvailable.minus(consumed);

      await client.query(
        `UPDATE inventory_batches
         SET quantity_remaining = $1
         WHERE id = $2`,
        [newRemaining.toFixed(3), batch.id]
      );

      allocations.push({
        batchId: batch.id,
        quantityConsumed: consumed.toFixed(3),
        unitCost: batchUnitCost.toFixed(2),
        totalCost: allocationCost.toFixed(2),
      });

      totalCost = totalCost.plus(allocationCost);
      remainingToSell = remainingToSell.minus(consumed);
    }

    totalCost = totalCost.toDecimalPlaces(2);

    const saleResult = await client.query(
      `INSERT INTO sales (total_revenue, total_cost)
       VALUES ($1, $2)
       RETURNING *`,
      [revenue.toFixed(2), totalCost.toFixed(2)]
    );

    const sale = saleResult.rows[0];

    const saleItemResult = await client.query(
      `INSERT INTO sale_items
        (sale_id, product_id, quantity_sold, unit_sale_price,
         revenue, cost_of_goods_sold)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        sale.id,
        productId,
        parsedQuantity.toFixed(3),
        parsedPrice.toFixed(2),
        revenue.toFixed(2),
        totalCost.toFixed(2),
      ]
    );

    const saleItem = saleItemResult.rows[0];

    for (const allocation of allocations) {
      await client.query(
        `INSERT INTO sale_item_batch_allocations
          (sale_item_id, batch_id, quantity_consumed,
           unit_cost, total_cost)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          saleItem.id,
          allocation.batchId,
          allocation.quantityConsumed,
          allocation.unitCost,
          allocation.totalCost,
        ]
      );
    }

    // Save the sale event in the same transaction.
    await addOutboxEvent(client, {
      eventType: "SALE",
      productId,
      quantity: parsedQuantity.toFixed(3),
      unitPrice: parsedPrice.toFixed(2),
      timestamp: new Date(),
    });

    return {
      sale,
      saleItem,
      allocations,
    };
  });
};

// Process incoming Kafka events atomically with duplicate protection.
// Do not create another outbox event here: this is the Kafka ingestion path.
export const processInventoryEvent = async (event) => {
  return withTransaction(async (client) => {
    const claim = await client.query(
      `INSERT INTO processed_events
        (event_id, event_type, product_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id) DO NOTHING
       RETURNING id`,
      [event.event_id, event.event_type, event.product_id]
    );

    if (claim.rowCount === 0) {
      return {
        duplicate: true,
        message: "Event already processed",
      };
    }

    const productResult = await client.query(
      "SELECT id FROM products WHERE id = $1 FOR UPDATE",
      [event.product_id]
    );

    if (productResult.rowCount === 0) {
      throw new Error("Product not found");
    }

    const { parsedQuantity, parsedPrice } = validateNumbers(
      event.quantity,
      event.unit_price,
      "Unit price"
    );

    if (event.event_type === "PURCHASE") {
      const batchResult = await client.query(
        `INSERT INTO inventory_batches
          (product_id, quantity_purchased, quantity_remaining,
           unit_cost, purchased_at)
         VALUES ($1, $2, $2, $3, $4)
         RETURNING *`,
        [
          event.product_id,
          parsedQuantity.toFixed(3),
          parsedPrice.toFixed(2),
          event.timestamp || new Date(),
        ]
      );

      return {
        duplicate: false,
        eventType: "PURCHASE",
        batch: batchResult.rows[0],
      };
    }

    if (event.event_type === "SALE") {
      const batchesResult = await client.query(
        `SELECT *
         FROM inventory_batches
         WHERE product_id = $1
           AND quantity_remaining > 0
         ORDER BY purchased_at ASC, id ASC
         FOR UPDATE`,
        [event.product_id]
      );

      const batches = batchesResult.rows;

      const availableQuantity = batches.reduce(
        (total, batch) =>
          total.plus(new Decimal(batch.quantity_remaining)),
        new Decimal(0)
      );

      if (availableQuantity.lessThan(parsedQuantity)) {
        throw new Error(
          `Insufficient stock. Available: ${availableQuantity.toFixed(3)}, requested: ${parsedQuantity.toFixed(3)}`
        );
      }

      const revenue = parsedQuantity
        .mul(parsedPrice)
        .toDecimalPlaces(2);

      let remainingToSell = parsedQuantity;
      let totalCost = new Decimal(0);

      const allocations = [];

      for (const batch of batches) {
        if (remainingToSell.isZero()) break;

        const batchAvailable = new Decimal(batch.quantity_remaining);

        const consumed = Decimal.min(
          remainingToSell,
          batchAvailable
        );

        const batchUnitCost = new Decimal(batch.unit_cost);

        const allocationCost = consumed
          .mul(batchUnitCost)
          .toDecimalPlaces(2);

        const newRemaining = batchAvailable.minus(consumed);

        await client.query(
          `UPDATE inventory_batches
           SET quantity_remaining = $1
           WHERE id = $2`,
          [newRemaining.toFixed(3), batch.id]
        );

        allocations.push({
          batchId: batch.id,
          quantityConsumed: consumed.toFixed(3),
          unitCost: batchUnitCost.toFixed(2),
          totalCost: allocationCost.toFixed(2),
        });

        totalCost = totalCost.plus(allocationCost);
        remainingToSell = remainingToSell.minus(consumed);
      }

      totalCost = totalCost.toDecimalPlaces(2);

      const saleResult = await client.query(
        `INSERT INTO sales (total_revenue, total_cost)
         VALUES ($1, $2)
         RETURNING *`,
        [revenue.toFixed(2), totalCost.toFixed(2)]
      );

      const sale = saleResult.rows[0];

      const saleItemResult = await client.query(
        `INSERT INTO sale_items
          (sale_id, product_id, quantity_sold, unit_sale_price,
           revenue, cost_of_goods_sold)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          sale.id,
          event.product_id,
          parsedQuantity.toFixed(3),
          parsedPrice.toFixed(2),
          revenue.toFixed(2),
          totalCost.toFixed(2),
        ]
      );

      const saleItem = saleItemResult.rows[0];

      for (const allocation of allocations) {
        await client.query(
          `INSERT INTO sale_item_batch_allocations
            (sale_item_id, batch_id, quantity_consumed,
             unit_cost, total_cost)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            saleItem.id,
            allocation.batchId,
            allocation.quantityConsumed,
            allocation.unitCost,
            allocation.totalCost,
          ]
        );
      }

      return {
        duplicate: false,
        eventType: "SALE",
        sale,
        saleItem,
        allocations,
      };
    }

    throw new Error(`Unsupported event type: ${event.event_type}`);
  });
};
