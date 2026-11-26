
import { getInventoryLedger } from "../services/inventory-ledger.service.js";

export const getInventoryLedgerController = async (req, res) => {
  try {
    const { product_id } = req.query;

    let productId = null;

    if (product_id !== undefined) {
      productId = Number(product_id);

      if (!Number.isSafeInteger(productId) || productId <= 0) {
        return res.status(400).json({
          success: false,
          message: "product_id must be a positive integer",
        });
      }
    }

    const ledger = await getInventoryLedger(productId);

    return res.status(200).json({
      success: true,
      message: "Inventory ledger retrieved successfully",
      data: {
        ledger,
      },
    });
  } catch (error) {
    console.error("Inventory ledger error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve inventory ledger",
    });
  }
};
