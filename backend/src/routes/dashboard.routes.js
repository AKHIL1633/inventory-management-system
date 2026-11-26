
import { Router } from "express";

import {
  getDashboardSummaryController,
} from "../controllers/dashboard.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Dashboard data requires authentication.
router.use(authenticate);

router.get("/summary", getDashboardSummaryController);

export default router;
