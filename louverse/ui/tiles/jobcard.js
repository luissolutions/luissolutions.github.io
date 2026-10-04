// tiles/jobcard.js - the picked job's record, EDITED IN PLACE (L 2026-10-03: "have it able to edit the info in each of its
// modules"). Fields save through core/jobs.saveJob; a save sets store.jobSaved so the Jobs list (and anything else that
// follows it) refreshes - the wire shows where the edit lands.
import { loadJob, saveJob, fmtDate, fmtTime, fmtHours } from "../../core/jobs.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const FIELDS = [["customerName", "Customer"], ["customerAddress", "Address"], ["project", "Project"], ["workOrder", "WO"], ["status", "Status"]];

export const title = "Job";
export const sub = ["jobId"];
export const pub = ["jobSaved"];
export function mount(body, { store, tile }) {
  let stops = [], current = null;
  const draw = async () => {
    const id = store.get("jobId"); if (!id) { body.innerHTML = `<div class="lv-empty">Pick a job in the list.</div>`; tile.setTitle("Job"); return; }
    let j = store.get("job"); if (!j || j.id !== id) { try { j = await loadJob(store.get("base"), id); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; } }
    if (!j) { body.innerHTML = `<div class="lv-empty">Job not found.</div>`; return; }
    current = j; tile.setTitle(`Job · ${j.customer}`);
    const canEdit = true, raw = j.raw || {};   // public = a tree you work in, same as every app (L 2026-10-04)
    const segs = (Array.isArray(raw.segments) ? raw.segments : []).filter(s => s && s.startTime);
    body.innerHTML = `<form class="lv-form">
      ${FIELDS.map(([k, label]) => `<label><b>${label}</b><input name="${k}" value="${esc(raw[k] || "")}" ${canEdit ? "" : "readonly"}></label>`).join("")}
      <div class="lv-kv" style="margin:6px 0">
        <b>Date</b><span>${fmtDate(j.start)} ${fmtTime(j.start)}${j.end ? " → " + fmtTime(j.end) : ""}</span>
        <b>Hours</b><span>${fmtHours(j.hours)}${j.travel ? ` (travel ${fmtHours(j.travel)})` : ""}</span>
        ${raw.startOdometer ? `<b>Odometer</b><span>${esc(raw.startOdometer)} → ${esc(raw.endOdometer || "")}</span>` : ""}
      </div>
      ${segs.length ? `<div class="lv-muted" style="font-size:.85rem;margin-bottom:6px">${segs.map(s => `${esc(s.type || "work")} ${fmtTime(s.startTime)}–${s.endTime ? fmtTime(s.endTime) : "…"}`).join(" · ")}</div>` : ""}
      <label><b>Notes</b><textarea name="notes" rows="5" ${canEdit ? "" : "readonly"}>${esc(j.notes)}</textarea></label>
      <div class="lv-actions"><span class="lv-muted st"></span><button type="submit" class="lv-btn primary">Save</button></div>
    </form>`;
    const form = body.querySelector("form"), st = form.querySelector(".st");
    form.addEventListener("input", () => { if (st) st.textContent = "unsaved"; });
    form.onsubmit = async e => { e.preventDefault(); if (!canEdit) return; const patch = {}; for (const [k] of FIELDS) patch[k] = form[k].value.trim(); patch.notes = form.notes.value;
      st.textContent = "saving…";
      try { const fresh = await saveJob(store.get("base"), j.id, patch); st.textContent = "saved"; if (fresh) { current = fresh; store.set("job", fresh); tile.setTitle(`Job · ${fresh.customer}`); } store.set("jobSaved", { id: j.id, at: Date.now() }); }
      catch (x) { st.textContent = "not saved: " + (x.code || x.message); } };
  };
  stops.push(store.on("jobId", draw), store.on("base", draw)); draw();
  return { destroy: () => stops.forEach(s => s()) };
}
