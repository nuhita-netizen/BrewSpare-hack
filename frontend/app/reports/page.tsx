"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type ReportData = {
  maintenance: { event_count: number; total_cost: number; downtime_hours: number; by_asset: { asset_code: string; date: string; problem: string; cost: number; downtime_hours: number }[] };
  inventory: { inventory_value: number; annual_carrying_cost: number };
  availability_risks: { part_code: string; part_name: string; state: string; availability_gap_days: number; recommended_order_qty: number }[];
  supplier_risks: { part_code: string; part_name: string; supplier: string; lead_time_days: number; reliability: number; state: string }[];
};
const money = (value: number) => `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
function exportCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url);
}
export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api<ReportData>("/reports").then(setData).catch((e) => setError(e.message)); }, []);
  if (error) return <div className="content"><div className="notice red">Could not load reports: {error}</div></div>;
  if (!data) return <div className="content"><div className="section">Loading reports…</div></div>;
  return <div className="content"><div className="page-head"><div><h1>Reports</h1><p>Operational and cost reporting for maintenance and spare-parts planning.</p></div><button className="btn" onClick={() => exportCsv("brewspare-maintenance.csv", [["Asset", "Date", "Problem", "Cost INR", "Downtime hours"], ...data.maintenance.by_asset.map((e) => [e.asset_code, e.date, e.problem, e.cost, e.downtime_hours])])}>Export Maintenance CSV</button></div>
    <section className="metrics" style={{ gridTemplateColumns: "repeat(4, minmax(130px, 1fr))" }}>
      <div className="metric"><div className="value">{money(data.maintenance.total_cost)}</div><div className="label">Maintenance Cost</div></div>
      <div className="metric"><div className="value">{data.maintenance.downtime_hours} hr</div><div className="label">Recorded Downtime</div></div>
      <div className="metric"><div className="value">{money(data.inventory.annual_carrying_cost)}</div><div className="label">Annual Carrying Cost</div></div>
      <div className="metric"><div className="value">{money(data.inventory.inventory_value)}</div><div className="label">Inventory Value</div></div>
    </section>
    <div className="section" style={{ marginBottom: 14 }}><div className="page-head"><div><h2>Availability Risk</h2><p>Parts with demand forecast before replenishment.</p></div><button className="btn secondary" onClick={() => exportCsv("brewspare-availability-risk.csv", [["Part", "Name", "State", "Gap days", "Recommended order qty"], ...data.availability_risks.map((p) => [p.part_code, p.part_name, p.state, p.availability_gap_days, p.recommended_order_qty])])}>Export CSV</button></div>
      <div className="table-wrap"><table className="table"><thead><tr><th>Part</th><th>Status</th><th>Gap</th><th>Suggested order</th></tr></thead><tbody>{data.availability_risks.map((p) => <tr key={p.part_code}><td>{p.part_code} · {p.part_name}</td><td>{p.state.replaceAll("_", " ")}</td><td>{p.availability_gap_days} days</td><td>{p.recommended_order_qty}</td></tr>)}{!data.availability_risks.length && <tr><td colSpan={4}>No parts currently flagged for availability risk.</td></tr>}</tbody></table></div>
    </div>
    <div className="two-col"><div className="section"><h2>Maintenance Events</h2><p className="subtle">{data.maintenance.event_count} recorded events · {money(data.maintenance.total_cost)} total cost</p><div className="table-wrap"><table className="table"><thead><tr><th>Date</th><th>Asset</th><th>Problem</th><th>Cost</th></tr></thead><tbody>{data.maintenance.by_asset.slice(0, 12).map((e, i) => <tr key={`${e.asset_code}-${e.date}-${i}`}><td>{e.date}</td><td>{e.asset_code}</td><td>{e.problem}</td><td>{money(e.cost)}</td></tr>)}</tbody></table></div></div>
      <div className="section"><h2>Supplier Risk</h2><p className="subtle">Ranked by reliability, then longest lead time.</p><div className="table-wrap"><table className="table"><thead><tr><th>Part / Supplier</th><th>Lead time</th><th>Reliability</th></tr></thead><tbody>{data.supplier_risks.slice(0, 12).map((p) => <tr key={p.part_code}><td>{p.part_code} · {p.supplier}<br/><span className="subtle">{p.part_name}</span></td><td>{p.lead_time_days} days</td><td>{Math.round(p.reliability * 100)}%</td></tr>)}</tbody></table></div></div></div>
  </div>;
}
