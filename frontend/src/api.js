export const API = "http://localhost:8000";
export const token = () => localStorage.getItem("token");
export const logout = () => { localStorage.removeItem("token"); location.href = "/login"; };

export async function api(path, opts = {}) {
  const res = await fetch(API + path, { ...opts, headers: { Authorization: `Bearer ${token()}` } });
  if (res.status === 401) logout();
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}
