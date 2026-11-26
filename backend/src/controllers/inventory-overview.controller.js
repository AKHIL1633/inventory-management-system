
import { getInventoryOverview } from "../services/inventory-overview.service.js";

export const getInventoryOverviewController = async (req, res) => {
  try {
    const inventory = await getInventoryOverview();

    return res.status(200).json({
      success: true,
      message: "Inventory overview retrieved successfully",
      data: {
        inventory,
      },
    });
  } catch (error) {
    console.error("Inventory overview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve inventory overview",
    });
  }
};
