import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";

const API = "http://localhost:8000";

export default function AuthForm({ mode }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const nav = useNavigate();
  const login = mode === "login";

  const submit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.detail || "Something went wrong");
    if (mode === "login") {
      localStorage.setItem("token", data.token);
      location.href = "/";
    } else nav("/login");
  };

  return (
    <div className="auth">
      <div className="auth-card">
        <aside className="auth-side">
          <h1>NetShield</h1>
          <p>Machine-learning intrusion detection for network traffic.</p>
          <nav className="auth-tabs">
            <Link to="/login" className={login ? "on" : ""}>Log in</Link>
            <Link to="/register" className={login ? "" : "on"}>Register</Link>
          </nav>
        </aside>

        <form onSubmit={submit} className="auth-form">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5">
            <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" />
          </svg>
          <h2>{login ? "Welcome back" : "Create your account"}</h2>

          <label>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>
            <input placeholder="Username" value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </label>
          <label>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" />
            </svg>
            <input type="password" placeholder="Password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>

          {error && <p className="err">{error}</p>}
          <button>{login ? "Log in" : "Register"}</button>
        </form>
      </div>
    </div>
  );
}
