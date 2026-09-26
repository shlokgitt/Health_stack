import { useEffect, useState } from "react";
import {
  approveTransfer,
  getRecommendations,
} from "../services/api.js";

export default function RecommendationsView() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState(null);
  const [approved, setApproved] = useState(new Set());

  useEffect(() => {
    loadRecommendations();
  }, []);

  async function loadRecommendations() {
    try {
      setLoading(true);
      setError("");

      const result = await getRecommendations({
        limit: 12,
      });

      setRecommendations(
        result.recommendations || []
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to load recommendations"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(recommendation) {
    const key = getRecommendationKey(recommendation);

    try {
      setApproving(key);

      await approveTransfer(recommendation);

      setApproved((previous) => {
        const next = new Set(previous);
        next.add(key);
        return next;
      });
    } catch (err) {
      alert(
        err.response?.data?.error ||
          "Failed to approve transfer"
      );
    } finally {
      setApproving(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-violet-600">
            Decision Support
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Redistribution Recommendations
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Identify facilities at shortage risk and match them
            with nearby PHCs that have surplus medicine stock.
          </p>
        </div>

        <button
          onClick={loadRecommendations}
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Refresh Recommendations
        </button>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">
            Generating redistribution recommendations...
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-semibold">
            Recommendation service error
          </p>

          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      {!loading &&
        !error &&
        recommendations.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-xl text-emerald-600">
              ✓
            </div>

            <h2 className="mt-4 font-semibold text-slate-900">
              No transfers required
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              No active PHC currently has a shortage that can
              be matched with a nearby surplus facility.
            </p>
          </div>
        )}

      {!loading && !error && recommendations.length > 0 && (
        <div className="grid gap-5 xl:grid-cols-2">
          {recommendations.map((recommendation) => {
            const key =
              getRecommendationKey(recommendation);

            const isApproved = approved.has(key);
            const isApproving = approving === key;

            return (
              <RecommendationCard
                key={key}
                recommendation={recommendation}
                isApproved={isApproved}
                isApproving={isApproving}
                onApprove={() =>
                  handleApprove(recommendation)
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecommendationCard({
  recommendation,
  isApproved,
  isApproving,
  onApprove,
}) {
  const riskClass =
    recommendation.risk_level === "CRITICAL"
      ? "bg-red-50 text-red-700 ring-red-600/20"
      : recommendation.risk_level === "HIGH"
      ? "bg-orange-50 text-orange-700 ring-orange-600/20"
      : "bg-amber-50 text-amber-700 ring-amber-600/20";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              Recommended Transfer
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {recommendation.medicine_name}
            </h2>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${riskClass}`}
          >
            {recommendation.risk_level}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <Facility
            label="SOURCE"
            name={recommendation.source_phc_name}
            district={recommendation.source_district}
            stock={recommendation.source_stock}
          />

          <div className="hidden text-center sm:block">
            <div className="text-2xl text-slate-300">
              →
            </div>

            <p className="text-xs font-medium text-slate-400">
              {recommendation.distance_km} km
            </p>
          </div>

          <Facility
            label="DESTINATION"
            name={recommendation.destination_phc_name}
            district={recommendation.destination_district}
            stock={recommendation.destination_stock}
            danger
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric
            label="Transfer"
            value={`${recommendation.quantity} ${recommendation.unit || "units"}`}
          />

          <Metric
            label="Risk"
            value={`${recommendation.shortage_risk_pct}%`}
          />

          <Metric
            label="Days left"
            value={
              recommendation.days_remaining == null
                ? "—"
                : `${recommendation.days_remaining} d`
            }
          />

          <Metric
            label="Distance"
            value={`${recommendation.distance_km} km`}
          />
        </div>

        <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50 p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-sm text-white">
              AI
            </span>

            <p className="text-sm font-semibold text-violet-900">
              AI Recommendation Explanation
            </p>
          </div>

          <p className="mt-3 text-sm leading-6 text-violet-950/80">
            {recommendation.explanation}
          </p>
        </div>

        <button
          disabled={isApproved || isApproving}
          onClick={onApprove}
          className={`mt-5 w-full rounded-lg px-4 py-3 text-sm font-semibold transition ${
            isApproved
              ? "cursor-default bg-emerald-100 text-emerald-700"
              : "bg-slate-900 text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
          }`}
        >
          {isApproved
            ? "✓ Transfer Approved"
            : isApproving
            ? "Approving..."
            : "Approve Transfer"}
        </button>
      </div>
    </div>
  );
}

function Facility({
  label,
  name,
  district,
  stock,
  danger,
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        danger
          ? "border-red-100 bg-red-50"
          : "border-emerald-100 bg-emerald-50"
      }`}
    >
      <p
        className={`text-[10px] font-bold tracking-widest ${
          danger
            ? "text-red-500"
            : "text-emerald-600"
        }`}
      >
        {label}
      </p>

      <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-900">
        {name}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {district}
      </p>

      <p className="mt-3 text-xs text-slate-500">
        Current stock
      </p>

      <p
        className={`text-lg font-bold ${
          danger
            ? "text-red-600"
            : "text-emerald-600"
        }`}
      >
        {stock}
      </p>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function getRecommendationKey(recommendation) {
  return [
    recommendation.source_phc,
    recommendation.destination_phc,
    recommendation.medicine_id,
  ].join("-");
}