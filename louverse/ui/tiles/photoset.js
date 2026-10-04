// blocks/photoset.js - every photo the selected job has (storage folder + device rows + daily rows), tap = full screen.
// Also follows `tx` (2026-10-04, L: "when I click on the ledger item if there's an image shouldn't that show up in the photos
// tile"): a picked ledger row with a receipt photo shows that photo; the last pick wins - a job pick brings the job photos back.
// ACTIONS (L 2026-10-04 "when an image shows up I should get the options for adding, editing, deleting"): the options the
// corresponding app has - a receipt: add / replace / delete (the finance apps' rule: {base}/images/{year}/..., img + imgPath on
// the row); a job photo: add to the job's folder, delete (out of its device/daily row + the file), note on device/daily photos.
// LABELS (L 2026-10-04 "the options for labels should be present in anything selected - a universal system"): 🏷 on EVERY
// photo - job photos from any folder and the receipt alike - stamps the apps' bar (core/images relabel) or crops it back off.
// FOLDERS (L: "how are we handling the photos present in different directories"): chips group the job's photos by where they
// live - images (the loose root), each subfolder (sensors, siteImages, a list's folder ...), device rows, daily rows.
// THUMBS (L: "the photos tile is creating a lot of lag"): the grid shows 256 px thumbs (core/images thumbOf), the tap opens the
// original. Deletes and stamps are two-tap (no blocking confirm()).
// ROW FOCUS (L 2026-10-04 "when I click a device list or device data item and it has a picture, use the Photos tile to present
// it"): Details sets `photoPick` {kind device|sensor, ...label}; this tile narrows the job's photos to that row's (core/jobs
// photoMatches), a "✕ <row>" chip goes back to all of them. The listing is cached per visit so a row tap costs nothing.
import { listJobPhotos, photoUrl, photoMatches, loadJob, addJobPhoto, deleteJobPhoto, setJobPhotoNote, labelJobPhoto, autoLabel } from "../../core/jobs.js";
import { money2, setRowImage } from "../../core/ledger.js";
import { uploadDated, removeImage, pickImage, thumbOf, forgetThumb, relabel } from "../../core/images.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const title = "Photos";
export const sub = ["visitId", "tx", "photoPick"];
export const pub = ["ledgerSaved"];   // a receipt added / replaced / removed -> the ledger and the analytics redraw
const GRID_MAX = 120;   // thumbs per draw - a folder chip or a row focus narrows a big job
export function mount(body, { store, tile }) {
  let stops = [], run = 0, folder = "", folderJob = "", focus = null, cache = null;   // cache = { base, id, photos } - one storage listing per visit
  const canWrite = () => true;   // public = a tree you work in, same as every app - no sign-in gate (L 2026-10-04)
  const status = (msg, bad) => { const s = body.querySelector(".lv-status"); if (s) { delete s.dataset.busy; s.textContent = msg || ""; s.classList.toggle("bad", !!bad); } };
  const armed = new WeakMap();   // two-tap: the first tap arms the button for 3 s, the second runs it
  const twoTap = (btn, label, fn) => btn.addEventListener("click", async e => { e.stopPropagation(); const until = armed.get(btn);
    if (until && Date.now() < until) { armed.delete(btn); btn.disabled = true; try { await fn(); } catch (err) { status(err.message || String(err), true); btn.disabled = false; btn.textContent = label; } return; }
    armed.set(btn, Date.now() + 3000); btn.textContent = "tap again"; setTimeout(() => { const u = armed.get(btn); if (u && Date.now() >= u) { armed.delete(btn); btn.textContent = label; } }, 3100); });
  // the grid holds THUMBS; the full picture opens on tap from data-full
  const wireFull = () => body.querySelectorAll(".lv-photos img").forEach(img => img.addEventListener("click", () => { const full = document.createElement("div"); full.className = "lv-photo-full"; full.innerHTML = `<img src="${esc(img.dataset.full || img.src)}" alt="">`; full.onclick = () => full.remove(); document.body.appendChild(full); }));
  const capText = p => `${p.markup ? "🏷 " + esc(p.markup) : esc(p.name)}${p.note ? " · " + esc(p.note) : ""}`;
  const fig = (p, i, acts) => `<figure data-i="${i}"><img data-full="${esc(p.url || "")}" data-i="${i}" alt="" decoding="async"><figcaption title="${esc(p.src)}${p.markup ? " · " + esc(p.name) : ""}">${capText(p)}</figcaption>${acts ? `<div class="lv-pact">${acts}</div>` : ""}</figure>`;
  // thumbs land one by one; the status counts them in so a slow first open (every photo fetched once) reads as loading, not broken
  const fillThumbs = (photos, w) => { const imgs = [...body.querySelectorAll(".lv-photos img[data-i]")]; let done = 0; const total = imgs.length, st = body.querySelector(".lv-status");
    const tick = () => { if (!st || !st.isConnected) return; if (done < total) { if (!st.dataset.busy) { st.dataset.busy = "1"; st.textContent = `thumbs ${done}/${total}`; } else st.textContent = `thumbs ${done}/${total}`; } else if (st.dataset.busy) { delete st.dataset.busy; st.textContent = ""; } };
    tick(); imgs.forEach(img => { const p = photos[Number(img.dataset.i)]; if (!p) { done++; tick(); return; }
      (p.url ? Promise.resolve(p.url) : photoUrl(p)).then(u => { if (!u) return ""; img.dataset.full = u; return thumbOf(p, w); }).then(u => { if (img.isConnected && u) img.src = u; }).finally(() => { done++; tick(); }); }); };
  const tools = (btns, note) => `<div class="lv-tools">${btns}<span class="lv-status">${esc(note || "")}</span></div>`;
  // the label editor, in the caption: text (prefilled with the current bar or the app's auto text), Stamp / No bar (two-tap), ✕
  const labelUI = (figEl, { current, auto, apply }) => { const cap = figEl.querySelector("figcaption"); if (!cap || cap.querySelector("input")) return; const keep = cap.innerHTML;
    cap.innerHTML = ""; cap.classList.add("editing"); const inp = document.createElement("input"); inp.className = "lv-note"; inp.value = current || auto || ""; inp.placeholder = "label text";
    const row = document.createElement("div"); row.className = "lv-actions"; const mk = (t, cls) => { const b = document.createElement("button"); b.type = "button"; b.className = "lv-btn" + (cls ? " " + cls : ""); b.textContent = t; return b; };
    const ok = mk("🏷 Stamp", "primary"), strip = mk("✂ No bar"), x = mk("✕"); row.append(ok, strip, x); cap.append(inp, row); inp.focus();
    [inp, row].forEach(el => el.addEventListener("pointerdown", ev => ev.stopPropagation()));
    const done = () => { cap.classList.remove("editing"); cap.innerHTML = keep; }; x.onclick = done; inp.addEventListener("keydown", ev => { if (ev.key === "Escape") done(); });
    twoTap(ok, "🏷 Stamp", async () => { const t = inp.value.trim(); if (!t) throw new Error("type the label first"); status("stamping…"); await apply(t); });
    twoTap(strip, "✂ No bar", async () => { status("cropping the bar…"); await apply(""); }); };

  // ---- one ledger row: its receipt (shown whole), with the finance apps' options + the label ----
  const drawTx = tx => {
    ++run; const when = tx.dt instanceof Date ? tx.dt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "";
    tile.setTitle(`Photos · ${tx.name || "ledger row"}`);
    const w = canWrite(), year = tx.year || store.get("year"), base = store.get("base");
    const btns = !w ? "" : tx.img ? `<button type="button" class="lv-btn" data-act="label">🏷 Label</button><button type="button" class="lv-btn" data-act="replace">✎ Replace</button><button type="button" class="lv-btn" data-act="del">🗑 Delete</button>` : `<button type="button" class="lv-btn primary" data-act="add">➕ Add receipt</button>`;
    const receipt = tx.img ? [{ url: tx.img, path: tx.imgPath || "", name: `${tx.name} · ${money2.format(tx.amt)}${when ? " · " + when : ""}`, src: tx.imgPath || "ledger" }] : [];
    body.innerHTML = tools(btns, "") + (tx.img
      ? `<div class="lv-photos one">${fig(receipt[0], 0, "")}</div>` + (tx.desc ? `<div class="lv-note">${esc(tx.desc)}</div>` : "")
      : `<div class="lv-empty">${esc(tx.name || "This row")} has no receipt photo.</div>`);
    wireFull(); fillThumbs(receipt, 1024);   // one receipt, shown whole - a 1024 px copy reads fine, the tap opens the original
    const after = (url, path) => { forgetThumb({ path: tx.imgPath, url: tx.img }); const row = { ...tx, img: url, imgPath: path }; store.set("ledgerSaved", Date.now()); store.set("tx", row); };
    const upload = async () => { const file = await pickImage(); if (!file) return; status("uploading…");
      const { url, path } = await uploadDated({ file, basePath: `${base}/images`, name: tx.name, priorPath: tx.imgPath, dateMs: tx.dt instanceof Date ? tx.dt.getTime() : undefined });
      await setRowImage(base, year, tx.id, { url, path }); after(url, path); };
    body.querySelector('[data-act="add"]')?.addEventListener("click", () => upload().catch(e => status(e.message || String(e), true)));
    body.querySelector('[data-act="replace"]')?.addEventListener("click", () => upload().catch(e => status(e.message || String(e), true)));
    body.querySelector('[data-act="label"]')?.addEventListener("click", () => labelUI(body.querySelector(".lv-photos figure"), { current: "", auto: receipt[0].name,
      apply: async t => { const r = await relabel({ url: tx.img, path: tx.imgPath, text: t }); await setRowImage(base, year, tx.id, { url: r.url, path: tx.imgPath }); after(r.url, tx.imgPath); } }));
    const del = body.querySelector('[data-act="del"]'); if (del) twoTap(del, "🗑 Delete", async () => { status("deleting…"); await removeImage(tx.imgPath); await setRowImage(base, year, tx.id, { url: "", path: "" }); after("", ""); });
  };

  // ---- the picked job: every photo, grouped by where it lives, with onlinejob's options + the label on each ----
  const groupOf = p => p.where?.kind === "device" ? "device" : p.where?.kind === "daily" ? "daily" : p.src || "images";
  const drawJob = async () => {
    const id = store.get("visitId"), my = ++run; if (!id) { body.innerHTML = `<div class="lv-empty">Pick a visit to see its photos, or a ledger row to see its receipt.</div>`; tile.setTitle("Photos"); return; }
    body.innerHTML = `<div class="lv-empty">loading photos…</div>`;
    const base = store.get("base"); if (folderJob !== id) { folder = ""; folderJob = id; }
    let j = store.get("visit"); if (!j || j.id !== id) { try { j = await loadJob(base, id); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; } }
    if (!j) return; let photos = [];
    if (cache && cache.id === id && cache.base === base) photos = cache.photos;
    else { try { photos = await listJobPhotos(base, j); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; } cache = { base, id, photos }; }
    if (my !== run) return;   // a newer pick won
    const w = canWrite(), groups = new Map(); for (const p of photos) groups.set(groupOf(p), (groups.get(groupOf(p)) || 0) + 1);
    if (folder && !groups.has(folder)) folder = "";
    const f = focus, pool = photos.map((p, i) => [p, i]).filter(([p]) => photoMatches(p, f));   // the tapped row's photos, or all
    const shown0 = f ? pool : pool.filter(([p]) => !folder || groupOf(p) === folder), shown = shown0.slice(0, GRID_MAX);
    tile.setTitle(`Photos · ${f ? `${f.label} · ${pool.length}` : folder ? `${shown0.length} of ${photos.length} · ${folder}` : photos.length}`);
    const acts = (p, i) => w ? `<button type="button" class="lv-btn ico" data-label="${i}" title="label bar">🏷</button>${p.where && p.where.kind !== "folder" ? `<button type="button" class="lv-btn ico" data-note="${i}" title="note">✎</button>` : ""}<button type="button" class="lv-btn ico" data-del="${i}" title="delete">🗑</button>` : "";
    body.innerHTML = tools(`<button type="button" class="lv-btn primary" data-act="add">➕ Add photo</button>`, "")
      + (f ? `<div class="lv-chips lv-cats"><button type="button" class="lv-chip on" data-unfocus title="back to every photo on the visit">✕ ${esc(f.label)} · ${pool.length}</button></div>`
        : groups.size > 1 ? `<div class="lv-chips lv-cats"><button type="button" class="lv-chip${!folder ? " on" : ""}" data-folder="">all ${photos.length}</button>${[...groups.entries()].map(([g, n]) => `<button type="button" class="lv-chip${g === folder ? " on" : ""}" data-folder="${esc(g)}">${esc(g)} ${n}</button>`).join("")}</div>` : "")
      + (shown.length ? `<div class="lv-photos">${shown.map(([p, i]) => fig(p, i, acts(p, i))).join("")}</div>` : `<div class="lv-empty">${f ? `No photo for ${esc(f.label)}.` : "No photos on this visit."}</div>`)
      + (shown0.length > GRID_MAX ? `<div class="lv-note">showing ${GRID_MAX} of ${shown0.length} - pick a folder</div>` : "");
    wireFull(); fillThumbs(photos, 256);
    body.querySelectorAll("[data-folder]").forEach(b => b.onclick = () => { folder = b.dataset.folder; drawJob(); });
    const un = body.querySelector("[data-unfocus]"); if (un) un.onclick = () => store.set("photoPick", null);
    const refresh = async () => { cache = null; try { const fresh = await loadJob(base, id); if (fresh) store.set("visit", fresh); } catch (_) {} drawJob(); };
    body.querySelector('[data-act="add"]')?.addEventListener("click", async () => { try { const file = await pickImage(); if (!file) return; status("uploading…"); await addJobPhoto(base, j, file); await refresh(); } catch (e) { status(e.message || String(e), true); } });
    body.querySelectorAll("[data-del]").forEach(b => twoTap(b, "🗑", async () => { status("deleting…"); await deleteJobPhoto(base, j, photos[Number(b.dataset.del)]); await refresh(); }));
    body.querySelectorAll("[data-label]").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); const p = photos[Number(b.dataset.label)];
      labelUI(b.closest("figure"), { current: p.markup, auto: autoLabel(j, p), apply: async t => { await photoUrl(p); await labelJobPhoto(base, j, p, t); await refresh(); } }); }));
    body.querySelectorAll("[data-note]").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); const p = photos[Number(b.dataset.note)], cap = b.closest("figure").querySelector("figcaption"); if (cap.querySelector("input")) return;
      const inp = document.createElement("input"); inp.className = "lv-note"; inp.value = p.note || ""; inp.placeholder = "note"; cap.textContent = ""; cap.classList.add("editing"); cap.appendChild(inp); inp.focus();
      let done = false; const save = async () => { if (done) return; done = true; const note = inp.value.trim(); cap.classList.remove("editing"); cap.innerHTML = capText({ ...p, note }); if (note === (p.note || "")) return;
        try { await setJobPhotoNote(base, j, p, note); p.note = note; } catch (err) { status(err.message || String(err), true); } };
      inp.addEventListener("keydown", ev => { if (ev.key === "Enter") { ev.preventDefault(); inp.blur(); } if (ev.key === "Escape") { done = true; cap.classList.remove("editing"); cap.innerHTML = capText(p); } });
      inp.addEventListener("blur", save); inp.addEventListener("pointerdown", ev => ev.stopPropagation()); }));
  };
  stops.push(store.on("visitId", () => { focus = null; drawJob(); }), store.on("base", () => { cache = null; focus = null; drawJob(); }), store.on("tx", tx => tx ? drawTx(tx) : drawJob()),
    store.on("photoPick", v => { focus = v || null; if (store.get("visitId")) drawJob(); }));   // a row tapped in Details -> its photos (a cleared pick -> all of them)
  const tx = store.get("tx"); if (tx && !store.get("visitId")) drawTx(tx); else drawJob();
  return { destroy: () => stops.forEach(s => s()) };
}
