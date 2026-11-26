
import { useEffect, useState } from "react";
import { RefreshCw, Package } from "lucide-react";

import PurchaseForm from "../components/inventory/PurchaseForm";
import SaleForm from "../components/inventory/SaleForm";
import SimulatorForm from "../components/inventory/SimulatorForm";

import api from "../api/axios";

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/inventory/overview");

      setInventory(response.data.data.inventory);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load inventory."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const totalStock = inventory.reduce(
    (total, item) =>
      total + Number(item.current_stock || 0),
    0
  );

  const totalValue = inventory.reduce(
    (total, item) =>
      total + Number(item.inventory_value || 0),
    0
  );

  const formatCurrency = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="p-6 md:p-8">

      {/* Page heading */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Inventory Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor available stock, purchase batches and inventory value.
          </p>
        </div>

        <button
          onClick={fetchInventory}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* Inventory summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-3">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Products
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {inventory.length}
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

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">
            Total Inventory Value
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(totalValue)}
          </p>
        </div>

      </div>

      {/* Purchase and Sale forms */}
      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">

        <PurchaseForm onSuccess={fetchInventory} />

        <SaleForm onSuccess={fetchInventory} />

      </div>

      {/* Kafka simulator */}
      <div className="mb-6">
        <SimulatorForm onSuccess={fetchInventory} />
      </div>

      {/* Current inventory table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-900">
            Current Inventory
          </h2>
        </div>

        {loading ? (
          <p className="p-6 text-slate-500">
            Loading inventory...
          </p>
        ) : error ? (
          <p className="p-6 text-red-600">
            {error}
          </p>
        ) : inventory.length === 0 ? (
          <div className="p-10 text-center">
            <Package
              className="mx-auto text-slate-400"
              size={35}
            />

            <p className="mt-3 font-medium text-slate-700">
              No inventory found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Product</th>
                  <th className="px-6 py-4 font-medium">SKU</th>
                  <th className="px-6 py-4 text-right font-medium">Purchased</th>
                  <th className="px-6 py-4 text-right font-medium">Available Stock</th>
                  <th className="px-6 py-4 text-right font-medium">Inventory Value</th>
                  <th className="px-6 py-4 text-right font-medium">Batches</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {inventory.map((item) => (
                  <tr
                    key={item.product_id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {item.name}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {item.sku}
                    </td>

                    <td className="px-6 py-4 text-right text-slate-600">
                      {Number(item.total_purchased).toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                        {Number(item.current_stock).toLocaleString("en-IN")}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      {formatCurrency(item.inventory_value)}
                    </td>

                    <td className="px-6 py-4 text-right text-slate-600">
                      {item.total_batches}
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

export default Inventory;
