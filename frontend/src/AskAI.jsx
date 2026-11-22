import { useState } from "react";
import { api } from "./api";

export default function AskAI() {
  const [q, setQ] = useState("");
  const [chat, setChat] = useState([]);

  const ask = async (e) => {
    e.preventDefault();
    const i = chat.length, question = q;
    setQ("");
    setChat((c) => [...c, { q: question, a: "Thinking…" }]);
    let a;
    try { a = (await api(`/ask?q=${encodeURIComponent(question)}`)).answer; }
    catch (err) { a = err.message; }
    setChat((c) => c.map((m, j) => (j === i ? { ...m, a } : m)));
  };

  return (
    <form className="card" onSubmit={ask}>
      <h2>Ask AI</h2>
      <p className="sub">Answers use the summary of your last upload. Type a question and press Enter.</p>
      {chat.map((m, i) => (
        <div key={i}><p><b>You:</b> {m.q}</p><p>{m.a}</p></div>
      ))}
      <input style={{ width: "100%", boxSizing: "border-box" }} value={q} placeholder="Ask about your traffic…"
        onChange={(e) => setQ(e.target.value)} />
    </form>
  );
}
