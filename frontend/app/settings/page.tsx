"use client";
import { useEffect, useState } from "react";
import { api, putApi } from "@/lib/api";

type Settings = { carrying_rate: number; currency: string; safety_buffer_days: number };
export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [rate, setRate] = useState("0.22");
  const [message, setMessage] = useState("");
  useEffect(() => { api<Settings>("/settings").then((value) => { setSettings(value); setRate(String(value.carrying_rate * 100)); }).catch((error) => setMessage(error.message)); }, []);
  async function save() {
    setMessage("");
    try {
      const saved = await putApi<Settings>("/settings", { carrying_rate: Number(rate) / 100 });
      setSettings(saved);
      setMessage("Carrying cost rate saved and applied to inventory calculations.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save settings."); }
  }
  return <div className="content"><div className="page-head"><div><h1>Settings</h1><p>Plant-level planning assumptions.</p></div></div><div className="section" style={{ maxWidth: 700 }}>
    <div className="form-row"><label htmlFor="rate">Annual carrying cost rate</label><input id="rate" type="number" min="0" max="100" step="0.5" value={rate} onChange={(e) => setRate(e.target.value)} />%</div>
    <div className="form-row"><label>Default safety buffer</label><span>{settings ? `${settings.safety_buffer_days} days (reliability adjusted)` : "Loading…"}</span></div>
    <div className="form-row"><label>Plant currency</label><span>{settings?.currency ?? "Loading…"}</span></div>
    <button className="btn" onClick={save} disabled={!settings || !Number.isFinite(Number(rate)) || Number(rate) < 0 || Number(rate) > 100}>Save settings</button>
    {message && <p className="notice" style={{ marginTop: 14 }}>{message}</p>}
  </div></div>;
}
