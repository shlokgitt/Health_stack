import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MapView from "./pages/MapView.jsx";
import InventoryView from "./pages/InventoryView.jsx";
import RecommendationsView from "./pages/RecommendationsView.jsx";
import Login from "./pages/Login.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/inventory" element={<InventoryView />} />
              <Route
                path="/recommendations"
                element={<RecommendationsView />}
              />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}