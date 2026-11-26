
import { getDashboardSummary } from "../services/dashboard.service.js";

export const getDashboardSummaryController = async (req, res) => {
  try {
    const summary = await getDashboardSummary();

    return res.status(200).json({
      success: true,
      message: "Dashboard summary retrieved successfully",
      data: {
        summary,
      },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard summary",
    });
  }
};
