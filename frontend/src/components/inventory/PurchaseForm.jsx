
import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import api from "../../api/axios";

const PurchaseForm = ({ onSuccess }) => {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    product_id: "",
    quantity: "",
    unit_cost: "",
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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/inventory/purchase", {
        product_id: Number(formData.product_id),
        quantity: Number(formData.quantity),
        unit_cost: Number(formData.unit_cost),
      });

      setSuccess("Purchase recorded successfully!");

      setFormData({
        product_id: "",
        quantity: "",
        unit_cost: "",
      });

      if (onSuccess) {
        await onSuccess();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to record purchase."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg bg-green-50 p-3 text-green-600">
          <ShoppingCart size={22} />
        </div>

        <div>
          <h2 className="font-semibold text-slate-900">
            Record Purchase
          </h2>
          <p className="text-sm text-slate-500">
            Add stock through a new purchase batch.
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
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-500"
          >
            <option value="">Choose a product</option>

            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Purchase Quantity
          </label>

          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="0.001"
            step="0.001"
            placeholder="Enter quantity"
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Unit Cost (₹)
          </label>

          <input
            type="number"
            name="unit_cost"
            value={formData.unit_cost}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="Enter unit cost"
            required
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-green-500"
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
          disabled={loading}
          className="w-full rounded-lg bg-green-600 px-5 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Recording Purchase..." : "Record Purchase"}
        </button>
      </form>
    </div>
  );
};

export default PurchaseForm;
