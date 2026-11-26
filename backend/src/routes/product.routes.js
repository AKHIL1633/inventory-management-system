
import { Router } from "express";

import {
  createProductController,
  getProductsController,
  getProductController,
  updateProductController,
  deleteProductController,
} from "../controllers/product.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// All product routes require authentication.
router.use(authenticate);

router.post("/", createProductController);
router.get("/", getProductsController);
router.get("/:id", getProductController);
router.put("/:id", updateProductController);
router.delete("/:id", deleteProductController);

export default router;
