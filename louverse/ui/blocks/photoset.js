// blocks/photoset.js - every photo the selected job has (storage folder + device rows + daily rows), tap = full screen.
import { listJobPhotos, loadJob } from "../../core/jobs.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const title = "Photos";
export function mount(body, { store, block }) {
  let stops = [], run = 0;
  const draw = async () => {
    const id = store.get("jobId"), my = ++run; if (!id) { body.innerHTML = `<div class="lv-empty">Pick a job to see its photos.</div>`; block.setTitle("Photos"); return; }
    body.innerHTML = `<div class="lv-empty">loading photos…</div>`;
    let j = store.get("job"); if (!j || j.id !== id) { try { j = await loadJob(store.get("base"), id); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; } }
    if (!j) return; let photos = [];
    try { photos = await listJobPhotos(store.get("base"), j); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; }
    if (my !== run) return;   // a newer pick won
    block.setTitle(`Photos · ${photos.length}`);
    body.innerHTML = photos.length ? `<div class="lv-photos">${photos.map((p, i) => `<figure style="margin:0"><img loading="lazy" src="${esc(p.url)}" data-i="${i}" alt="${esc(p.name)}"><figcaption title="${esc(p.src)}">${esc(p.name)}</figcaption></figure>`).join("")}</div>` : `<div class="lv-empty">No photos on this job.</div>`;
    body.querySelectorAll("img").forEach(img => img.addEventListener("click", () => { const full = document.createElement("div"); full.className = "lv-photo-full"; full.innerHTML = `<img src="${esc(img.src)}" alt="">`; full.onclick = () => full.remove(); document.body.appendChild(full); }));
  };
  stops.push(store.on("jobId", draw), store.on("base", draw)); draw();
  return { destroy: () => stops.forEach(s => s()) };
}
