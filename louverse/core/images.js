// core/images.js - the IMAGE rules, one copy for the Louverse (the SES apps carry the same numbers in
// apps/assets/js/imgupload.js - this repo is self-contained, so the rules live here too). No HTML in here.
//   resize   : JPEG, max 2048 px wide, quality 0.9 (an already-small JPEG/PNG/GIF passes through untouched)
//   filename : {slug}_{YYYY-MM-DD}_{ms}.jpg   under {basePath}/{YYYY}/   (the finance apps' receipt rule)
//   folder   : {slug}.jpg collision-safe (_2, _3 ...) inside a given storage folder (onlinejob's loose-photo rule)
import { storage, storageRef, uploadBytes, getDownloadURL, deleteObject, listAll } from "./firebase.js";

export const slugify = s => (String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "image");
export const isImageFile = f => !!f && /^image\//.test(f.type || "");

export async function toJpeg(file, maxW = 2048, quality = 0.9) {
  if (!isImageFile(file)) return { blob: file, contentType: file?.type || "application/octet-stream" };
  const bmp = await createImageBitmap(file);
  const passthrough = /^image\/(jpeg|png|gif)$/.test(file.type || "");
  if (bmp.width <= maxW && passthrough) { bmp.close?.(); return { blob: file, contentType: file.type }; }
  const scale = Math.min(1, maxW / bmp.width), w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(bmp, 0, 0, w, h); bmp.close?.();
  const blob = await new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error("resize failed")), "image/jpeg", quality));
  return { blob, contentType: "image/jpeg" };
}

const locks = new Set();
// a receipt-style upload: {basePath}/{year}/{slug}_{date}_{ms}.jpg; deletes priorPath first (replace = no orphan)
export async function uploadDated({ file, basePath, name, priorPath, dateMs }) {
  if (!file) throw new Error("no file"); if (!basePath) throw new Error("basePath required");
  const key = `${basePath}:${name}`; if (locks.has(key)) throw new Error("upload already in progress"); locks.add(key);
  try {
    const { blob, contentType } = await toJpeg(file);
    const ts = Date.now(), when = Number(dateMs) || ts, year = new Date(when).getUTCFullYear();
    const path = `${basePath.replace(/\/+$/, "")}/${year}/${slugify(name)}_${new Date(when).toISOString().slice(0, 10)}_${ts}.jpg`;
    if (priorPath) { try { await deleteObject(storageRef(storage, priorPath)); } catch (e) { console.warn("[images] prior delete", e?.code || e); } }
    const sref = storageRef(storage, path); await uploadBytes(sref, blob, { contentType }); const url = await getDownloadURL(sref);
    return { url, path };
  } finally { locks.delete(key); }
}

// a loose photo into a folder: {folder}/{slug}.jpg, never overwriting (slug_2, slug_3 ...)
export async function uploadToFolder({ file, folder, name }) {
  if (!file) throw new Error("no file"); if (!folder) throw new Error("folder required");
  const { blob, contentType } = await toJpeg(file);
  const base = slugify(name || file.name.replace(/\.[^.]+$/, "")).toLowerCase();
  let existing = []; try { existing = (await listAll(storageRef(storage, folder))).items.map(i => i.name); } catch (_) {}
  let final = `${base}.jpg`, n = 2; while (existing.includes(final)) final = `${base}_${n++}.jpg`;
  const path = `${folder.replace(/\/+$/, "")}/${final}`, sref = storageRef(storage, path);
  await uploadBytes(sref, blob, { contentType }); const url = await getDownloadURL(sref);
  return { url, path, name: final };
}

// LABELS - the apps' photo bar, one copy here (apps/assets/js/imgupload.js carries the same numbers): a strip max(40, w/22) px
// under the picture (black - JPEG has no alpha), white Arial at 70% of the strip shrunk until the text fits 92% of the width
// (min 12 px), baseline a quarter-strip up; unstamp crops that same strip back off, so stamp -> unstamp is a clean round trip.
// relabel() is the universal step (L 2026-10-04 "the options for labels should be present in anything selected"): fetch the
// file, stamp (text) or crop (no text), upload over the SAME path, hand back a fresh URL - the record pointing at it is the
// caller's business (jobs.labelJobPhoto for job photos, ledger.setRowImage for a receipt).
const loadImg = blob => new Promise((res, rej) => { const img = new Image(), u = URL.createObjectURL(blob); img.onload = () => { URL.revokeObjectURL(u); res(img); }; img.onerror = () => { URL.revokeObjectURL(u); rej(new Error("Invalid image")); }; img.src = u; });
const canvasJpeg = (c, what) => new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error(what + " failed")), "image/jpeg"));
export const stripHeight = w => Math.max(40, Math.round(w / 22));
export async function stampImg(blob, text) {
  const img = await loadImg(blob), strip = stripHeight(img.width); let font = Math.round(strip * 0.7);
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height + strip;
  const g = c.getContext("2d"); g.drawImage(img, 0, 0);
  g.fillStyle = "white"; g.textAlign = "center"; g.textBaseline = "alphabetic"; g.font = `${font}px Arial`;
  while (font > 12 && g.measureText(text).width > c.width * 0.92) { font -= 2; g.font = `${font}px Arial`; }
  g.fillText(text, c.width / 2, c.height - Math.round(strip * 0.25));
  return canvasJpeg(c, "Markup");
}
export async function unstampImg(blob) {
  const img = await loadImg(blob), strip = stripHeight(img.width);
  const c = document.createElement("canvas"); c.width = img.width; c.height = Math.max(1, img.height - strip);
  c.getContext("2d").drawImage(img, 0, 0);   // top-left aligned; the bottom strip falls off
  return canvasJpeg(c, "Crop");
}
export async function relabel({ url, path, text }) {
  if (!path) throw new Error("this photo has no storage path"); if (!url) throw new Error("this photo has no url");
  const res = await fetch(url, { cache: "reload", mode: "cors" }); if (!res.ok) throw new Error("fetch " + res.status);
  const blob = await res.blob(), out = text ? await stampImg(blob, text) : await unstampImg(blob);
  const sref = storageRef(storage, path); await uploadBytes(sref, out, { contentType: "image/jpeg" });
  const fresh = await getDownloadURL(sref); await forgetThumb({ path, url });
  return { url: fresh + (fresh.includes("?") ? "&" : "?") + "v=" + Date.now(), path };   // busted, the way onlinejob stores it
}

