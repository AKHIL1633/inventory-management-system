
import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";

import api from "../../api/axios";

const SaleForm = ({ onSuccess }) => {
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "",
    unit_sale_price: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products");
        setProducts(response.data.data.products);
      } catch {
        setError("Unable to load products.");
      }
    };

    fetchProducts();
  }, []);

  const selectedProduct = products.find(
    (product) => String(product.id) === formData.product_id
  );

  const availableStock = Number(
    selectedProduct?.current_stock || 0
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const quantity = Number(formData.quantity);

      if (quantity > availableStock) {
        setError(
          `Insufficient stock. Available quantity: ${availableStock}`
        );
        return;
      }

      const response = await api.post("/inventory/sale", {
        product_id: Number(formData.product_id),
        quantity,
        unit_sale_price: Number(formData.unit_sale_price),
      });

      setSuccess(
        response.data.message || "Sale recorded successfully!"
      );

      setFormData({
        product_id: "",
        quantity: "",
        unit_sale_price: "",
      });

      if (onSuccess) {
        await onSuccess();
      }

      // Refresh product stock values for the next sale.
      const productsResponse = await api.get("/products");
      setProducts(productsResponse.data.data.products);

    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to record sale."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg bg-orange-50 p-3 text-orange-600">
          <ShoppingBag size={22} />
        </div>

        <div>
          <h2 className="font-semibold text-slate-900">
            Record Sale
          </h2>

          <p className="text-sm text-slate-500">
            Sell products using FIFO inventory costing.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Select Product
          </label>

          <select
            name="product_id"
            value={formData.product_id}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-orange-500"
          >
            <option value="">Choose a product</option>

            {products.map((product) => (
              <option
                key={product.id}
                value={product.id}
                disabled={Number(product.current_stock) <= 0}
              >
                {product.name} ({product.sku})
              </option>
            ))}
          </select>
        </div>

        {selectedProduct && (
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-sm text-slate-600">
              Available Stock
            </p>

            <p className="mt-1 text-xl font-bold text-blue-700">
              {availableStock.toLocaleString("en-IN")}
            </p>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Sale Quantity
          </label>

          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="0.001"
            step="0.001"
            max={availableStock}
            placeholder="Enter quantity to sell"
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Selling Price Per Unit (₹)
          </label>

          <input
            type="number"
            name="unit_sale_price"
            value={formData.unit_sale_price}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="Enter selling price"
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-orange-500"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !formData.product_id}
          className="w-full rounded-lg bg-orange-600 px-5 py-3 font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Processing Sale..." : "Record Sale"}
        </button>

      </form>
    </div>
  );
};

export default SaleForm;
