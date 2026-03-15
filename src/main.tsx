import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App.tsx";
import PatternsPage from "./components/pages/patterns.tsx";
import "./index.css";

// biome-ignore lint/style/noNonNullAssertion: root element always exists
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/patterns" element={<PatternsPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
