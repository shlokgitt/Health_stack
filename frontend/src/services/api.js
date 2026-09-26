import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getPhcs = (active = false) =>
  api
    .get("/phcs", {
      params: active ? { active: "true" } : {},
    })
    .then((response) => response.data);

export const getPhc = (id) =>
  api.get(`/phcs/${id}`).then((response) => response.data);

export const getInventoryOverview = () =>
  api.get("/inventory").then((response) => response.data);

export const getInventoryForPhc = (phcId) =>
  api
    .get(`/inventory/${phcId}`)
    .then((response) => response.data);

export const getAlerts = () =>
  api.get("/alerts").then((response) => response.data);

export const getRecommendations = ({
  limit = 12,
  medicine_id = "",
} = {}) =>
  api
    .get("/recommendations", {
      params: {
        limit,
        ...(medicine_id ? { medicine_id } : {}),
      },
    })
    .then((response) => response.data);

export const approveTransfer = (transfer) =>
  api
    .post("/transfers", {
      source_phc: transfer.source_phc,
      destination_phc: transfer.destination_phc,
      medicine_id: transfer.medicine_id,
      quantity: transfer.quantity,
      distance_km: transfer.distance_km,
      explanation: transfer.explanation,
    })
    .then((response) => response.data);

export const predictStockout = (payload) =>
  api
    .post("/predictions/stockout", payload)
    .then((response) => response.data);

export const getForecast = (phcId) =>
  api
    .get(`/forecasts/${phcId}`)
    .then((response) => response.data);

export default api;