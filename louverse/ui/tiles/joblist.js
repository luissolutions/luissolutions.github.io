// tiles/joblist.js - the jobs list: search + rows; picking one sets store.jobId so the Job and Photos tiles follow. It
// follows jobSaved too: an edit in the Job tile refreshes that one row here (the wire runs both ways).
import { loadJobs, loadJob, fmtDate, fmtHours } from "../../core/jobs.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const title = "Visits";
export const pub = ["visitId"];
export const sub = ["visitSaved", "year"];   // the Year tile narrows the list to the year a visit took place (L 2026-10-04)
export function mount(body, { store, tile }) {
  body.innerHTML = `<input class="lv-search" type="search" placeholder="Search visits (customer, project, WO)" autocomplete="off"><div class="lv-rows"></div>`;
  const q = body.querySelector("input"), rows = body.querySelector(".lv-rows"); let jobs = [], stops = [];
  const draw = () => { const t = q.value.trim().toLowerCase(), sel = store.get("visitId"), y = Number(store.get("year")) || 0;
    const inYear = jobs.filter(j => !y || new Date(j.start).getFullYear() === y), elsewhere = jobs.length - inYear.length;
    const hit = inYear.filter(j => !t || `${j.customer} ${j.project} ${j.wo}`.toLowerCase().includes(t)), show = hit.slice(0, 300);
    tile.setTitle(`Visits${y ? " · " + y : ""} · ${inYear.length}`);
    rows.innerHTML = (show.length ? show.map(j => `<div class="lv-row${j.id === sel ? " on" : ""}" data-id="${j.id}"><div><div class="n">${esc(j.customer)}</div><div class="s">${esc([j.project, j.wo].filter(Boolean).join(" · "))} ${fmtDate(j.start)}</div></div><div class="v">${fmtHours(j.hours)}</div></div>`).join("") + (hit.length > show.length ? `<div class="lv-muted">showing ${show.length} of ${hit.length}</div>` : "")
      : `<div class="lv-empty">${jobs.length ? (inYear.length ? "no match" : `no visits in ${y}`) : "no visits"}</div>`) + (elsewhere > 0 ? `<div class="lv-muted" style="font-size:.78rem;margin-top:6px">${elsewhere} more in other years - change the Year tile</div>` : ""); };
  const load = async () => { rows.innerHTML = `<div class="lv-empty">loading…</div>`;
    try { jobs = await loadJobs(store.get("base")); } catch (e) { jobs = []; rows.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; }
    if (!jobs.length) { rows.innerHTML = `<div class="lv-empty">No visits yet.</div>`; tile.setTitle("Visits"); return; }
    draw(); };
  const refreshOne = async s => { if (!s || !s.id) return; try { const j = await loadJob(store.get("base"), s.id); if (!j) return; const i = jobs.findIndex(x => x.id === j.id); if (i >= 0) jobs[i] = j; else jobs.unshift(j); draw(); } catch (_) {} };
  q.addEventListener("input", draw);
  rows.addEventListener("click", e => { const r = e.target.closest(".lv-row"); if (!r) return; const j = jobs.find(x => x.id === r.dataset.id); store.set("visit", j || null); store.set("visitId", r.dataset.id); draw(); });
  stops.push(store.on("base", load), store.on("visitId", draw), store.on("visitSaved", refreshOne), store.on("year", draw));
  load();
  return { destroy: () => stops.forEach(s => s()) };
}
