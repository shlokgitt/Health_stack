import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: API_BASE });

export const getPhcs = () => api.get("/phcs").then((r) => r.data);
export const getPhc = (id) => api.get(`/phcs/${id}`).then((r) => r.data);
export const getInventoryOverview = () => api.get("/inventory").then((r) => r.data);
export const getInventoryForPhc = (phcId) => api.get(`/inventory/${phcId}`).then((r) => r.data);
export const getAlerts = () => api.get("/alerts").then((r) => r.data);
