// blocks/joblist.js - the jobs list: search + rows; picking one sets store.jobId so the card and the photos follow.
import { loadJobs, fmtDate, fmtHours } from "../../core/jobs.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const title = "Jobs";
export function mount(body, { store }) {
  body.innerHTML = `<input class="lv-search" type="search" placeholder="Search jobs (customer, project, WO)" autocomplete="off"><div class="lv-rows"></div>`;
  const q = body.querySelector("input"), rows = body.querySelector(".lv-rows"); let jobs = [], stops = [];
  const draw = () => { const t = q.value.trim().toLowerCase(), sel = store.get("jobId");
    const hit = jobs.filter(j => !t || `${j.customer} ${j.project} ${j.wo}`.toLowerCase().includes(t)), show = hit.slice(0, 300);
    rows.innerHTML = show.length ? show.map(j => `<div class="lv-row${j.id === sel ? " on" : ""}" data-id="${j.id}"><div><div class="n">${esc(j.customer)}</div><div class="s">${esc([j.project, j.wo].filter(Boolean).join(" · "))} ${fmtDate(j.start)}</div></div><div class="v">${fmtHours(j.hours)}</div></div>`).join("") + (hit.length > show.length ? `<div class="lv-muted">showing ${show.length} of ${hit.length}</div>` : "")
      : `<div class="lv-empty">${jobs.length ? "no match" : "no jobs"}</div>`; };
  const load = async () => { rows.innerHTML = `<div class="lv-empty">loading…</div>`;
    try { jobs = await loadJobs(store.get("base")); } catch (e) { jobs = []; rows.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; }
    if (!jobs.length && store.get("base") === "public") { rows.innerHTML = `<div class="lv-empty">Sign in to see your jobs.</div>`; return; }
    draw(); };
  q.addEventListener("input", draw);
  rows.addEventListener("click", e => { const r = e.target.closest(".lv-row"); if (!r) return; const j = jobs.find(x => x.id === r.dataset.id); store.set("job", j || null); store.set("jobId", r.dataset.id); draw(); });
  stops.push(store.on("base", load), store.on("jobId", draw));
  load();
  return { destroy: () => stops.forEach(s => s()) };
}
