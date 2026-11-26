
import { Router } from "express";

import {
  publishSimulatorEvent,
} from "../controllers/simulator.controller.js";

const router = Router();

// Publish a simulated inventory event to Kafka.
router.post("/event", publishSimulatorEvent);

export default router;
