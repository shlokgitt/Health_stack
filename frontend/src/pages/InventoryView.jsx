import { useEffect, useMemo, useState } from "react";
import { getInventoryOverview } from "../services/api.js";

export default function InventoryView() {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    try {
      setLoading(true);
      setError("");

      const data = await getInventoryOverview();
      setInventory(data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to load inventory"
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredInventory = useMemo(() => {
    const query = search.trim().toLowerCase();

    return inventory.filter((item) => {
      const matchesSearch =
        !query ||
        item.phc_name?.toLowerCase().includes(query) ||
        item.medicine_name?.toLowerCase().includes(query) ||
        item.phc_id?.toLowerCase().includes(query);

      const matchesRisk =
        riskFilter === "ALL" ||
        item.risk_level === riskFilter;

      return matchesSearch && matchesRisk;
    });
  }, [inventory, search, riskFilter]);

  const critical = inventory.filter(
    (item) => item.risk_level === "CRITICAL"
  ).length;

  const warning = inventory.filter(
    (item) => item.risk_level === "WARNING"
  ).length;

  const lowRisk = inventory.filter(
    (item) => item.risk_level === "LOW_RISK"
  ).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-blue-600">
          Resource Monitoring
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Medicine Inventory
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Monitor the latest medicine stock levels across active
          primary health centres.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <InventoryStat
          label="Critical"
          value={critical}
          className="text-red-600"
        />

        <InventoryStat
          label="Warning"
          value={warning}
          className="text-amber-600"
        />

        <InventoryStat
          label="Low Risk"
          value={lowRisk}
          className="text-emerald-600"
        />
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row">
        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search PHC, district or medicine..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
        />

        <select
          value={riskFilter}
          onChange={(event) =>
            setRiskFilter(event.target.value)
          }
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
        >
          <option value="ALL">All risk levels</option>
          <option value="CRITICAL">Critical</option>
          <option value="WARNING">Warning</option>
          <option value="LOW_RISK">Low Risk</option>
        </select>

        <button
          onClick={loadInventory}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading inventory...
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-semibold">
            Failed to load inventory
          </p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <TableHead>PHC</TableHead>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Minimum</TableHead>
                  <TableHead>Risk</TableHead>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((item, index) => (
                  <tr
                    key={`${item.phc_id}-${item.medicine_id}-${index}`}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900">
                        {item.phc_name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {item.phc_id}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-800">
                        {item.medicine_name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {item.medicine_id}
                      </p>
                    </td>

                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {item.current_stock}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {item.minimum_stock}
                    </td>

                    <td className="px-4 py-4">
                      <RiskBadge
                        risk={item.risk_level}
                      />
                    </td>
                  </tr>
                ))}

                {filteredInventory.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      No inventory records match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
            Showing {filteredInventory.length} of{" "}
            {inventory.length} inventory records
          </div>
        </div>
      )}
    </div>
  );
}

function InventoryStat({
  label,
  value,
  className,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className={`mt-1 text-2xl font-bold ${className}`}>
        {value}
      </p>
    </div>
  );
}

function TableHead({ children }) {
  return (
    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function RiskBadge({ risk }) {
  const config = {
    CRITICAL: {
      label: "Critical",
      className:
        "bg-red-50 text-red-700 ring-red-600/20",
    },
    WARNING: {
      label: "Warning",
      className:
        "bg-amber-50 text-amber-700 ring-amber-600/20",
    },
    LOW_RISK: {
      label: "Low Risk",
      className:
        "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    },
  };

  const current =
    config[risk] || {
      label: risk || "Unknown",
      className:
        "bg-slate-100 text-slate-600 ring-slate-500/20",
    };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${current.className}`}
    >
      {current.label}
    </span>
  );
}