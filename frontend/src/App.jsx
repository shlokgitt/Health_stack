import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MapView from "./pages/MapView.jsx";
import InventoryView from "./pages/InventoryView.jsx";
import RecommendationsView from "./pages/RecommendationsView.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/inventory" element={<InventoryView />} />
          <Route
            path="/recommendations"
            element={<RecommendationsView />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}