import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { api, token } from "./api";

// Severity is our own lookup (the dataset has none): state this in the report.
export const sev = (l) => (/DDoS|Bot/.test(l) ? "critical" : /Patator|Web/.test(l) ? "high" : "medium");
// Fixes the garbled dash in "Web Attack ï¿½ Brute Force"
export const clean = (l) => l.replace(/ [^\w\s-]+ /, " - ");
const SERVICE = { 21: "FTP", 22: "SSH", 53: "DNS", 80: "HTTP", 443: "HTTPS", 445: "SMB", 3389: "RDP", 8080: "HTTP-alt" };

// Ranked list with a percentage bar behind each row, like Radar
export const Rank = ({ rows, total }) =>
  rows.length ? rows.map(([name, n], i) => (
    <div className="rank" key={name} style={{ "--w": `${(n / total) * 100}%` }}>
      <span>{i + 1}. {name}</span><b>{((n / total) * 100).toFixed(1)}%</b>
    </div>
  )) : <p>Upload a CSV to see this.</p>;

export default function Dashboard() {
  const [counts, setCounts] = useState(null);
  const [extra, setExtra] = useState({ ports: [], flags: {}, odd: 0 });
  const [history, setHistory] = useState([]);
  const [tally, setTally] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/history").then(setHistory);
    const ws = new WebSocket(`ws://localhost:8000/ws/live?token=${token()}`);
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      const attack = d.label !== "BENIGN";
      setTally((t) => {
        const p = t.at(-1) || { benign: 0, attack: 0 };
        return [...t, { id: d.id, benign: p.benign + !attack, attack: p.attack + attack }].slice(-60);
      });
      if (attack) setAlerts((a) => [d, ...a].slice(0, 8));
    };
    return () => ws.close();
  }, []);

  const upload = async (e) => {
    const body = new FormData();
    body.append("file", e.target.files[0]);
    try {
      const r = await api("/predict", { method: "POST", body });
      setCounts(r.counts);
      setExtra({ ports: r.ports ?? [], flags: r.flags ?? {}, odd: r.odd ?? 0 });
      setError("");
      api("/history").then(setHistory);
    } catch (err) { setError(err.message); }
  };

  const remove = (rid = 0) => api(`/history?rid=${rid}`, { method: "DELETE" }).then(() => api("/history").then(setHistory));
  const download = (href, name) => Object.assign(document.createElement("a"), { href, download: name }).click();
  const exportCsv = () => download(
    URL.createObjectURL(new Blob(["class,flows\n" + Object.entries(counts).map(([k, v]) => `${clean(k)},${v}`).join("\n")], { type: "text/csv" })),
    "netshield-report.csv");
  const exportPdf = async () => {
    const r = await fetch("http://localhost:8000/report", { headers: { Authorization: `Bearer ${token()}` } });
    download(URL.createObjectURL(await r.blob()), "netshield-report.pdf");
  };

  const total = counts && Object.values(counts).reduce((a, b) => a + b, 0);
  const attacks = counts && total - (counts.BENIGN || 0);
  const types = counts
    ? Object.entries(counts).filter(([k]) => k !== "BENIGN").sort((a, b) => b[1] - a[1]).map(([k, v]) => [clean(k), v])
    : [];
  const stats = [
    ["Flows analysed", total],
    ["Attacks detected", attacks],
    ["Attack rate", counts && (attacks / total * 100).toFixed(1) + "%"],
    ["Most common attack", types[0]?.[0] ?? (counts && "None")],
  ];
  const pie = counts ? [{ n: "Benign", v: total - attacks, c: "#38bdf8" }, { n: "Attack", v: attacks, c: "#f97316" }] : [{ n: "", v: 1, c: "#26262b" }];
  const ports = extra.ports.map(([p, n]) => [SERVICE[p] ? `${p} (${SERVICE[p]})` : p, n]);
  const flags = Object.entries(extra.flags).sort((a, b) => b[1] - a[1]);
  const trend = [...history].reverse().map(([, , , n, a], i) => ({ upload: i + 1, rate: +(a / n * 100).toFixed(1) }));

  return (
    <>
      <div className="card">
        <h2>Analyse a CSV</h2>
        <input type="file" accept=".csv" onChange={upload} />
        {error && <p style={{ color: "#f87171" }}>{error}</p>}
      </div>

      <div className="cards">
        {stats.map(([label, value]) => (
          <div className="card" key={label}>
            {label}<div className="big">{value ?? "—"}</div>
          </div>
        ))}
      </div>

      <div className="two">
        <div className="card">
          <h2>Traffic share</h2>
          <p className="sub">Benign vs attack flows in the last upload</p>
          <div className="gauge">
            <PieChart width={160} height={160}>
              <Pie data={pie} dataKey="v" innerRadius={50} outerRadius={70} stroke="none">
                {pie.map((p) => <Cell key={p.n} fill={p.c} />)}
              </Pie>
            </PieChart>
            <div>
              <span style={{ color: "#38bdf8" }}>Benign</span>
              <b>{counts ? ((total - attacks) / total * 100).toFixed(1) + "%" : "—"}</b>
              <span style={{ color: "#f97316" }}>Attack</span>
              <b>{counts ? (attacks / total * 100).toFixed(1) + "%" : "—"}</b>
            </div>
          </div>
          {counts && <p className="sub">{extra.odd} benign-labelled flows look unusual compared with normal traffic (Isolation Forest).</p>}
        </div>

        <div className="card">
          <h2>Attack types</h2>
          <p className="sub">Share of attack flows in the last upload</p>
          <Rank rows={types} total={attacks} />
          {counts && <button onClick={exportCsv}>Download report (CSV)</button>}
          {counts && <button onClick={exportPdf}>Download report (PDF)</button>}
        </div>
      </div>

      <div className="card">
        <h2>Live traffic</h2>
        <p className="sub">Running total of flows processed</p>
        <ResponsiveContainer height={240}>
          <LineChart data={tally}>
            <XAxis dataKey="id" stroke="var(--muted)" />
            <YAxis stroke="var(--muted)" />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text)" }} />
            <Line dataKey="benign" stroke="#38bdf8" dot={false} isAnimationActive={false} />
            <Line dataKey="attack" stroke="#f97316" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="two">
        <div className="card">
          <h2>Top targeted ports</h2>
          <p className="sub">Share of attack flows by destination port</p>
          <Rank rows={ports} total={attacks} />
        </div>
        <div className="card">
          <h2>TCP flags in attacks</h2>
          <p className="sub">Share of attack flows with the flag set</p>
          <Rank rows={flags} total={attacks} />
        </div>
      </div>

      <div className="two">
        <div className="card">
          <h2>Live alerts</h2>
          {alerts.length === 0 && <p>No attacks seen yet.</p>}
          {alerts.map((a) => (
            <p key={a.id}>
              <span className={`badge ${sev(a.label)}`}>{sev(a.label)}</span> Flow #{a.id}: {clean(a.label)}
            </p>
          ))}
        </div>

        <div className="card">
          <h2>Recent uploads</h2>
          <p className="sub">Attack rate per upload, oldest to newest</p>
          <ResponsiveContainer height={120}>
            <LineChart data={trend}>
              <XAxis dataKey="upload" stroke="var(--muted)" />
              <YAxis stroke="var(--muted)" unit="%" />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text)" }} />
              <Line dataKey="rate" stroke="#f97316" />
            </LineChart>
          </ResponsiveContainer>
          <table><tbody>
            {history.map(([id, ts, file, n, atk]) => (
              <tr key={id}><td>{ts}</td><td>{file}</td><td>{n} flows</td><td>{atk} attacks</td>
                <td><button title="Remove" onClick={() => remove(id)}>✕</button></td></tr>
            ))}
          </tbody></table>
          {history.length > 0 && <button onClick={() => remove()}>Clear all</button>}
        </div>
      </div>
    </>
  );
}
