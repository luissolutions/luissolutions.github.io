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
