
import { Router } from "express";
import { addDashboardClient } from "../services/dashboard-events.service.js";

const router = Router();

router.get("/events", (req, res) => {
  // Configure the response for Server-Sent Events.
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.flushHeaders();

  // Register this browser connection.
  addDashboardClient(res);

  // Tell the browser that the connection is established.
  res.write(
    `data: ${JSON.stringify({
      type: "connected",
      message: "Live dashboard connection established",
    })}\n\n`
  );

  // Keep the connection alive.
  const heartbeat = setInterval(() => {
    if (!res.writableEnded && !res.destroyed) {
      res.write(": heartbeat\n\n");
    }
  }, 25000);

  // Stop the heartbeat when the browser disconnects.
  res.on("close", () => {
    clearInterval(heartbeat);
  });
});

export default router;