// THUMBNAILS (L 2026-10-04 "the photos tile is creating a lot of lag"): a job photo is a 2048 px JPEG and the grid shows up to
// 80 of them in 110 px cells - decoding 80 full-size pictures (~12 MB of pixels each) IS the lag, on a phone fatal. The grid
// gets a 256 px thumb instead: fetched once (the bucket allows GET from anywhere), downscaled inside the decoder
// (createImageBitmap resizeWidth), kept as a small JPEG in the Cache API ("lv-thumbs") so the next open is instant, four
// decodes in flight at a time. Any failure (CORS, an odd format) falls back to the full URL - the picture still shows, the old way.
const THUMBS = new Map(); let cacheP = null, busy = 0; const waiting = [];
const cacheOpen = () => cacheP ??= (typeof caches !== "undefined" ? caches.open("lv-thumbs-v1").catch(() => null) : Promise.resolve(null));
const slot = () => busy < 4 ? (busy++, Promise.resolve()) : new Promise(r => waiting.push(r)).then(() => { busy++; });
const free = () => { busy--; const next = waiting.shift(); if (next) next(); };
export function thumbOf(photo, w = 256) {
  const key = photo?.path || photo?.url; if (!key || !photo?.url) return Promise.resolve(photo?.url || "");
  const k = `${key}@${w}`; if (THUMBS.has(k)) return THUMBS.get(k);
  const p = (async () => {
    const cache = await cacheOpen(), ck = `https://thumbs.louverse.local/${encodeURIComponent(key)}?w=${w}`;
    let blob = null;
    if (cache) { try { const hit = await cache.match(ck); if (hit) blob = await hit.blob(); } catch (_) {} }
    if (!blob) {
      await slot();
      try {
        const res = await fetch(photo.url, { mode: "cors" }); if (!res.ok) throw new Error("fetch " + res.status);
        const full = await res.blob(); let bmp;
        try { bmp = await createImageBitmap(full, { resizeWidth: w, resizeQuality: "medium", imageOrientation: "from-image" }); }   // cheap path (Chrome)
        catch (_) { bmp = await createImageBitmap(full); }   // a browser that rejects the options (older Safari) decodes whole, the canvas below still shrinks it
        // the canvas is ALWAYS the thumb size - a browser that ignores resizeWidth must not hand back a full-size "thumb"
        const tw = Math.min(w, bmp.width) || w, th = Math.max(1, Math.round(bmp.height * tw / bmp.width)) || tw;
        const c = document.createElement("canvas"); c.width = tw; c.height = th; c.getContext("2d").drawImage(bmp, 0, 0, tw, th); bmp.close?.();
        blob = await new Promise((ok, no) => c.toBlob(b => b ? ok(b) : no(new Error("thumb failed")), "image/jpeg", 0.82));
        if (cache) cache.put(ck, new Response(blob, { headers: { "Content-Type": "image/jpeg" } })).catch(() => {});
      } finally { free(); }
    }
    return URL.createObjectURL(blob);
  })().catch(e => { console.warn("[images] thumb", e?.message || e); return photo.url; });
  THUMBS.set(k, p); return p;
}
// a photo that changed (replaced receipt) - forget its thumbs so the next draw makes new ones
export async function forgetThumb(photo) { const key = photo?.path || photo?.url; if (!key) return; for (const k of [...THUMBS.keys()]) if (k.startsWith(key + "@")) THUMBS.delete(k);
  const cache = await cacheOpen(); if (!cache) return; try { for (const r of await cache.keys()) if (r.url.includes(encodeURIComponent(key))) await cache.delete(r); } catch (_) {} }

// best effort - a missing file is not an error
export async function removeImage(path) { if (!path) return; try { await deleteObject(storageRef(storage, path)); } catch (e) { console.warn("[images] delete", e?.code || e); } }

// one file picker, resolved with the File (or null when cancelled)
export function pickImage({ capture = false } = {}) {
  return new Promise(resolve => {
    const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; if (capture) input.capture = "environment"; input.style.display = "none";
    document.body.appendChild(input);
    input.addEventListener("change", () => { const f = input.files?.[0] || null; input.remove(); resolve(f); }, { once: true });
    input.addEventListener("cancel", () => { input.remove(); resolve(null); }, { once: true });
    input.click();
  });
}
