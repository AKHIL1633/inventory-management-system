
import { useCallback, useEffect, useState } from "react";
import { Activity, Wifi, WifiOff } from "lucide-react";
import api from "../api/axios";

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch the latest dashboard metrics.
  const fetchSummary = useCallback(async () => {
    try {
      const response = await api.get("/dashboard/summary");

      setSummary(response.data.data.summary);
      setError("");
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data and establish the authenticated SSE connection.
  useEffect(() => {
    const controller = new AbortController();

    const connectToRealtimeEvents = async () => {
      try {
        await fetchSummary();

        const token = localStorage.getItem("inventory_token");

        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const response = await fetch(
          "http://localhost:5000/api/realtime/events",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "text/event-stream",
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Live connection failed with status ${response.status}`
          );
        }

        if (!response.body) {
          throw new Error("Streaming response is not supported.");
        }

        setConnectionStatus("connected");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";

        while (!controller.signal.aborted) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          const messages = buffer.split("\n\n");
          buffer = messages.pop() || "";

          for (const message of messages) {
            const dataLine = message
              .split("\n")
              .find((line) => line.startsWith("data:"));

            if (!dataLine) {
              continue;
            }

            try {
              const event = JSON.parse(
                dataLine.substring(5).trim()
              );

              if (event.type === "connected") {
                console.log("Live dashboard connection established");
              }

              if (event.type === "inventory.updated") {
                console.log("Inventory update received:", event);

                await fetchSummary();
              }
            } catch (parseError) {
              console.error(
                "Unable to process SSE message:",
                parseError
              );
            }
          }
        }

        if (!controller.signal.aborted) {
          setConnectionStatus("disconnected");
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Realtime connection error:", err);
          setConnectionStatus("disconnected");
        }
      }
    };

    connectToRealtimeEvents();

    return () => {
      controller.abort();
    };
  }, [fetchSummary]);

  const metrics = [
    {
      title: "Total Products",
      value: summary?.total_products,
    },
    {
      title: "Total Stock",
      value: summary?.total_stock,
    },
    {
      title: "Inventory Value",
      value: summary?.inventory_value,
      currency: true,
    },
    {
      title: "Total Revenue",
      value: summary?.total_revenue,
      currency: true,
    },
    {
      title: "Total Cost",
      value: summary?.total_cost,
      currency: true,
    },
    {
      title: "Gross Profit",
      value: summary?.gross_profit,
      currency: true,
    },
  ];

  const formatValue = (value, currency) => {
    const number = Number(value || 0);

    return currency
      ? `₹${number.toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        })}`
      : number.toLocaleString("en-IN", {
          maximumFractionDigits: 3,
        });
  };

  if (loading) {
    return (
      <div className="p-8 text-slate-600">
        Loading dashboard...
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="p-8 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dashboard Overview
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor your inventory and business performance.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm">
          {connectionStatus === "connected" ? (
            <>
              <Wifi size={17} className="text-green-600" />
              <span className="font-medium text-green-700">
                Live Connected
              </span>
            </>
          ) : (
            <>
              <WifiOff size={17} className="text-amber-600" />
              <span className="font-medium text-amber-700">
                {connectionStatus === "connecting"
                  ? "Connecting..."
                  : "Disconnected"}
              </span>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-5 flex items-center justify-between text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <Activity size={16} />
          <span>Real-time inventory monitoring</span>
        </div>

        <span>
          {lastUpdated
            ? `Updated: ${lastUpdated.toLocaleTimeString()}`
            : "Waiting for data..."}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">
              {metric.title}
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-900">
              {formatValue(metric.value, metric.currency)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
