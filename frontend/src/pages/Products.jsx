
import { useEffect, useState } from "react";

import {
  Package,
  RefreshCw,
  Plus,
  X,
  Pencil,
  Trash2,
} from "lucide-react";

import api from "../api/axios";

const initialForm = {
  name: "",
  sku: "",
  description: "",
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState(initialForm);

  // Fetch all products from the backend.
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products");

      setProducts(response.data.data.products);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle form input changes.
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Open the Add Product form.
  const openAddForm = () => {
    setEditingProduct(null);
    setFormData(initialForm);
    setFormError("");
    setShowForm(true);
  };

  // Open the Edit Product form with existing details.
  const openEditForm = (product) => {
    setEditingProduct(product);

    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || "",
    });

    setFormError("");
    setShowForm(true);
  };

  // Close and reset the form.
  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData(initialForm);
    setFormError("");
  };

  // Create or update a product.
  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setFormError("");

    try {
      if (editingProduct) {
        await api.put(
          `/products/${editingProduct.id}`,
          formData
        );
      } else {
        await api.post("/products", formData);
      }

      closeForm();
      await fetchProducts();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          "Unable to save product details."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete a product after user confirmation.
  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/products/${product.id}`);

      await fetchProducts();

      window.alert("Product deleted successfully.");
    } catch (err) {
      window.alert(
        err.response?.data?.message ||
          "Unable to delete product."
      );
    }
  };

  // Calculate total available inventory.
  const totalStock = products.reduce(
    (total, product) =>
      total + Number(product.current_stock || 0),
    0
  );

  return (
    <div className="p-6 md:p-8">

      {/* Page heading and actions */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Products
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your products and monitor available stock.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            onClick={openAddForm}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>
      </div>

      {/* Add and Edit Product Form */}
      {showForm && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {editingProduct
                ? "Edit Product"
                : "Create New Product"}
            </h2>

            <button
              onClick={closeForm}
              className="text-slate-500 hover:text-slate-900"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Product Name
                </label>

                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  SKU
                </label>

                <input
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="Enter unique SKU"
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter product description"
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {formError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {formError}
              </p>
            )}

            <div className="flex gap-3">

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingProduct
                    ? "Save Changes"
                    : "Create Product"}
              </button>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

            </div>
          </form>
        </div>
      )}

      {/* Product Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Products
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {products.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Available Stock
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {totalStock.toLocaleString("en-IN")}
          </p>
        </div>

      </div>

      {/* Product Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">
            Product List
          </h2>
        </div>

        {loading ? (
          <p className="p-6 text-slate-500">
            Loading products...
          </p>
        ) : error ? (
          <p className="p-6 text-red-600">
            {error}
          </p>
        ) : products.length === 0 ? (
          <div className="p-10 text-center">
            <Package
              className="mx-auto text-slate-400"
              size={35}
            />

            <p className="mt-3 font-medium text-slate-700">
              No products found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">
                    Product
                  </th>

                  <th className="px-6 py-4 font-medium">
                    SKU
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Description
                  </th>

                  <th className="px-6 py-4 text-right font-medium">
                    Current Stock
                  </th>

                  <th className="px-6 py-4 text-center font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-50"
                  >

                    <td className="px-6 py-4 font-medium text-slate-900">
                      {product.name}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {product.sku}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {product.description || "—"}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                        {Number(
                          product.current_stock
                        ).toLocaleString("en-IN")}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">

                        <button
                          onClick={() =>
                            openEditForm(product)
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(product)
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}

              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default Products;
