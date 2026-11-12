import { api } from "@/lib/api";
import ProjectChat from "@/components/ProjectChat";

type Brief = { headline: string; summary: string; evidence: string[]; suggested_actions: string[] };
export default async function AIInsights() {
  const d = await api<Brief>("/ai/brief");
  return <div className="content">
    <div className="page-head"><div><h1>BrewSpare Project Assistant</h1><p>Answers use BrewSpare’s brewery assets, inventory, and maintenance data only.</p></div></div>
    <div className="detail-grid">
      <section className="section"><span className="tag red">TODAY’S BRIEF</span><h2>{d.headline}</h2><p style={{ lineHeight: 1.7, color: "var(--muted)" }}>{d.summary}</p><h3>Evidence</h3>{d.evidence.map((x, i) => <div className="notice" key={i} style={{ marginBottom: 8 }}>{x}</div>)}<h3 style={{ marginTop: 22 }}>Suggested Actions</h3>{d.suggested_actions.map((x, i) => <div className="asset-row" key={i}><span>✦</span><div className="row-title">{x}</div><span>→</span></div>)}</section>
      <aside className="section"><h3>Project-only answers</h3><p className="subtle" style={{ lineHeight: 1.7 }}>Ask about BrewSpare assets, parts, stock, forecasts, availability, suppliers, maintenance, procurement, or scenarios. Unrelated questions are declined.</p><div className="notice">Answers are built from BrewSpare’s current demo data and fixed analytics templates; the assistant does not answer general-purpose questions.</div></aside>
    </div>
    <ProjectChat />
  </div>;
}
