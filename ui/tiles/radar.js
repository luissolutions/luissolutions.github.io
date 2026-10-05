// tiles/radar.js - the RADAR door (L 2026-10-04 "continue with what remains"): the LS copies of the Telaid radar pages
// (apps/telaid - radar-tools / radar-map / sensor-lookup / radar-dashboard, the ones that read + write the Sensors device list)
// had no way in from the board. A picked job shows its project's Sensors progress (off the meta-owner, the same rows Details
// shows) and the four pages open with that job's task; ⤢ = the radar map for it. Relative URLs: the pages ride along with the
// board (repo root on github.io, apps/dev/board on the luissolutions.us mirror) so the frame stays same-origin, one sign-in.
import { loadJobs, metaOwnerOf, sensorRows, sensorsListOf } from "../../core/jobs.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const APP = new URL("../../apps/telaid/", import.meta.url).href;
let lastOwner = "", lastFor = "";   // the meta-owner of the last job drawn, and the pick it was drawn for - ⤢ opens the map on it
const withTask = (page, id) => APP + page + (id ? "?task=" + encodeURIComponent(id) : "");

// ⤢ follows the CURRENT pick (L 2026-10-05 "it stays at the walmart map when I switch jobs"): the owner lookup is async, so
// a ⤢ right after a pick used to open the previous job's map. Until the lookup lands, open the picked id itself - the map
// swaps a sibling night for its project record on load.
export const appUrl = store => { const id = store && store.get("visitId") || ""; return withTask("radar-map.html", id && lastFor === id && lastOwner ? lastOwner : id || lastOwner); };
export const title = "Radar";
export const sub = ["visitId"];
export function mount(body, { store, tile }) {
  let stops = [], run = 0;
  const pages = id => `<div class="lv-chips">
      <a class="lv-btn" target="_blank" rel="noopener" href="${esc(APP + "radar-tools.html")}">Radar tools</a>
      <a class="lv-btn" target="_blank" rel="noopener" href="${esc(withTask("radar-map.html", id))}">Map</a>
      <a class="lv-btn" target="_blank" rel="noopener" href="${esc(withTask("sensor-lookup.html", id))}">Sensor lookup</a>
      <a class="lv-btn" target="_blank" rel="noopener" href="${esc(APP + "radar-dashboard.html")}">Dashboard</a></div>`;
  const draw = async () => {
    const id = store.get("visitId"), my = ++run;
    if (!id) { lastOwner = ""; lastFor = ""; tile.setTitle("Radar"); body.innerHTML = pages("") + `<div class="lv-empty">Pick a radar job to see its sensors.</div>`; return; }
    body.innerHTML = pages("") + `<div class="lv-empty">loading…</div>`;
    let owner, rows;
    try { const jobs = await loadJobs(store.get("base"));   // fresh each pick - the radar pages tick rows between looks
      const j = jobs.find(x => x.id === id) || store.get("visit");
      owner = j ? await metaOwnerOf(store.get("base"), j, jobs) : null; rows = owner ? sensorRows(owner) : []; }
    catch (e) { if (my === run) body.innerHTML = pages("") + `<div class="lv-err">${esc(e.message || e)}</div>`; return; }
    if (my !== run) return;
    lastOwner = owner?.id || ""; lastFor = id;
    tile.setTitle(`Radar · ${owner?.customer || "job"}`);
    if (!rows.length) { body.innerHTML = pages(lastOwner) + `<div class="lv-empty">No sensors on this project.</div>`; return; }
    const n = rows.length, c = k => rows.filter(r => r[k]).length, pct = v => Math.round(v / n * 100);
    const from = sensorsListOf(owner) ? "Sensors list" : "sensorMeta (no Sensors list yet)";
    const line = (label, v) => `<b>${label}</b><span>${v} of ${n} · ${pct(v)}%</span>`;
    body.innerHTML = pages(lastOwner) + `<div class="lv-kv">
        <b>Sensors</b><span>${n}</span>
        ${line("Labeled", c("labeled"))}${line("Run done", c("run"))}${line("On the map", c("placed"))}
        ${line("Serial in", rows.filter(r => r.serial).length)}
        <b>With photos</b><span>${rows.filter(r => r.photos).length}</span>
        <b>With notes</b><span>${rows.filter(r => r.notes).length}</span>
        <b>Source</b><span class="lv-muted">${esc(from)}</span></div>`;
  };
  stops.push(store.on("visitId", draw), store.on("base", draw)); draw();
  return { destroy: () => stops.forEach(s => s()) };
}
