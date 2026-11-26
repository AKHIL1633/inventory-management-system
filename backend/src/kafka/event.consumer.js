
import { consumer } from "../config/kafka.js";
import { env } from "../config/env.js";
import { processInventoryEvent } from "../services/inventory.service.js";
import {
  broadcastDashboardUpdate,
} from "../services/dashboard-events.service.js";

const validateEvent = (event) => {
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    throw new Error("Invalid event payload");
  }

  if (
    typeof event.event_id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      event.event_id
    )
  ) {
    throw new Error("A valid UUID event_id is required");
  }

  if (!["PURCHASE", "SALE"].includes(event.event_type)) {
    throw new Error("event_type must be PURCHASE or SALE");
  }

  if (
    !Number.isInteger(Number(event.product_id)) ||
    Number(event.product_id) <= 0
  ) {
    throw new Error("A valid product_id is required");
  }

  if (
    event.quantity === undefined ||
    !Number.isFinite(Number(event.quantity)) ||
    Number(event.quantity) <= 0
  ) {
    throw new Error("Quantity must be greater than zero");
  }

  if (
    event.unit_price === undefined ||
    !Number.isFinite(Number(event.unit_price)) ||
    Number(event.unit_price) < 0
  ) {
    throw new Error("A valid unit_price is required");
  }

  if (
    event.timestamp !== undefined &&
    Number.isNaN(Date.parse(event.timestamp))
  ) {
    throw new Error("Invalid event timestamp");
  }

  if (
    event.source !== undefined &&
    event.source !== "REST_API"
  ) {
    throw new Error("Invalid event source");
  }
};

export const startConsumer = async () => {
  await consumer.connect();

  await consumer.subscribe({
    topic: env.kafkaTopic,
    fromBeginning: true,
  });

  await consumer.run({
    autoCommit: false,

    eachMessage: async ({ topic, partition, message }) => {
      try {
        const event = JSON.parse(message.value.toString());

        validateEvent(event);

        let shouldBroadcast = false;

        if (event.source === "REST_API") {
          // REST transaction has already updated PostgreSQL.
          // Do not process the same transaction again.
          console.log(
            "REST-originated event acknowledged without reprocessing:",
            event.event_id
          );

          shouldBroadcast = true;
        } else {
          const result = await processInventoryEvent(event);

          if (result.duplicate) {
            console.log("Duplicate event ignored:", event.event_id);
          } else {
            console.log("Event processed:", {
              eventId: event.event_id,
              eventType: event.event_type,
              productId: event.product_id,
            });

            shouldBroadcast = true;
          }
        }

        // Commit only after successful handling.
        await consumer.commitOffsets([
          {
            topic,
            partition,
            offset: (BigInt(message.offset) + 1n).toString(),
          },
        ]);

        // Notify connected dashboards after successful processing.
        if (shouldBroadcast) {
          broadcastDashboardUpdate({
            type: "inventory.updated",
            event_id: event.event_id,
            event_type: event.event_type,
            product_id: Number(event.product_id),
            quantity: Number(event.quantity),
            source: event.source || "KAFKA",
            timestamp: event.timestamp || new Date().toISOString(),
          });

          console.log(
            "Dashboard update broadcast:",
            event.event_id
          );
        }
      } catch (error) {
        console.error(
          "Kafka event processing failed:",
          error.message
        );

        throw error;
      }
    },
  });

  console.log(`Kafka consumer listening on ${env.kafkaTopic}`);
};

export const stopConsumer = async () => {
  await consumer.disconnect();
  console.log("Kafka consumer disconnected");
};
