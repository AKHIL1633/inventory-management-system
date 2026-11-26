
import { randomUUID } from "node:crypto";

export const addOutboxEvent = async (
  client,
  { eventType, productId, quantity, unitPrice, timestamp }
) => {
  const eventId = randomUUID();

  const event = {
    event_id: eventId,
    event_type: eventType,
    product_id: Number(productId),
    quantity: Number(quantity),
    unit_price: Number(unitPrice),
    timestamp: timestamp || new Date().toISOString(),
  };

  await client.query(
    `INSERT INTO inventory_outbox (
       event_id,
       event_type,
       aggregate_type,
       aggregate_id,
       payload
     )
     VALUES ($1, $2, 'PRODUCT', $3, $4::jsonb)`,
    [
      eventId,
      eventType,
      productId,
      JSON.stringify(event),
    ]
  );

  return event;
};
