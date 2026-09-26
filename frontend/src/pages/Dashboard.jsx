import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getAlerts, getPhcs } from "../services/api.js";

export default function Dashboard() {
  const [phcs, setPhcs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      getPhcs(),
      getAlerts(),
    ])
      .then(([phcData, alertData]) => {
        setPhcs(phcData);
        setAlerts(alertData);
      })
      .catch((err) => {
        setError(
          err.response?.data?.error ||
            err.message ||
            "Failed to load dashboard"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-6 sm:p-8">
        <p className="text-sm text-slate-500">
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 sm:p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-semibold">
            Dashboard unavailable
          </p>

          <p className="mt-1 text-sm">
            {error}. Make sure the backend and database
            are running.
          </p>
        </div>
      </div>
    );
  }

  const criticalAlerts = alerts.filter(
    (alert) => alert.risk_level === "CRITICAL"
  );

  const warningAlerts = alerts.filter(
    (alert) => alert.risk_level === "WARNING"
  );

  const activePhcs = phcs.filter(
    (phc) => phc.is_active
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <p className="text-sm font-medium text-emerald-600">
          National Overview
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Health Resilience Dashboard
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          Monitor primary health centres, medicine inventory
          risk and redistribution opportunities before
          shortages become critical.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="PHCs"
          value={phcs.length}
          description="Reference network"
        />

        <StatCard
          label="Active PHCs"
          value={activePhcs.length}
          description="Operational demo layer"
        />

        <StatCard
          label="Active Alerts"
          value={alerts.length}
          description="Inventory threshold alerts"
        />

        <StatCard
          label="Critical"
          value={criticalAlerts.length}
          description="Immediate attention"
          danger
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Critical Alerts
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Facilities where stock has reached or fallen
                below the minimum threshold.
              </p>
            </div>

            <Link
              to="/inventory"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              View inventory →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {criticalAlerts.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-500">
                No critical alerts right now.
              </div>
            )}

            {criticalAlerts.slice(0, 8).map(
              (alert, index) => (
                <div
                  key={`${alert.phc_id}-${alert.medicine_id}-${index}`}
                  className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {alert.phc_name}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {alert.medicine_name}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-sm font-bold text-red-600">
                      {alert.current_stock} units
                    </p>

                    <p className="text-xs text-slate-500">
                      Minimum: {alert.minimum_stock}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
            Resilience Actions
          </p>

          <h2 className="mt-2 text-lg font-bold text-slate-900">
            Move from detection to action
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Use the operational tools to identify where
            shortages are occurring and find nearby facilities
            with surplus stock.
          </p>

          <div className="mt-5 space-y-3">
            <ActionLink
              to="/map"
              title="Open Resilience Map"
              description="See PHCs geographically"
            />

            <ActionLink
              to="/inventory"
              title="Inspect Inventory"
              description="Review medicine stock levels"
            />

            <ActionLink
              to="/recommendations"
              title="View Recommendations"
              description="Find redistribution opportunities"
            />
          </div>
        </section>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
            Warning
          </p>

          <p className="mt-2 text-2xl font-bold text-amber-700">
            {warningAlerts.length}
          </p>

          <p className="mt-1 text-sm text-amber-800/70">
            medicine records currently within the warning
            threshold.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
            System Status
          </p>

          <p className="mt-2 text-lg font-bold text-emerald-700">
            Monitoring Active
          </p>

          <p className="mt-1 text-sm text-emerald-800/70">
            Inventory and alert endpoints are connected to
            the backend.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  danger,
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        danger
          ? "border-red-200 bg-red-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${
          danger
            ? "text-red-600"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function ActionLink({
  to,
  title,
  description,
}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
    >
      <div>
        <p className="text-sm font-semibold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      <span className="text-slate-400">→</span>
    </Link>
  );
}