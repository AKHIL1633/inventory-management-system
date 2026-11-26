
import { z } from "zod";

import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../services/product.service.js";

const productSchema = z.object({
  name: z.string().trim().min(2).max(150),
  sku: z.string().trim().min(2).max(80),
  description: z.string().trim().max(2000).optional().nullable(),
});

const idSchema = z.coerce.number().int().positive();

export const createProductController = async (req, res) => {
  try {
    const validation = productSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid product details",
        errors: validation.error.issues,
      });
    }

    const product = await createProduct(validation.data);

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: { product },
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A product with this SKU already exists",
      });
    }

    console.error("Create product error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create product",
    });
  }
};

export const getProductsController = async (req, res) => {
  try {
    const products = await getAllProducts();

    return res.status(200).json({
      success: true,
      count: products.length,
      data: { products },
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve products",
    });
  }
};

export const getProductController = async (req, res) => {
  try {
    const validation = idSchema.safeParse(req.params.id);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await getProductById(validation.data);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: { product },
    });
  } catch (error) {
    console.error("Get product error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve product",
    });
  }
};

export const updateProductController = async (req, res) => {
  try {
    const idValidation = idSchema.safeParse(req.params.id);
    const bodyValidation = productSchema.safeParse(req.body);

    if (!idValidation.success || !bodyValidation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID or product details",
      });
    }

    const product = await updateProduct(
      idValidation.data,
      bodyValidation.data
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: { product },
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A product with this SKU already exists",
      });
    }

    console.error("Update product error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update product",
    });
  }
};

export const deleteProductController = async (req, res) => {
  try {
    const validation = idSchema.safeParse(req.params.id);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const deleted = await deleteProduct(validation.data);

    if (!deleted) {
      return res.status(409).json({
        success: false,
        message:
          "Product not found or cannot be deleted because inventory or sales records reference it",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete product",
    });
  }
};
