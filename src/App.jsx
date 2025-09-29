import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import QRgen from "./qrgen";

export default function App() {
  return (
    <Router basename="/qrgenox">
      <div className="p-4">
        {/* Define routes */}
        <Routes>
          <Route path="/" element={<QRgen />} />
          <Route path="/qrcode" element={<QRgen />} />
        </Routes>
      </div>
    </Router>
  );
}
