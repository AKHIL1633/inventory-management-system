
import { useEffect, useState } from "react";
import { RefreshCw, ClipboardList } from "lucide-react";

import api from "../api/axios";

const Ledger = () => {
  const [ledger, setLedger] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data.data.products);
    } catch (err) {
      console.error("Unable to load products:", err);
    }
  };

  const fetchLedger = async () => {
    try {
      setLoading(true);
      setError("");

      const params =
        selectedProduct === "all"
          ? {}
          : { product_id: selectedProduct };

      const response = await api.get("/inventory/ledger", {
        params,
      });

      setLedger(response.data.data.ledger);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load transaction history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchLedger();
  }, [selectedProduct]);

  const formatCurrency = (value) => {
    if (value === null || value === undefined) {
      return "—";
    }

    return `₹${Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (value) =>
    new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <div className="p-6 md:p-8">
      {/* Page heading */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Transaction Ledger
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Track all inventory purchases, sales and financial transactions.
          </p>
        </div>

        <button
          onClick={fetchLedger}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* Filters and transaction count */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Filter by Product
          </label>

          <select
            value={selectedProduct}
            onChange={(event) =>
              setSelectedProduct(event.target.value)
            }
            className="min-w-64 rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500"
          >
            <option value="all">All Products</option>

            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku})
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-slate-500">
          Total Transactions:{" "}
          <span className="font-bold text-slate-900">
            {ledger.length}
          </span>
        </div>
      </div>

      {/* Ledger table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">
            Transaction History
          </h2>
        </div>

        {loading ? (
          <p className="p-6 text-slate-500">
            Loading transactions...
          </p>
        ) : error ? (
          <p className="p-6 text-red-600">
            {error}
          </p>
        ) : ledger.length === 0 ? (
          <div className="p-10 text-center">
            <ClipboardList
              size={36}
              className="mx-auto text-slate-400"
            />

            <p className="mt-3 font-medium text-slate-700">
              No transactions found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-medium">
                    Date
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Type
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Product
                  </th>

                  <th className="px-5 py-4 text-right font-medium">
                    Quantity
                  </th>

                  <th className="px-5 py-4 text-right font-medium">
                    Unit Price
                  </th>

                  <th className="px-5 py-4 text-right font-medium">
                    Cost
                  </th>

                  <th className="px-5 py-4 text-right font-medium">
                    Revenue
                  </th>

                  <th className="px-5 py-4 text-right font-medium">
                    Gross Profit
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {ledger.map((item) => (
                  <tr
                    key={`${item.transaction_type}-${item.transaction_id}`}
                    className="hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {formatDate(item.transaction_date)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.transaction_type === "PURCHASE"
                            ? "bg-green-50 text-green-700"
                            : "bg-orange-50 text-orange-700"
                        }`}
                      >
                        {item.transaction_type}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {item.product_name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {item.sku}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-right font-medium text-slate-700">
                      {Number(item.quantity).toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-600">
                      {formatCurrency(item.unit_price)}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-600">
                      {formatCurrency(item.total_cost)}
                    </td>

                    <td className="px-5 py-4 text-right text-slate-600">
                      {formatCurrency(item.revenue)}
                    </td>

                    <td className="px-5 py-4 text-right font-medium text-slate-700">
                      {formatCurrency(item.gross_profit)}
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

export default Ledger;
