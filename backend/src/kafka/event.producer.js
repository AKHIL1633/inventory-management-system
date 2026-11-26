
import { producer } from "../config/kafka.js";
import { env } from "../config/env.js";

export const publishInventoryEvent = async (event) => {
  await producer.send({
    topic: env.kafkaTopic,
    messages: [
      {
        key: String(event.product_id),
        value: JSON.stringify(event),
      },
    ],
  });

  console.log("Inventory event published:", event);
};
