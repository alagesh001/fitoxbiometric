import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import BiometricDashboard from "./biometricdash";

export default function App() {
  return (
    <Router>
      <div className="p-4">
        {/* Simple navigation */}
        <nav className="flex gap-4 mb-6">
          {/* <Link to="/" className="text-blue-600 hover:underline">
            Home
          </Link> */}
          {/* <Link to="/" className="text-blue-600 hover:underline">
            Biometric Dashboard
          </Link> */}
        </nav>

        {/* Define routes */}
        <Routes>
          {/* <Route path="/" element={<h1 className="text-xl">Welcome to FITOX Biometric Handle</h1>} /> */}
          <Route path="/" element={<BiometricDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}
