// tiles/details.js - the picked visit's DEVICE LISTS (L 2026-10-04: "if it was a radar job, the details stuff could be a tile"):
// every list on the record with its rows - id, serial, model, status, photo count - read-only here (the Jobs / Details apps edit
// them). Telaid data stays in its own tree; this just reads whichever tree the board is on.
import { loadJob, deviceLists } from "../../core/jobs.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const title = "Details";
export const sub = ["visitId", "visitSaved"];
export function mount(body, { store, tile }) {
  let stops = [], run = 0;
  const draw = async () => {
    const id = store.get("visitId"), my = ++run; if (!id) { body.innerHTML = `<div class="lv-empty">Pick a visit.</div>`; tile.setTitle("Details"); return; }
    let j = store.get("visit"); if (!j || j.id !== id) { try { j = await loadJob(store.get("base"), id); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; } }
    if (!j || my !== run) return; const lists = deviceLists(j), total = lists.reduce((t, l) => t + l.rows.length, 0);
    tile.setTitle(`Details · ${total} device${total === 1 ? "" : "s"}`);
    if (!lists.length) { body.innerHTML = `<div class="lv-empty">No device lists on this visit.<br><a class="lv-btn" style="margin-top:8px;display:inline-block" href="https://luissolutions.us/apps/online/onlinedetails.html?task=${encodeURIComponent(j.id)}" target="_blank" rel="noopener">open in Details ↗</a></div>`; return; }
    body.innerHTML = lists.map(l => `<div class="lv-muted h" style="margin:8px 0 4px;font-size:.8rem">${esc(l.name)} · ${l.rows.length}${l.rows.some(r => r.counted) ? ` · ${l.rows.filter(r => r.counted).length} counted` : ""}</div>
      <div class="lv-tbl"><b>ID</b><b>Serial</b><b>Model</b><b>Status</b>${l.rows.map(r => `<span>${r.counted ? "✓ " : ""}${esc(r.id)}</span><span>${esc(r.serial)}</span><span>${esc(r.model || r.type)}</span><span>${esc(r.status)}${r.photos ? ` · 📷${r.photos}` : ""}</span>`).join("")}</div>`).join("")
      + `<div class="lv-chips" style="margin-top:8px"><a class="lv-btn" href="https://luissolutions.us/apps/online/onlinedetails.html?task=${encodeURIComponent(j.id)}" target="_blank" rel="noopener">edit in Details ↗</a></div>`;
  };
  stops.push(store.on("visitId", draw), store.on("base", draw), store.on("visitSaved", s => { if (s && s.id === store.get("visitId")) draw(); })); draw();
  return { destroy: () => stops.forEach(s => s()) };
}
