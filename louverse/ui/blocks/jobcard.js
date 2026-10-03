// blocks/jobcard.js - the selected job's record: who, where, project / WO, when, hours (from the segments), notes.
import { loadJob, fmtDate, fmtTime, fmtHours } from "../../core/jobs.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const title = "Job";
export function mount(body, { store, block }) {
  let stops = [];
  const draw = async () => {
    const id = store.get("jobId"); if (!id) { body.innerHTML = `<div class="lv-empty">Pick a job in the list.</div>`; block.setTitle("Job"); return; }
    let j = store.get("job"); if (!j || j.id !== id) { try { j = await loadJob(store.get("base"), id); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; } }
    if (!j) { body.innerHTML = `<div class="lv-empty">Job not found.</div>`; return; }
    block.setTitle(`Job · ${j.customer}`);
    const segs = (Array.isArray(j.raw?.segments) ? j.raw.segments : []).filter(s => s && s.startTime);
    body.innerHTML = `<div class="lv-kv">
      <b>Customer</b><span>${esc(j.customer)}</span>
      ${j.address ? `<b>Address</b><span>${esc(j.address)}</span>` : ""}
      ${j.project ? `<b>Project</b><span>${esc(j.project)}</span>` : ""}
      ${j.wo ? `<b>WO</b><span>${esc(j.wo)}</span>` : ""}
      <b>Date</b><span>${fmtDate(j.start)} ${fmtTime(j.start)}${j.end ? " → " + fmtTime(j.end) : ""}</span>
      <b>Hours</b><span>${fmtHours(j.hours)}${j.travel ? ` (travel ${fmtHours(j.travel)})` : ""}</span>
      <b>Status</b><span>${esc(j.status)}</span>
      ${j.raw?.startOdometer ? `<b>Odometer</b><span>${esc(j.raw.startOdometer)} → ${esc(j.raw.endOdometer || "")}</span>` : ""}
    </div>
    ${segs.length ? `<div class="lv-muted" style="margin-top:8px;font-size:.85rem">${segs.map(s => `${esc(s.type || "work")} ${fmtTime(s.startTime)}–${s.endTime ? fmtTime(s.endTime) : "…"}`).join(" · ")}</div>` : ""}
    ${j.notes ? `<pre class="lv-pre">${esc(j.notes)}</pre>` : ""}`;
  };
  stops.push(store.on("jobId", draw), store.on("base", draw)); draw();
  return { destroy: () => stops.forEach(s => s()) };
}
