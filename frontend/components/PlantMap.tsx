"use client";
import { colorFor } from "./StatusBadge";

type Asset = { asset_code: string; name: string; area: string; status: string; risk_score: number; health_score: number; x: number; y: number };

function EquipmentDrawing({ code }: { code: string }) {
  const metal = "#dce5ed", edge = "#8496a8", dark = "#526579", blue = "#78a8d5", gold = "#e2bd55";
  const shell = (x: number, y: number, w: number, h: number, rx = 7) => <rect x={x} y={y} width={w} height={h} rx={rx} fill={metal} stroke={edge} strokeWidth="2" />;
  let drawing;
  switch (code) {
    case "RM-01": drawing = <>{shell(17, 25, 48, 31, 5)}<path d="M22 25V18h38v7M25 56l-4 7m36-7 4 7" fill="none" stroke={edge} strokeWidth="3"/><path d="m29 21 6-7 6 7m6 0 6-7 6 7" fill="none" stroke={gold} strokeWidth="3"/></>; break;
    case "MX-01": drawing = <>{shell(26, 20, 32, 38, 15)}<path d="M42 10v34m-9-8 9 8 9-8M31 58v5m22-5v5M30 27h24" fill="none" stroke={dark} strokeWidth="2.5"/><path d="M21 63h42" stroke={edge} strokeWidth="3"/></>; break;
    case "BK-01": drawing = <><path d="M20 29q22-21 44 0v25H20z" fill={metal} stroke={edge} strokeWidth="2"/><path d="M18 29h48M26 54v8m32-8v8M30 17q12-8 24 0" fill="none" stroke={dark} strokeWidth="2.5"/><path d="M37 38q5-7 10 0" fill="none" stroke={gold} strokeWidth="3"/></>; break;
    case "PM-02": drawing = <>{shell(28, 23, 28, 34, 13)}<circle cx="42" cy="40" r="8" fill={blue} stroke={dark} strokeWidth="2"/><path d="M42 23V14h21v9M28 43H17V31m14 31h23" fill="none" stroke={edge} strokeWidth="4"/><path d="M42 32v16m-8-8h16" stroke="white" strokeWidth="2"/></>; break;
    case "HX-01": drawing = <>{shell(26, 15, 32, 48, 4)}{[22,29,36,43,50].map(y=><path key={y} d={`M30 ${y}h24`} stroke={blue} strokeWidth="3"/>)}<path d="M20 25h6m32 24h7M32 12v3m20 48v4" stroke={dark} strokeWidth="3"/></>; break;
    case "FV-04": case "GC-01": drawing = <>{shell(27, 12, 30, 50, 14)}<path d="M28 24h28M35 62v3m14-3v3M42 12V7m-10 31h20" fill="none" stroke={edge} strokeWidth="2.5"/>{code === "GC-01" && <><path d="M35 31a8 8 0 1 0 14 0" fill="none" stroke={blue} strokeWidth="3"/><path d="M35 45h14" stroke={blue} strokeWidth="3"/></>}</>; break;
    case "CIP-01": drawing = <>{shell(21, 20, 24, 37, 10)}<path d="M23 33h20M26 57v7m15-7v7" stroke={edge} strokeWidth="2.5" fill="none"/><circle cx="55" cy="47" r="9" fill={blue} stroke={dark} strokeWidth="2"/><path d="M45 47h-5m15-9V26h11v-8" fill="none" stroke={edge} strokeWidth="3"/></>; break;
    case "FLT-01": drawing = <>{shell(18, 22, 52, 34, 8)}{[30,42,54].map(x=><path key={x} d={`M${x} 25v28`} stroke={blue} strokeWidth="4"/>)}<path d="M23 17h42M26 56v7m36-7v7M14 39h4m52 0h5" stroke={dark} strokeWidth="2.5"/></>; break;
    case "FL-01": drawing = <>{shell(18, 21, 50, 35, 6)}<path d="M25 21v-8h36v8M29 28v11m12-11v11m12-11v11M24 44h38M26 56v7m36-7v7" fill="none" stroke={dark} strokeWidth="2.5"/><path d="M29 39h24" stroke={gold} strokeWidth="3"/></>; break;
    case "CP-01": drawing = <>{shell(22, 20, 42, 39, 6)}<path d="M32 20v-8h22v8m-18 12h14m-7-2v17m-11 0h22M28 59v5m30-5v5" fill="none" stroke={dark} strokeWidth="2.5"/><circle cx="43" cy="41" r="5" fill={gold}/></>; break;
    case "CV-01": drawing = <><path d="M13 35h56v15H13z" fill={metal} stroke={edge} strokeWidth="2"/><path d="M18 52v9m46-9v9" stroke={dark} strokeWidth="3"/>{[23,37,51,65].map(x=><circle key={x} cx={x} cy="54" r="3" fill={blue}/>)}{[25,42,58].map(x=><rect key={x} x={x} y="24" width="10" height="11" rx="2" fill={gold} stroke={edge} />)}</>; break;
    case "AC-01": drawing = <>{shell(18, 21, 50, 38, 7)}<circle cx="43" cy="40" r="12" fill={blue} stroke={dark} strokeWidth="2"/><circle cx="43" cy="40" r="3" fill="white"/>{[0,60,120,180,240,300].map(n=><path key={n} d="M43 28v9" stroke="white" strokeWidth="2" transform={`rotate(${n} 43 40)`}/>)}<path d="M25 59v5m36-5v5M26 27h7" stroke={dark} strokeWidth="2.5"/></>; break;
    case "PKG-01": drawing = <><path d="M28 23h23l10 11-8 7 3 17H28l5-17-9-7z" fill={metal} stroke={edge} strokeWidth="2"/><path d="m35 31 10 8m-8 1 9-8m-8 15 8 8" stroke={blue} strokeWidth="4" strokeLinecap="round"/><path d="M40 57v7m-17 0h41" stroke={dark} strokeWidth="2.5"/></>; break;
    default: drawing = <>{shell(22, 20, 42, 40, 8)}<path d="M29 29h28m-28 9h28m-28 9h28M30 60v4m26-4v4" stroke={blue} strokeWidth="3"/></>;
  }
  return <svg className="equipment-art" viewBox="0 0 84 72" aria-hidden="true">{drawing}</svg>;
}

