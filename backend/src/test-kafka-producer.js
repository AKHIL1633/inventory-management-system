
import { producer } from "./config/kafka.js";
import { env } from "./config/env.js";
import { randomUUID } from "node:crypto";

const run = async () => {
  try {
    await producer.connect();

    const event = {
      event_id: randomUUID(),
      product_id: 1,
      event_type: "PURCHASE",
      quantity: 25,
      unit_price: 15,
      timestamp: new Date().toISOString(),
    };

    await producer.send({
      topic: env.kafkaTopic,
      messages: [
        {
          key: String(event.product_id),
          value: JSON.stringify(event),
        },
      ],
    });

    console.log("Purchase event published:");
    console.log(JSON.stringify(event, null, 2));
  } catch (error) {
    console.error("Producer test failed:", error.message);
    process.exitCode = 1;
  } finally {
    await producer.disconnect().catch(() => {});
  }
};

run();
