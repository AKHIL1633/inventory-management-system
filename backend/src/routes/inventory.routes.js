
import { Router } from "express";

import {
  purchaseInventory,
  sellInventory,
} from "../controllers/inventory.controller.js";

import {
  getInventoryOverviewController,
} from "../controllers/inventory-overview.controller.js";

import {
  getInventoryLedgerController,
} from "../controllers/inventory-ledger.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// All inventory operations require authentication.
router.use(authenticate);

// Inventory overview.
router.get("/overview", getInventoryOverviewController);

// Inventory transaction ledger.
router.get("/ledger", getInventoryLedgerController);

// Purchase inventory.
router.post("/purchase", purchaseInventory);

// Sell inventory using FIFO.
router.post("/sale", sellInventory);

export default router;
