from __future__ import annotations

import re
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Asset, SparePart, Plant, SensorReading, ProcurementPlan
from .models import MaintenanceEvent
from .analytics import asset_detail, availability_for
from .seed import seed

app = FastAPI(title="BrewSpare API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    seed()

@app.get("/health")
def health():
    return {"status":"ok","service":"BrewSpare API"}

@app.get("/api/settings")
def get_settings(db: Session = Depends(get_db)):
    plant = db.scalar(select(Plant).limit(1))
    return {"carrying_rate": plant.carrying_rate if plant else 0.22, "currency": "INR (₹)", "safety_buffer_days": 7}

class SettingsIn(BaseModel):
    carrying_rate: float = Field(ge=0, le=1)

@app.put("/api/settings")
def update_settings(payload: SettingsIn, db: Session = Depends(get_db)):
    plant = db.scalar(select(Plant).limit(1))
    if not plant:
        raise HTTPException(404, "Plant not found")
    plant.carrying_rate = payload.carrying_rate
    db.commit()
    return {"carrying_rate": plant.carrying_rate, "currency": "INR (₹)", "safety_buffer_days": 7}

@app.get("/api/plant-summary")
def plant_summary(db: Session = Depends(get_db)):
    plant = db.scalar(select(Plant).limit(1))
    assets = db.scalars(select(Asset).order_by(Asset.x)).all()
    parts = db.scalars(select(SparePart)).all()
    av = [availability_for(db,p) for p in parts]
    counts = {s: sum(1 for a in assets if a.status == s) for s in ["GREEN","YELLOW","ORANGE","RED"]}
    inventory_value = sum(x["inventory_value"] for x in av)
    carrying = sum(x["annual_carrying_cost"] for x in av)
    avoidable = sum(x["inventory_value"] for x in av if x["state"] in {"EXCESS_INVENTORY","SHELF_LIFE_RISK"})
    downtime_exposure = sum(a.downtime_cost_per_hour * 2 for a in assets if a.status in {"ORANGE","RED"})
    return {
        "plant": {"name": plant.name, "code": plant.code},
        "counts": counts,
        "plant_availability": round(100 - sum(a.risk_score for a in assets)/(len(assets)*12),1),
        "potential_downtime_exposure": round(downtime_exposure,0),
        "inventory_value": round(inventory_value,0),
        "annual_carrying_cost": round(carrying,0),
        "avoidable_inventory_value": round(avoidable,0),
        "assets": [{"asset_code":a.asset_code,"name":a.name,"area":a.area,"status":a.status,"risk_score":a.risk_score,"health_score":a.health_score,"x":a.x,"y":a.y} for a in assets],
        "critical_assets": [{"asset_code":a.asset_code,"name":a.name,"status":a.status,"risk_score":a.risk_score,"health_score":a.health_score} for a in sorted(assets,key=lambda x:x.risk_score,reverse=True)[:4]],
        "parts_to_order": sorted([x for x in av if x["state"] in {"AVAILABILITY_RISK","ORDER_SOON"}], key=lambda x:(x["state"]!="AVAILABILITY_RISK",-x["availability_gap_days"]))[:5]
    }

@app.get("/api/assets")
def assets(db: Session = Depends(get_db)):
    rows = db.scalars(select(Asset).order_by(Asset.asset_code)).all()
    return [asset_detail(db,a) for a in rows]

@app.get("/api/assets/{asset_code}")
def asset(asset_code: str, db: Session = Depends(get_db)):
    row = db.scalar(select(Asset).where(Asset.asset_code == asset_code))
    if not row: raise HTTPException(404,"Asset not found")
    detail = asset_detail(db,row)
    readings = db.scalars(select(SensorReading).where(SensorReading.asset_id==row.id).order_by(SensorReading.ts.asc()).limit(120)).all()
    detail["sensor_series"] = [{"ts":r.ts.isoformat(),"temperature":r.temperature,"vibration":r.vibration,"pressure":r.pressure,"output_rate":r.output_rate} for r in readings]
    return detail

@app.get("/api/parts")
def parts(db: Session = Depends(get_db)):
    rows = db.scalars(select(SparePart).order_by(SparePart.part_code)).all()
    return [availability_for(db,p) for p in rows]

@app.get("/api/parts/{part_code}")
def part(part_code: str, db: Session = Depends(get_db)):
    p = db.scalar(select(SparePart).where(SparePart.part_code == part_code))
    if not p: raise HTTPException(404,"Part not found")
    out = availability_for(db,p)
    out["category"] = p.category
    out["unit_cost"] = p.unit_cost
    out["supplier_status"] = p.supplier_status
    out["dependencies"] = [{"asset_code":l.asset.asset_code,"asset_name":l.asset.name,"importance":l.importance,"asset_status":l.asset.status} for l in p.asset_links]
    out["usage_history"] = [{"date":u.usage_date.isoformat(),"quantity":u.quantity} for u in sorted(p.usage,key=lambda x:x.usage_date)]
    return out

@app.get("/api/availability")
def availability(db: Session = Depends(get_db)):
    parts = db.scalars(select(SparePart)).all()
    return sorted([availability_for(db,p) for p in parts], key=lambda x:(x["state"] not in {"AVAILABILITY_RISK","ORDER_SOON"}, -x["availability_gap_days"]))

@app.get("/api/maintenance-priorities")
def maintenance_priorities(db: Session = Depends(get_db)):
    assets = db.scalars(select(Asset)).all()
    rows=[]
    for a in assets:
        detail=asset_detail(db,a)
        part_risks=[p for p in detail["parts"] if p["state"] in {"AVAILABILITY_RISK","ORDER_SOON"}]
        score=min(100,round(a.risk_score + (8 if part_risks else 0) + (5 if a.criticality=="Critical" else 0)))
        rows.append({"asset_code":a.asset_code,"name":a.name,"priority_score":score,"status":a.status,"risk_score":a.risk_score,"next_maintenance_days":a.next_maintenance_days,"required_parts":part_risks})
    return sorted(rows,key=lambda x:x["priority_score"],reverse=True)

class ProcureIn(BaseModel):
    part_code: str
    quantity: float
    action: str = "APPROVE"

@app.post("/api/procurement")
def create_procurement(payload: ProcureIn, db: Session = Depends(get_db)):
    p = db.scalar(select(SparePart).where(SparePart.part_code == payload.part_code))
    if not p: raise HTTPException(404,"Part not found")
    av=availability_for(db,p)
    plan=ProcurementPlan(part_code=p.part_code,suggested_qty=av["recommended_order_qty"],approved_qty=payload.quantity,status=payload.action.upper(),reason=f"{av['state']} with {av['availability_gap_days']} day availability gap")
    db.add(plan); db.commit(); db.refresh(plan)
    return {"id":plan.id,"status":plan.status,"part_code":plan.part_code,"approved_qty":plan.approved_qty,"reason":plan.reason}

@app.get("/api/scenario")
def scenario(supplier_delay_days: int = 0, production_increase_pct: int = 0, db: Session = Depends(get_db)):
    parts = db.scalars(select(SparePart)).all()
    base=[availability_for(db,p) for p in parts]
    current=sum(1 for x in base if x["state"]=="AVAILABILITY_RISK")
    affected=[]
    projected=0
    for p,x in zip(parts,base):
        effective_need=max(1,int(x["predicted_need_days"]/(1+production_increase_pct/100)))
        gap=(x["effective_lead_days"]+supplier_delay_days+7)-effective_need
        if gap>0:
            projected+=1
            affected.append({"part_code":p.part_code,"part_name":p.name,"projected_gap_days":gap})
    return {"current_availability_risks":current,"scenario_availability_risks":projected,"supplier_delay_days":supplier_delay_days,"production_increase_pct":production_increase_pct,"affected":sorted(affected,key=lambda a:a["projected_gap_days"],reverse=True)[:10]}

@app.get("/api/ai/brief")
def ai_brief(db: Session = Depends(get_db)):
    summary=plant_summary(db)
    top=summary["critical_assets"][0]
    parts=summary["parts_to_order"]
    return {
        "headline": f"{top['asset_code']} {top['name']} needs attention",
        "summary": f"Risk score is {top['risk_score']} with health at {top['health_score']}%. {len(parts)} spare parts currently need procurement review.",
        "evidence": [f"{p['part_code']} has {p['usable_stock']} usable units vs {p['forecast']['d30']} forecast 30-day demand" for p in parts[:3]],
        "suggested_actions": ["Review FL-01 maintenance history","Review SP-010 procurement window","Check high-risk supplier lead times"],
    }

class ProjectQuestion(BaseModel):
    question: str = Field(min_length=1, max_length=500)

OUT_OF_SCOPE = "I can only help with BrewSpare project data: brewery assets, spare parts, stock, forecasts, availability, suppliers, maintenance, procurement, and scenarios. Try asking about an asset code (for example FL-01) or a part code (for example SP-010)."

@app.post("/api/ask")
def ask_project(payload: ProjectQuestion, db: Session = Depends(get_db)):
    question = payload.question.strip()
    if not question:
        return {"in_scope": False, "answer": OUT_OF_SCOPE}
    q = question.lower()
    # This endpoint intentionally uses fixed, data-backed answers. It has no general-purpose model.
    blocked = r"\b(joke|poem|story|recipe|weather|politics|celebrity|movie|song|translate|homework|code me|write me|ignore (?:all )?(?:previous|prior)|act as|general knowledge)\b"
    if re.search(blocked, q):
        return {"in_scope": False, "answer": OUT_OF_SCOPE}

    part_match = re.search(r"\bSP[- ]?(\d{3})\b", question.upper())
    asset_match = re.search(r"\b([A-Z]{2,5}-\d{2})\b", question.upper())
    project_terms = ("brewspare", "brewery", "plant", "asset", "machine", "spare", "part", "stock", "inventory", "forecast", "demand", "order", "procurement", "supplier", "lead time", "maintenance", "downtime", "risk", "availability", "sensor", "scenario", "production", "overstock", "carrying cost", "critical")
    if not part_match and not asset_match and not any(term in q for term in project_terms):
        return {"in_scope": False, "answer": OUT_OF_SCOPE}

    if part_match:
        code = f"SP-{part_match.group(1)}"
        part = db.scalar(select(SparePart).where(SparePart.part_code == code))
        if not part:
            return {"in_scope": True, "answer": f"I couldn't find part {code} in the BrewSpare dataset."}
        av = availability_for(db, part)
        linked = ", ".join(link.asset.asset_code for link in part.asset_links) or "no linked assets"
        return {"in_scope": True, "answer": f"{code} · {part.name}: {av['state'].replace('_', ' ').lower()}. Usable stock {av['usable_stock']}, 30-day forecast {av['forecast']['d30']}, lead time {av['effective_lead_days']} days, and suggested order {av['recommended_order_qty']}. Supplier: {part.supplier_name} ({round(part.supplier_reliability * 100)}% reliability). Linked assets: {linked}."}

    if asset_match:
        code = asset_match.group(1)
        asset_row = db.scalar(select(Asset).where(Asset.asset_code == code))
        if not asset_row:
            return {"in_scope": True, "answer": f"I couldn't find asset {code} in the BrewSpare dataset."}
        detail = asset_detail(db, asset_row)
        linked_parts = ", ".join(f"{p['part_code']} {p['part_name']}" for p in detail["parts"]) or "none recorded"
        return {"in_scope": True, "answer": f"{code} · {detail['name']} is {detail['status'].lower()} with health {detail['health_score']}% and risk {detail['risk_score']}%. Next maintenance is in {detail['next_maintenance_days']} days. Linked spare parts: {linked_parts}."}

    if any(term in q for term in ("attention", "today", "critical", "highest risk")):
        summary = plant_summary(db)
        top = summary["critical_assets"][:3]
        assets_text = "; ".join(f"{a['asset_code']} {a['name']} ({a['status'].lower()}, risk {a['risk_score']}%)" for a in top)
        parts_text = "; ".join(f"{p['part_code']} {p['part_name']} (order {p['recommended_order_qty']})" for p in summary["parts_to_order"][:3]) or "no parts currently need ordering"
        return {"in_scope": True, "answer": f"Highest-risk assets: {assets_text}. Procurement review: {parts_text}."}

    if any(term in q for term in ("overstock", "slow-moving", "excess", "shelf life")):
        rows = [availability_for(db, p) for p in db.scalars(select(SparePart)).all()]
        excess = [p for p in rows if p["state"] in {"EXCESS_INVENTORY", "SHELF_LIFE_RISK"}]
        text = "; ".join(f"{p['part_code']} ({p['state'].replace('_', ' ').lower()}, {p['usable_stock']} usable units, {p['months_cover']} months cover)" for p in excess)
        return {"in_scope": True, "answer": f"Inventory flagged for review: {text or 'none in the current dataset'}."}

    if "maintenance" in q or "work order" in q:
        priorities = maintenance_priorities(db)[:4]
        text = "; ".join(f"{a['asset_code']} {a['name']} (priority {a['priority_score']}, maintenance in {a['next_maintenance_days']} days)" for a in priorities)
        return {"in_scope": True, "answer": f"Top maintenance priorities: {text}."}

    if "scenario" in q or "delay" in q or "what if" in q or "production increase" in q:
        delay_match = re.search(r"(\d+)\s*day", q)
        increase_match = re.search(r"(\d+)\s*%", q)
        result = scenario(supplier_delay_days=int(delay_match.group(1)) if delay_match else 15, production_increase_pct=int(increase_match.group(1)) if increase_match else 0, db=db)
        affected = ", ".join(f"{p['part_code']} (+{p['projected_gap_days']} day gap)" for p in result["affected"][:4]) or "no additional parts projected with a gap"
        return {"in_scope": True, "answer": f"With a {result['supplier_delay_days']}-day supplier delay and {result['production_increase_pct']}% production increase, {result['scenario_availability_risks']} parts are projected at availability risk. Affected: {affected}."}

    if any(term in q for term in ("availability", "parts at risk", "spare parts", "parts to order", "supplier", "lead time", "stock", "inventory", "forecast", "order")):
        rows = availability(db)
        if "supplier" in q or "lead time" in q:
            ranked = sorted(db.scalars(select(SparePart)).all(), key=lambda p: (p.supplier_reliability, -p.lead_time_days))[:4]
            text = "; ".join(f"{p.part_code} {p.name} ({p.supplier_name}, {p.lead_time_days} days, {round(p.supplier_reliability * 100)}% reliable)" for p in ranked)
            return {"in_scope": True, "answer": f"Lowest-reliability / longest-lead supplier exposures: {text}."}
        urgent = [p for p in rows if p["state"] in {"AVAILABILITY_RISK", "ORDER_SOON"}][:5]
        text = "; ".join(f"{p['part_code']} {p['part_name']} ({p['state'].replace('_', ' ').lower()}, stock {p['usable_stock']}, order {p['recommended_order_qty']})" for p in urgent)
        return {"in_scope": True, "answer": f"Parts needing availability or order review: {text or 'none currently flagged'}."}

    return {"in_scope": True, "answer": "I can answer using BrewSpare's asset, parts, inventory, supplier, maintenance, and scenario data. Ask about a specific asset or part code, current risks, parts to order, overstock, or maintenance priorities."}

@app.get("/api/reports")
def reports(db: Session = Depends(get_db)):
    events = db.scalars(select(MaintenanceEvent).order_by(MaintenanceEvent.event_date.desc())).all()
    assets = {a.id: a for a in db.scalars(select(Asset)).all()}
    parts = db.scalars(select(SparePart)).all()
    availability = [availability_for(db, p) for p in parts]
    return {
        "maintenance": {
            "event_count": len(events),
            "total_cost": round(sum(e.maintenance_cost for e in events), 2),
            "downtime_hours": round(sum(e.downtime_hours for e in events), 1),
            "by_asset": [{"asset_code": assets[e.asset_id].asset_code, "date": e.event_date.isoformat(), "problem": e.problem, "cost": e.maintenance_cost, "downtime_hours": e.downtime_hours} for e in events if e.asset_id in assets],
        },
        "inventory": {"inventory_value": round(sum(p["inventory_value"] for p in availability), 2), "annual_carrying_cost": round(sum(p["annual_carrying_cost"] for p in availability), 2)},
        "availability_risks": [p for p in availability if p["state"] in {"AVAILABILITY_RISK", "ORDER_SOON"}],
        "supplier_risks": sorted([{"part_code": p.part_code, "part_name": p.name, "supplier": p.supplier_name, "lead_time_days": p.lead_time_days, "reliability": p.supplier_reliability, "state": p.supplier_status} for p in parts], key=lambda p: (p["reliability"], -p["lead_time_days"])),
    }
