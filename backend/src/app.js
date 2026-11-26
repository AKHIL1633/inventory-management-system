
import express from "express";
import cors from "cors";

import { env } from "./config/env.js";

import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import simulatorRoutes from "./routes/simulator.routes.js";
import realtimeRoutes from "./routes/realtime.routes.js";

import { authenticate } from "./middleware/auth.middleware.js";

const app = express();

app.use(cors({ origin: env.frontendUrl }));
app.use(express.json());

// Public health endpoint.
app.use("/health", healthRoutes);

// Authentication endpoints.
app.use("/api/auth", authRoutes);

// Protected application endpoints.
app.use("/api/products", authenticate, productRoutes);
app.use("/api/inventory", authenticate, inventoryRoutes);
app.use("/api/dashboard", authenticate, dashboardRoutes);

// Protected Kafka simulator endpoint.
app.use("/api/simulator", authenticate, simulatorRoutes);

// Protected real-time dashboard endpoint.
app.use("/api/realtime", authenticate, realtimeRoutes);

// Protected user profile endpoint.
app.get("/api/auth/me", authenticate, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Authentication successful",
    user: req.user,
  });
});

// Handle unknown routes.
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;
