
import { pool } from "../config/database.js";
import { producer } from "../config/kafka.js";
import { env } from "../config/env.js";

let isRunning = false;
let workerPromise = null;

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

// Publish one pending event at a time.
const publishNextEvent = async () => {
  const client = await pool.connect();

  let eventId = null;

  try {
    await client.query("BEGIN");

    // Lock one pending event to prevent concurrent publishers
    // from publishing the same row simultaneously.
    const result = await client.query(
      `SELECT id, event_id, aggregate_id, payload
       FROM inventory_outbox
       WHERE status = 'PENDING'
       ORDER BY created_at ASC, id ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED`
    );

    if (result.rowCount === 0) {
      await client.query("COMMIT");
      return false;
    }

    const event = result.rows[0];
    eventId = event.id;

    // Identify this event as originating from the REST API.
    const payload = {
      ...event.payload,
      source: "REST_API",
    };

    await producer.send({
      topic: env.kafkaTopic,
      messages: [
        {
          key: String(event.aggregate_id),
          value: JSON.stringify(payload),
        },
      ],
    });

    await client.query(
      `UPDATE inventory_outbox
       SET status = 'PUBLISHED',
           published_at = NOW(),
           attempts = attempts + 1,
           last_error = NULL
       WHERE id = $1`,
      [event.id]
    );

    await client.query("COMMIT");

    console.log("Outbox event published:", event.event_id);

    return true;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});

    if (eventId !== null) {
      await pool.query(
        `UPDATE inventory_outbox
         SET attempts = attempts + 1,
             last_error = $2
         WHERE id = $1
           AND status = 'PENDING'`,
        [eventId, error.message]
      ).catch((updateError) => {
        console.error("Failed to record outbox error:", updateError);
      });
    }

    console.error("Outbox publishing failed:", error.message);

    return false;
  } finally {
    client.release();
  }
};

// Continuously check for pending events.
const runPublisher = async () => {
  while (isRunning) {
    const published = await publishNextEvent();

    if (!published) {
      await sleep(3000);
    }
  }
};

export const startOutboxPublisher = () => {
  if (isRunning) return;

  isRunning = true;

  workerPromise = runPublisher().catch((error) => {
    console.error("Outbox publisher stopped unexpectedly:", error);
  });

  console.log("Outbox publisher started");
};

export const stopOutboxPublisher = async () => {
  isRunning = false;

  if (workerPromise) {
    await workerPromise;
    workerPromise = null;
  }

  console.log("Outbox publisher stopped");
};
