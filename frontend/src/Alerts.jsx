import { useState, useEffect, Fragment } from "react";
import { api } from "./api";
import { sev, clean } from "./Dashboard";
import "./metrics.css";

const STATUS = { new: "New", ack: "Acknowledged", fp: "False positive" };

export default function Alerts() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("all");
  const [notes, setNotes] = useState({});

  const load = () => api("/alerts").then(setRows);
  useEffect(() => { load(); }, []);

  const mark = (id, status) => api(`/alerts/${id}?status=${status}`, { method: "POST" }).then(load);
  const explain = async (id, label) => {
    const q = `In two sentences, explain what a ${clean(label)} attack is and what to do about it.`;
    try { setNotes({ ...notes, [id]: (await api(`/ask?q=${encodeURIComponent(q)}`)).answer }); }
    catch (err) { setNotes({ ...notes, [id]: err.message }); }
  };

  const shown = rows.filter(([, , label]) => filter === "all" || sev(label) === filter);

  return (
    <>
      <div className="tabs">
        {["all", "critical", "high", "medium"].map((f) => (
          <button key={f} className={f === filter ? "on" : ""} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="card">
        <h2>Alerts</h2>
        <p className="sub">Raised by the live stream on the Overview page. Mark each one as acknowledged or a false positive.</p>
        {shown.length === 0 && <p>No alerts yet. Open the Overview page to start the live stream.</p>}
        <table className="rows"><tbody>
          {shown.map(([id, flow, label, status, ts]) => (
            <Fragment key={id}>
              <tr>
                <td>{ts}</td>
                <td><span className={`badge ${sev(label)}`}>{sev(label)}</span></td>
                <td>Flow #{flow}: {clean(label)}</td>
                <td>{STATUS[status]}</td>
                <td style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => mark(id, "ack")}>Acknowledge</button>
                  <button onClick={() => mark(id, "fp")}>False positive</button>
                  <button onClick={() => explain(id, label)}>Explain</button>
                </td>
              </tr>
              {notes[id] && <tr><td colSpan={5} style={{ color: "var(--muted)" }}>{notes[id]}</td></tr>}
            </Fragment>
          ))}
        </tbody></table>
      </div>
    </>
  );
}
