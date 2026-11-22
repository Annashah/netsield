import { useLayoutEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthForm from "./AuthForm";
import Layout from "./Layout";
import Dashboard from "./Dashboard";
import Alerts from "./Alerts";
import AskAI from "./AskAI";
import Metrics from "./Metrics";
import { token } from "./api";

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") === "light" ? "light" : "dark");

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      return next;
    });
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthForm mode="login" />} />
        <Route path="/register" element={<AuthForm mode="register" />} />
        <Route element={token() ? <Layout theme={theme} onToggleTheme={toggleTheme} /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/ask" element={<AskAI />} />
          <Route path="/metrics" element={<Metrics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
