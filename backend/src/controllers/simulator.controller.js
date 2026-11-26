
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { pool } from "../config/database.js";
import { publishInventoryEvent } from "../kafka/event.producer.js";

const simulatorSchema = z.object({
  product_id: z.coerce.number().int().positive(),

  event_type: z.enum(["PURCHASE", "SALE"]),

  quantity: z.coerce.number().positive().finite(),

  unit_price: z.coerce.number().nonnegative().finite(),
});

export const publishSimulatorEvent = async (req, res) => {
  try {
    // Validate incoming request.
    const validation = simulatorSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid simulator event data",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const { product_id, event_type, quantity, unit_price } =
      validation.data;

    // Verify that the product exists before publishing.
    const productResult = await pool.query(
      "SELECT id, name, sku FROM products WHERE id = $1",
      [product_id]
    );

    if (productResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Generate a unique event identifier.
    const event = {
      event_id: randomUUID(),
      event_type,
      product_id,
      quantity,
      unit_price,
      timestamp: new Date().toISOString(),
    };

    // Publish the event to Kafka.
    await publishInventoryEvent(event);

    return res.status(202).json({
      success: true,
      message: "Inventory event published to Kafka successfully",
      data: {
        event,
        product: productResult.rows[0],
        status: "PUBLISHED",
      },
    });
  } catch (error) {
    console.error("Simulator event publishing failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to publish inventory event",
    });
  }
};
