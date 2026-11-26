
import { z } from "zod";
import { createPurchase, createSale } from "../services/inventory.service.js";

const purchaseSchema = z.object({
  product_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive(),
  unit_cost: z.coerce.number().nonnegative(),
});

const saleSchema = z.object({
  product_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive(),
  unit_sale_price: z.coerce.number().nonnegative(),
});

export const purchaseInventory = async (req, res) => {
  try {
    const validation = purchaseSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase details",
        errors: validation.error.issues,
      });
    }

    const { product_id, quantity, unit_cost } = validation.data;

    const result = await createPurchase({
      productId: product_id,
      quantity,
      unitCost: unit_cost,
    });

    return res.status(201).json({
      success: true,
      message: "Purchase recorded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Purchase error:", error);

    if (error.message.toLowerCase().includes("product")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to record purchase",
    });
  }
};

export const sellInventory = async (req, res) => {
  try {
    const validation = saleSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid sale details",
        errors: validation.error.issues,
      });
    }

    const { product_id, quantity, unit_sale_price } = validation.data;

    const result = await createSale({
      productId: product_id,
      quantity,
      unitSalePrice: unit_sale_price,
    });

    return res.status(201).json({
      success: true,
      message: "Sale recorded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Sale error:", error);

    if (error.message.toLowerCase().includes("product")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to record sale",
    });
  }
};