type PartMarker = { part_code: string; part_name: string };
const partHints: Record<string, string> = { "RM-01": "Hopper gate", "MX-01": "Agitator", "BK-01": "Steam jacket", "FV-04": "Vessel seal", "PKG-01": "Robot gripper" };
const processCodes = ["RM-01", "MX-01", "BK-01", "PM-02", "HX-01", "FV-04", "GC-01", "CIP-01", "FLT-01", "FL-01", "CP-01", "CV-01", "PKG-01"];

export default function PlantMap({ assets, selected, partsByAsset = {}, onSelect }: { assets: Asset[]; selected?: string; partsByAsset?: Record<string, PartMarker[]>; onSelect: (a: Asset) => void }) {
  const byCode = new Map(assets.map((asset) => [asset.asset_code, asset]));
  const topRow = processCodes.slice(0, 7).map((code) => byCode.get(code)).filter((a): a is Asset => Boolean(a));
  const bottomByCode = ["AC-01", ...processCodes.slice(7).reverse()];
  const bottomRow = bottomByCode.map((code) => byCode.get(code)).filter((a): a is Asset => Boolean(a));
  const renderMachine = (asset: Asset, stage: string, utility = false) => {
    const parts = partsByAsset[asset.asset_code] ?? [];
    const firstPart = parts[0];
    const callout = firstPart ? `${firstPart.part_code} · ${firstPart.part_name}` : partHints[asset.asset_code] ?? "Equipment assembly";
    return <div key={asset.asset_code} className={`scene-machine ${selected === asset.asset_code ? "is-selected" : ""} ${utility ? "is-utility" : ""}`} style={{ "--asset-status": colorFor(asset.status) } as React.CSSProperties}>
      <button type="button" className="scene-target" aria-label={`${asset.name}, ${asset.status.toLowerCase()}, ${parts.length ? `linked part ${parts.map((p) => `${p.part_code} ${p.part_name}`).join(", ")}` : callout}`} aria-pressed={selected === asset.asset_code} onClick={() => onSelect(asset)}>
        <span className="scene-stage">{stage}</span><span className="scene-status" title={asset.status}/>
        <EquipmentDrawing code={asset.asset_code}/>
        <span className="scene-name">{asset.name.replace(/ 04| 01| 02/g, "")}</span><span className="scene-code">{asset.asset_code}</span>
      </button>
      {firstPart ? <a className="part-callout" href={`/spare-parts/${firstPart.part_code}`} title={`Open ${firstPart.part_code} · ${firstPart.part_name}`}><i/>{firstPart.part_code} · {firstPart.part_name}{parts.length > 1 && <b> +{parts.length - 1}</b>}</a> : <span className="part-callout"><i/>{callout}</span>}
    </div>;
  };
  return <section className="plantmap" aria-label="Illustrated brewery process and machine parts">
    <div className="plantmap-heading"><div><div className="process-title">Brewery Process & Parts</div><div className="process-sub">Follow the production line. Select a machine to see its linked spare parts.</div></div><span className="map-count">{assets.length} machines</span></div>
    <div className="map-legend"><span><i className="legend-dot healthy"/>Healthy</span><span><i className="legend-dot watch"/>Monitor</span><span><i className="legend-dot alert"/>At risk</span><span className="legend-note">Part labels link to inventory</span></div>
    <div className="scene-scroll"><div className="scene-board">
      <svg className="scene-pipes" viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
        <path d="M30 116H960Q980 116 980 136V381Q980 401 960 401H36" fill="none" stroke="#b9c7c5" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M30 116H960" fill="none" stroke="#83aaa4" strokeWidth="3" strokeLinecap="round"/>
        <path d="M970 151v217" fill="none" stroke="#83aaa4" strokeWidth="3" strokeDasharray="7 7"/>
        <path d="M960 401H38" fill="none" stroke="#83aaa4" strokeWidth="3" strokeLinecap="round"/>
        <path d="m950 110 12 6-12 6M48 395l-12 6 12 6" fill="none" stroke="#397c72" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M72 470Q72 492 95 492H900" fill="none" stroke="#c8d3d9" strokeWidth="3" strokeDasharray="5 6"/>
        <path d="M900 488l8 4-8 4" fill="none" stroke="#8c9eaa" strokeWidth="2"/>
        <path d="M0 493H1000" stroke="#e3daca" strokeWidth="2"/>
      </svg>
      <div className="scene-flow-label top-flow">BREWING & FERMENTATION <span>01 → 07</span></div>
      <div className="scene-row top-row">{topRow.map((asset, i) => renderMachine(asset, String(i + 1).padStart(2, "0")))}</div>
      <div className="scene-flow-label bottom-flow">PACKAGING & UTILITIES <span>08 ← 13</span></div>
      <div className="scene-row bottom-row">{bottomRow.map((asset) => renderMachine(asset, asset.asset_code === "AC-01" ? "U" : String(processCodes.indexOf(asset.asset_code) + 1).padStart(2, "0"), asset.asset_code === "AC-01"))}</div>
    </div></div>
  </section>;
}
