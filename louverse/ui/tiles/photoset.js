// blocks/photoset.js - every photo the selected job has (storage folder + device rows + daily rows), tap = full screen.
// Also follows `tx` (2026-10-04, L: "when I click on the ledger item if there's an image shouldn't that show up in the photos
// tile"): a picked ledger row with a receipt photo shows that photo; the last pick wins - a job pick brings the job photos back.
// ACTIONS (L 2026-10-04 "when an image shows up I should get the options for adding, editing, deleting"): the options the
// corresponding app has - a receipt: add / replace / delete (the finance apps' rule: {base}/images/{year}/..., img + imgPath on
// the row); a job photo: add to the job's folder, delete (out of its device/daily row + the file), note on device/daily photos.
// Deletes are two-tap (no blocking confirm()). Signed out = look only.
import { listJobPhotos, loadJob, addJobPhoto, deleteJobPhoto, setJobPhotoNote } from "../../core/jobs.js";
import { money2, setRowImage } from "../../core/ledger.js";
import { uploadDated, removeImage, pickImage } from "../../core/images.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const title = "Photos";
export const sub = ["visitId", "tx"];
export const pub = ["ledgerSaved"];   // a receipt added / replaced / removed -> the ledger and the analytics redraw
export function mount(body, { store, tile }) {
  let stops = [], run = 0;
  const canWrite = () => true;   // public = a tree you work in, same as every app - no sign-in gate (L 2026-10-04)
  const status = (msg, bad) => { const s = body.querySelector(".lv-status"); if (s) { s.textContent = msg || ""; s.classList.toggle("bad", !!bad); } };
  const armed = new WeakMap();   // two-tap delete: the first tap arms the button for 3 s, the second runs it
  const twoTap = (btn, label, fn) => btn.addEventListener("click", async e => { e.stopPropagation(); const until = armed.get(btn);
    if (until && Date.now() < until) { armed.delete(btn); btn.disabled = true; try { await fn(); } catch (err) { status(err.message || String(err), true); btn.disabled = false; btn.textContent = label; } return; }
    armed.set(btn, Date.now() + 3000); btn.textContent = "tap again"; setTimeout(() => { const u = armed.get(btn); if (u && Date.now() >= u) { armed.delete(btn); btn.textContent = label; } }, 3100); });
  const wireFull = () => body.querySelectorAll(".lv-photos img").forEach(img => img.addEventListener("click", () => { const full = document.createElement("div"); full.className = "lv-photo-full"; full.innerHTML = `<img src="${esc(img.src)}" alt="">`; full.onclick = () => full.remove(); document.body.appendChild(full); }));
  const fig = (p, i, acts, lazy) => `<figure><img${lazy ? ' loading="lazy"' : ""} src="${esc(p.url)}" data-i="${i}" alt="${esc(p.name)}"><figcaption title="${esc(p.src)}">${esc(p.name)}${p.note ? " · " + esc(p.note) : ""}</figcaption>${acts ? `<div class="lv-pact">${acts}</div>` : ""}</figure>`;
  const tools = (btns, note) => `<div class="lv-tools">${btns}<span class="lv-status">${esc(note || "")}</span></div>`;

  // ---- one ledger row: its receipt (shown whole), with the finance apps' options ----
  const drawTx = tx => {
    ++run; const when = tx.dt instanceof Date ? tx.dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "";
    tile.setTitle(`Photos · ${tx.name || "ledger row"}`);
    const w = canWrite(), year = tx.year || store.get("year"), base = store.get("base");
    const btns = !w ? "" : tx.img ? `<button type="button" class="lv-btn" data-act="replace">✎ Replace</button><button type="button" class="lv-btn" data-act="del">🗑 Delete</button>` : `<button type="button" class="lv-btn primary" data-act="add">➕ Add receipt</button>`;
    body.innerHTML = tools(btns, "") + (tx.img
      ? `<div class="lv-photos one">${fig({ url: tx.img, name: `${tx.name} · ${money2.format(tx.amt)}${when ? " · " + when : ""}`, src: tx.imgPath || "ledger" }, 0, "", false)}</div>` + (tx.desc ? `<div class="lv-muted" style="margin-top:6px">${esc(tx.desc)}</div>` : "")
      : `<div class="lv-empty">${esc(tx.name || "This row")} has no receipt photo.</div>`);
    wireFull();
    const after = (url, path) => { const row = { ...tx, img: url, imgPath: path }; store.set("ledgerSaved", Date.now()); store.set("tx", row); };
    const upload = async () => { const file = await pickImage(); if (!file) return; status("uploading…");
      const { url, path } = await uploadDated({ file, basePath: `${base}/images`, name: tx.name, priorPath: tx.imgPath, dateMs: tx.dt instanceof Date ? tx.dt.getTime() : undefined });
      await setRowImage(base, year, tx.id, { url, path }); after(url, path); };
    body.querySelector('[data-act="add"]')?.addEventListener("click", () => upload().catch(e => status(e.message || String(e), true)));
    body.querySelector('[data-act="replace"]')?.addEventListener("click", () => upload().catch(e => status(e.message || String(e), true)));
    const del = body.querySelector('[data-act="del"]'); if (del) twoTap(del, "🗑 Delete", async () => { status("deleting…"); await removeImage(tx.imgPath); await setRowImage(base, year, tx.id, { url: "", path: "" }); after("", ""); });
  };

  // ---- the picked job: every photo, with onlinejob's options ----
  const drawJob = async () => {
    const id = store.get("visitId"), my = ++run; if (!id) { body.innerHTML = `<div class="lv-empty">Pick a visit to see its photos, or a ledger row to see its receipt.</div>`; tile.setTitle("Photos"); return; }
    body.innerHTML = `<div class="lv-empty">loading photos…</div>`;
    const base = store.get("base");
    let j = store.get("visit"); if (!j || j.id !== id) { try { j = await loadJob(base, id); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; } }
    if (!j) return; let photos = [];
    try { photos = await listJobPhotos(base, j); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; }
    if (my !== run) return;   // a newer pick won
    const w = canWrite();
    tile.setTitle(`Photos · ${photos.length}`);
    body.innerHTML = tools(`<button type="button" class="lv-btn primary" data-act="add">➕ Add photo</button>`, "")
      + (photos.length ? `<div class="lv-photos">${photos.map((p, i) => fig(p, i, w ? `${p.where && p.where.kind !== "folder" ? `<button type="button" class="lv-btn ico" data-note="${i}" title="note">✎</button>` : ""}<button type="button" class="lv-btn ico" data-del="${i}" title="delete">🗑</button>` : "", true)).join("")}</div>` : `<div class="lv-empty">No photos on this visit.</div>`);
    wireFull();
    const refresh = async () => { try { const fresh = await loadJob(base, id); if (fresh) store.set("visit", fresh); } catch (_) {} drawJob(); };
    body.querySelector('[data-act="add"]')?.addEventListener("click", async () => { try { const file = await pickImage(); if (!file) return; status("uploading…"); await addJobPhoto(base, j, file); await refresh(); } catch (e) { status(e.message || String(e), true); } });
    body.querySelectorAll("[data-del]").forEach(b => twoTap(b, "🗑", async () => { status("deleting…"); await deleteJobPhoto(base, j, photos[Number(b.dataset.del)]); await refresh(); }));
    body.querySelectorAll("[data-note]").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); const p = photos[Number(b.dataset.note)], cap = b.closest("figure").querySelector("figcaption"); if (cap.querySelector("input")) return;
      const inp = document.createElement("input"); inp.className = "lv-note"; inp.value = p.note || ""; inp.placeholder = "note"; cap.textContent = ""; cap.appendChild(inp); inp.focus();
      let done = false; const save = async () => { if (done) return; done = true; const note = inp.value.trim(); cap.textContent = p.name + (note ? " · " + note : ""); if (note === (p.note || "")) return;
        try { await setJobPhotoNote(base, j, p, note); p.note = note; } catch (err) { status(err.message || String(err), true); } };
      inp.addEventListener("keydown", ev => { if (ev.key === "Enter") { ev.preventDefault(); inp.blur(); } if (ev.key === "Escape") { done = true; cap.textContent = p.name + (p.note ? " · " + p.note : ""); } });
      inp.addEventListener("blur", save); inp.addEventListener("pointerdown", ev => ev.stopPropagation()); }));
  };
  stops.push(store.on("visitId", drawJob), store.on("base", drawJob), store.on("tx", tx => tx ? drawTx(tx) : drawJob()));
  const tx = store.get("tx"); if (tx && !store.get("visitId")) drawTx(tx); else drawJob();
  return { destroy: () => stops.forEach(s => s()) };
}
