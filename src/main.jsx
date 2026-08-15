import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App";
import { ReceptionBooking } from "./ReceptionBooking";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Main public site */}
        <Route path="/" element={<App />} />

        {/* Reception / walk-in booking page */}
        <Route path="/reception" element={<ReceptionBooking />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);