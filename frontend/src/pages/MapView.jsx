import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import { getAlerts, getPhcs } from "../services/api.js";

function getRisk(phcId, alerts) {
  const phcAlerts = alerts.filter(
    (alert) => alert.phc_id === phcId
  );

  if (
    phcAlerts.some(
      (alert) => alert.risk_level === "CRITICAL"
    )
  ) {
    return "CRITICAL";
  }

  if (phcAlerts.length > 0) {
    return "WARNING";
  }

  return "NORMAL";
}

function riskStyle(risk) {
  if (risk === "CRITICAL") {
    return {
      color: "#dc2626",
      fillColor: "#ef4444",
    };
  }

  if (risk === "WARNING") {
    return {
      color: "#d97706",
      fillColor: "#f59e0b",
    };
  }

  return {
    color: "#15803d",
    fillColor: "#22c55e",
  };
}

export default function MapView() {
  const [phcs, setPhcs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getPhcs(true),
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
            "Failed to load map data"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const validPhcs = useMemo(
    () =>
      phcs.filter(
        (phc) =>
          Number.isFinite(Number(phc.latitude)) &&
          Number.isFinite(Number(phc.longitude))
      ),
    [phcs]
  );

  const center = useMemo(() => {
    if (validPhcs.length === 0) {
      return [26.8467, 80.9462];
    }

    const lat =
      validPhcs.reduce(
        (sum, phc) => sum + Number(phc.latitude),
        0
      ) / validPhcs.length;

    const lng =
      validPhcs.reduce(
        (sum, phc) => sum + Number(phc.longitude),
        0
      ) / validPhcs.length;

    return [lat, lng];
  }, [validPhcs]);

  if (loading) {
    return (
      <div className="p-6 sm:p-8">
        <p className="text-sm text-slate-500">
          Loading PHC map...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 sm:p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-semibold">Unable to load map</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const criticalCount = validPhcs.filter(
    (phc) => getRisk(phc.phc_id, alerts) === "CRITICAL"
  ).length;

  const warningCount = validPhcs.filter(
    (phc) => getRisk(phc.phc_id, alerts) === "WARNING"
  ).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <p className="text-sm font-medium text-emerald-600">
          PHC Network
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Resilience Map
        </h1>

        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Operational PHCs are displayed geographically. Marker
          colors show the current inventory risk derived from active
          stock alerts.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MapStat
          label="PHCs"
          value={validPhcs.length}
        />

        <MapStat
          label="Critical"
          value={criticalCount}
          danger
        />

        <MapStat
          label="Warning"
          value={warningCount}
          warning
        />

        <MapStat
          label="Normal"
          value={
            validPhcs.length -
            criticalCount -
            warningCount
          }
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-[520px] w-full">
          <MapContainer
            center={center}
            zoom={7}
            scrollWheelZoom={true}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {validPhcs.map((phc) => {
              const risk = getRisk(
                phc.phc_id,
                alerts
              );

              const style = riskStyle(risk);

              return (
                <CircleMarker
                  key={phc.phc_id}
                  center={[
                    Number(phc.latitude),
                    Number(phc.longitude),
                  ]}
                  radius={8}
                  pathOptions={{
                    color: style.color,
                    fillColor: style.fillColor,
                    fillOpacity: 0.8,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="min-w-[190px]">
                      <p className="font-semibold text-slate-900">
                        {phc.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {phc.district}, {phc.state}
                      </p>

                      <div className="mt-3 border-t pt-3">
                        <p className="text-xs text-slate-500">
                          PHC ID
                        </p>

                        <p className="text-sm font-medium">
                          {phc.phc_id}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          Current risk
                        </p>

                        <p
                          className={`text-sm font-bold ${
                            risk === "CRITICAL"
                              ? "text-red-600"
                              : risk === "WARNING"
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {risk}
                        </p>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        <div className="flex flex-wrap items-center gap-5 border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
          <Legend
            color="bg-red-500"
            label="Critical"
          />

          <Legend
            color="bg-amber-500"
            label="Warning"
          />

          <Legend
            color="bg-emerald-500"
            label="Normal"
          />
        </div>
      </div>
    </div>
  );
}

function MapStat({
  label,
  value,
  danger,
  warning,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 text-2xl font-bold ${
          danger
            ? "text-red-600"
            : warning
            ? "text-amber-600"
            : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-3 w-3 rounded-full ${color}`}
      />
      {label}
    </div>
  );
}