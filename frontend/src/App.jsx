import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        {/* Add more pages here: map view, inventory detail, recommendations, etc. */}
      </Routes>
    </BrowserRouter>
  );
}
