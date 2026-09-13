import { useEffect, useState } from "react";
import { getPhcs, getAlerts } from "../services/api.js";

export default function Dashboard() {
  const [phcs, setPhcs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getPhcs(), getAlerts()])
      .then(([phcData, alertData]) => {
        setPhcs(phcData);
        setAlerts(alertData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}. Is the backend running?</div>;

  const criticalAlerts = alerts.filter((a) => a.risk_level === "CRITICAL");

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">National Health Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="PHCs" value={phcs.length} />
        <StatCard label="Active Alerts" value={alerts.length} />
        <StatCard label="Critical Alerts" value={criticalAlerts.length} highlight />
        <StatCard label="States Covered" value={new Set(phcs.map((p) => p.state)).size} />
      </div>

      <h2 className="text-lg font-semibold mb-3">Critical Alerts</h2>
      <div className="space-y-2">
        {criticalAlerts.length === 0 && (
          <p className="text-gray-500">No critical alerts right now.</p>
        )}
        {criticalAlerts.map((a, i) => (
          <div key={i} className="border border-red-300 bg-red-50 rounded-lg p-4">
            <p className="font-medium text-red-700">
              {a.phc_name} — {a.medicine_name}
            </p>
            <p className="text-sm text-gray-600">
              Stock: {a.current_stock} (minimum: {a.minimum_stock})
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div className={`rounded-lg p-4 border ${highlight ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
