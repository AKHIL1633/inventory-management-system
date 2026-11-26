
import app from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, pool } from "./config/database.js";
import { producer } from "./config/kafka.js";

import { startConsumer, stopConsumer } from "./kafka/event.consumer.js";
import {
  startOutboxPublisher,
  stopOutboxPublisher,
} from "./kafka/outbox.publisher.js";

let server;

const startServer = async () => {
  try {
    await connectDatabase();

    await producer.connect();
    console.log("Kafka producer connected");

    await startConsumer();

    startOutboxPublisher();

    server = app.listen(env.port, () => {
      console.log(`Inventory API running on port ${env.port}`);
      console.log(`Environment: ${env.nodeEnv}`);
      console.log(`Health endpoint: http://localhost:${env.port}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);

    await stopOutboxPublisher().catch(() => {});
    await stopConsumer().catch(() => {});
    await producer.disconnect().catch(() => {});
    await pool.end().catch(() => {});

    process.exit(1);
  }
};

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await stopOutboxPublisher().catch((error) =>
    console.error("Outbox shutdown error:", error.message)
  );

  await stopConsumer().catch((error) =>
    console.error("Consumer shutdown error:", error.message)
  );

  await producer.disconnect().catch((error) =>
    console.error("Producer shutdown error:", error.message)
  );

  await pool.end();

  console.log("Application shut down successfully");
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();
