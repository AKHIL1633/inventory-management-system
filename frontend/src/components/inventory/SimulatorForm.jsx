
import { useEffect, useState } from "react";
import { Radio, Send, Activity } from "lucide-react";

import api from "../../api/axios";

const SimulatorForm = ({ onSuccess }) => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    product_id: "",
    event_type: "PURCHASE",
    quantity: "",
    unit_price: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [publishedEvent, setPublishedEvent] = useState(null);

  // Fetch available products.
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products");
        setProducts(response.data.data.products);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load products."
        );
      } finally {
        setLoadingProducts(false);
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

    setError("");
    setMessage("");
    setPublishedEvent(null);

    if (!formData.product_id) {
      setError("Please select a product.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post("/simulator/event", {
        product_id: Number(formData.product_id),
        event_type: formData.event_type,
        quantity: Number(formData.quantity),
        unit_price: Number(formData.unit_price),
      });

      setMessage(response.data.message);
      setPublishedEvent(response.data.data.event);

      setFormData((previous) => ({
        ...previous,
        quantity: "",
        unit_price: "",
      }));

      // Refresh inventory after the consumer has had time
      // to process the Kafka event.
      window.setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to publish Kafka event."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg bg-purple-50 p-3">
          <Radio className="text-purple-600" size={22} />
        </div>

        <div>
          <h2 className="font-semibold text-slate-900">
            Kafka Event Simulator
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Publish real-time inventory events through Kafka.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Product selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Select Product
          </label>

          <select
            name="product_id"
            value={formData.product_id}
            onChange={handleChange}
            required
            disabled={loadingProducts}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          >
            <option value="">
              {loadingProducts
                ? "Loading products..."
                : "Choose a product"}
            </option>

            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku})
              </option>
            ))}
          </select>
        </div>

        {/* Event type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Event Type
          </label>

          <select
            name="event_type"
            value={formData.event_type}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          >
            <option value="PURCHASE">Purchase</option>
            <option value="SALE">Sale</option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Quantity
          </label>

          <input
            type="number"
            name="quantity"
            min="0.001"
            step="0.001"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="Enter quantity"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        {/* Unit price */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            {formData.event_type === "PURCHASE"
              ? "Purchase Unit Cost (₹)"
              : "Sale Unit Price (₹)"}
          </label>

          <input
            type="number"
            name="unit_price"
            min="0"
            step="0.01"
            value={formData.unit_price}
            onChange={handleChange}
            placeholder="Enter unit price"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Published message */}
        {message && publishedEvent && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
              <Activity size={17} />
              Event published successfully
            </div>

            <p className="mt-2 text-xs text-green-700">
              {message}
            </p>

            <p className="mt-2 break-all text-xs text-slate-600">
              Event ID: {publishedEvent.event_id}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Type: {publishedEvent.event_type}
              {" | "}
              Quantity: {publishedEvent.quantity}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Published to Kafka. Inventory refresh is requested;
              consumer processing happens asynchronously.
            </p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitting || loadingProducts}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={17} />

          {submitting
            ? "Publishing Event..."
            : "Publish Kafka Event"}
        </button>

      </form>
    </div>
  );
};

export default SimulatorForm;
