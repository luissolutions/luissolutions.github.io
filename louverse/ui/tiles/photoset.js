// blocks/photoset.js - every photo the selected job has (storage folder + device rows + daily rows), tap = full screen.
// Also follows `tx` (2026-10-04, L: "when I click on the ledger item if there's an image shouldn't that show up in the photos
// tile"): a picked ledger row with a receipt photo shows that photo; the last pick wins - a job pick brings the job photos back.
import { listJobPhotos, loadJob } from "../../core/jobs.js";
import { money2 } from "../../core/ledger.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const title = "Photos";
export const sub = ["jobId", "tx"];
export function mount(body, { store, tile }) {
  let stops = [], run = 0;
  const wireFull = () => body.querySelectorAll("img").forEach(img => img.addEventListener("click", () => { const full = document.createElement("div"); full.className = "lv-photo-full"; full.innerHTML = `<img src="${esc(img.src)}" alt="">`; full.onclick = () => full.remove(); document.body.appendChild(full); }));
  const grid = (photos, lazy = true) => `<div class="lv-photos">${photos.map((p, i) => `<figure style="margin:0"><img${lazy ? ' loading="lazy"' : ""} src="${esc(p.url)}" data-i="${i}" alt="${esc(p.name)}"><figcaption title="${esc(p.src)}">${esc(p.name)}</figcaption></figure>`).join("")}</div>`;
  const drawTx = tx => {   // one ledger row: its receipt, or say it has none
    ++run; const when = tx.dt instanceof Date ? tx.dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "";
    tile.setTitle(`Photos · ${tx.name || "ledger row"}`);
    body.innerHTML = tx.img ? grid([{ url: tx.img, name: `${tx.name} · ${money2.format(tx.amt)}${when ? " · " + when : ""}`, src: tx.imgPath || "ledger" }], false) + (tx.desc ? `<div class="lv-muted" style="margin-top:6px">${esc(tx.desc)}</div>` : "")
      : `<div class="lv-empty">${esc(tx.name || "This row")} has no receipt photo.</div>`;
    wireFull();
  };
  const drawJob = async () => {
    const id = store.get("jobId"), my = ++run; if (!id) { body.innerHTML = `<div class="lv-empty">Pick a job to see its photos, or a ledger row to see its receipt.</div>`; tile.setTitle("Photos"); return; }
    body.innerHTML = `<div class="lv-empty">loading photos…</div>`;
    let j = store.get("job"); if (!j || j.id !== id) { try { j = await loadJob(store.get("base"), id); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; } }
    if (!j) return; let photos = [];
    try { photos = await listJobPhotos(store.get("base"), j); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; }
    if (my !== run) return;   // a newer pick won
    tile.setTitle(`Photos · ${photos.length}`);
    body.innerHTML = photos.length ? grid(photos) : `<div class="lv-empty">No photos on this job.</div>`;
    wireFull();
  };
  stops.push(store.on("jobId", drawJob), store.on("base", drawJob), store.on("tx", tx => tx ? drawTx(tx) : drawJob()));
  const tx = store.get("tx"); if (tx && !store.get("jobId")) drawTx(tx); else drawJob();
  return { destroy: () => stops.forEach(s => s()) };
}
