import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { api } from "./api";
import { Rank, clean } from "./Dashboard";
import "./metrics.css";

const SKIP = ["accuracy", "macro avg", "weighted avg"];
const pct = (x) => (x * 100).toFixed(1);

export default function Metrics() {
  const [res, setRes] = useState(null);
  const [imp, setImp] = useState([]);
  const [pick, setPick] = useState("");
  useEffect(() => {
    api("/metrics").then((r) => { setRes(r); setPick(Object.keys(r)[0]); });
    api("/importance").then(setImp);
  }, []);
  if (!res) return <p>Loading…</p>;

  const { report, cm } = res[pick];
  const labels = Object.keys(report).filter((k) => !SKIP.includes(k));
  const stats = [
    ["Accuracy", pct(report.accuracy) + "%"],
    ["Macro F1", pct(report["macro avg"]["f1-score"]) + "%"],
    ["Test flows", report["macro avg"].support],
  ];
  const compare = Object.entries(res).map(([name, { report: r }]) => ({
    name, Accuracy: +pct(r.accuracy), "Macro F1": +pct(r["macro avg"]["f1-score"]),
  }));

  return (
    <>
      <div className="two">
        <div className="card">
          <h2>Model comparison</h2>
          <p className="sub">Accuracy is high for both, but macro F1 shows the weak rare classes.</p>
          <ResponsiveContainer height={200}>
            <BarChart data={compare}>
              <XAxis dataKey="name" stroke="var(--muted)" />
              <YAxis stroke="var(--muted)" domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", color: "var(--text)" }} />
              <Legend />
              <Bar dataKey="Accuracy" fill="#38bdf8" />
              <Bar dataKey="Macro F1" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h2>Top features</h2>
          <p className="sub">Share of the Random Forest's total feature importance</p>
          <Rank rows={imp} total={1} />
        </div>
      </div>

      <div className="tabs">
        {Object.keys(res).map((n) => (
          <button key={n} className={n === pick ? "on" : ""} onClick={() => setPick(n)}>{n}</button>
        ))}
      </div>

      <div className="cards">
        {stats.map(([label, value]) => (
          <div className="card" key={label}>{label}<div className="big">{value}</div></div>
        ))}
      </div>

      <div className="card">
        <h2>Scores per class</h2>
        <p className="sub">20% test split. Rare classes (e.g. SQL Injection) have very few samples, so their scores are unreliable.</p>
        <table className="rows">
          <thead><tr><th>Class</th><th>Precision</th><th>Recall</th><th>F1</th><th></th><th>Samples</th></tr></thead>
          <tbody>{labels.map((l) => (
            <tr key={l}>
              <td>{clean(l)}</td><td>{pct(report[l].precision)}%</td><td>{pct(report[l].recall)}%</td>
              <td>{pct(report[l]["f1-score"])}%</td>
              <td><div className="bar"><i style={{ width: pct(report[l]["f1-score"]) + "%" }} /></div></td>
              <td>{report[l].support}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <div className="card">
        <h2>Confusion matrix</h2>
        <p className="sub">Rows are the actual class, columns the predicted class in the same order. Blue is correct, orange is a mistake.</p>
        <table className="rows heat">
          <thead><tr><th></th>{labels.map((_, j) => <th key={j}>{j + 1}</th>)}</tr></thead>
          <tbody>{cm.map((row, i) => {
            const sum = row.reduce((a, b) => a + b, 0) || 1;
            return (
              <tr key={i}>
                <td>{i + 1}. {clean(labels[i])}</td>
                {row.map((v, j) => (
                  <td key={j} style={{ background: v ? `rgba(${i === j ? "56,189,248" : "249,115,22"},${0.15 + 0.7 * v / sum})` : "none" }}>{v}</td>
                ))}
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </>
  );
}
