import { NavLink, Outlet, useLocation } from "react-router-dom";
import { logout } from "./api";

const TITLES = { "/": "Overview", "/alerts": "Alerts", "/ask": "Ask AI", "/metrics": "Model metrics" };

export default function Layout({ theme, onToggleTheme }) {
  const title = TITLES[useLocation().pathname];
  return (
    <div className="app">
      <nav className="side">
        <h2>NetShield</h2>
        <NavLink to="/" end>Overview</NavLink>
        <NavLink to="/alerts">Alerts</NavLink>
        <NavLink to="/ask">Ask AI</NavLink>
        <NavLink to="/metrics">Model metrics</NavLink>
      </nav>
      <div className="right">
        <header className="top">
          <h1>{title}</h1>
          <div className="top-actions">
            <button type="button" onClick={onToggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <button onClick={logout}>Log out</button>
          </div>
        </header>
        <main className="main"><Outlet /></main>
      </div>
    </div>
  );
}
