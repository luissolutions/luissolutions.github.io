// core/jobs.js - the JOBS domain, no HTML in here. The record shape is onlinejob's ({base}/tasks/{id}): customerName,
// customerAddress, project, workOrder, startTime/endTime (ISO, UTC), segments [{startTime, endTime, type}], status, notes,
// startOdometer/endOdometer, lists (device lists with photos), tasks (daily entries with photos), sensorCount ...
// Photos live under ONE storage root {base}/tasks/images/<project folder>/... (see reference_onlinejob_images).
import { database, storage, ref, get, set, update, storageRef, listAll, getDownloadURL, readOnce } from "./firebase.js";
import { uploadToFolder, removeImage, relabel } from "./images.js";

export const tasksPath = base => `${base}/tasks`;
export const taskPath = (base, id) => `${base}/tasks/${id}`;
// onlinejob's folder rule (sanitize): trim + spaces -> _ ; the Telaid tools strip punctuation too, which matches for PRJTASK names
export const projectFolder = job => String(job?.project || job?.customerName || "").trim().replace(/\s+/g, "_");

const ms = t => { if (!t) return 0; const n = typeof t === "number" ? t : Date.parse(t); return Number.isFinite(n) ? n : 0; };
export const hoursBetween = (a, b) => { const d = ms(b) - ms(a); return d > 0 ? d / 36e5 : 0; };

// hours = the segments (they own WHEN); a record with no segments falls back to start -> end
export function hoursOf(job) {
  const segs = Array.isArray(job?.segments) ? job.segments : Object.values(job?.segments || {});
  const work = segs.filter(s => s && s.startTime && s.endTime);
  const h = work.length ? work.reduce((t, s) => t + hoursBetween(s.startTime, s.endTime), 0) : hoursBetween(job?.startTime, job?.endTime);
  return Math.round(h * 100) / 100;
}
export const travelHoursOf = job => Math.round((Array.isArray(job?.segments) ? job.segments : []).filter(s => s?.type === "travel" && s.startTime && s.endTime).reduce((t, s) => t + hoursBetween(s.startTime, s.endTime), 0) * 100) / 100;
export const startOf = job => ms(job?.startTime) || Number(job?.id) || 0;

export function summarize(id, job) {
  return { id: String(id), customer: job?.customerName || job?.customer || "(no customer)", project: job?.project || "", wo: job?.workOrder || "",
    start: startOf(job), end: ms(job?.endTime), hours: hoursOf(job), travel: travelHoursOf(job), status: job?.status || (job?.endTime ? "done" : "open"),
    address: job?.customerAddress || "", notes: typeof job?.notes === "string" ? job.notes : "", raw: job };
}

export async function loadJobs(base) {
  const all = (await readOnce(tasksPath(base))) || {};
  return Object.entries(all).filter(([, v]) => v && typeof v === "object").map(([id, v]) => summarize(id, v)).sort((a, b) => b.start - a.start);
}
export async function loadJob(base, id) { const v = await readOnce(taskPath(base, id)); return v ? summarize(id, v) : null; }
// write back (the Job tile edits in place): only the fields given change; onlinejob's own keys, so the app sees the edit too
export async function saveJob(base, id, patch) {
  // + startTime / endTime / segments (2026-10-04, L "a way to edit the times on the Details tile") - ISO UTC strings, the way onlinejob writes them; segments own WHEN
  const allowed = ["customerName", "customerAddress", "customerPhone", "customerEmail", "project", "workOrder", "status", "notes", "startTime", "endTime", "segments"], body = {};
  for (const k of allowed) if (k in patch) body[k] = patch[k];
  if (!Object.keys(body).length) return null;
  body.updatedAt = Date.now(); await update(ref(database, taskPath(base, id)), body); return loadJob(base, id);
}

// every photo a job has, from its three homes: the storage folder (loose + subfolders, one level), device-list rows, daily rows.
// Folder photos come back with `ref` and NO url - photoUrl(p) resolves one on demand (a tile shows ~120 at a time; 400 download
// URL calls up front was the old cap of 80, which cut Walmart 54's sensors folder short - L 2026-10-04).
export async function listJobPhotos(base, job, { max = 400 } = {}) {
  const out = [], seen = new Set(), push = (p) => { const k = p.path || p.url; if (!k || seen.has(k)) return; seen.add(k); out.push(p); };
  const raw = job?.raw || job || {};
  // every photo says WHERE it lives (where.kind = device | daily | folder) so the tile can delete it or note it the way onlinejob does
  for (const [listId, list] of Object.entries(raw.lists || {})) for (const [rowId, row] of Object.entries(list || {})) { if (DEVICE_RESERVED.has(rowId) || !row || typeof row !== "object") continue;
    imgsOf(row).forEach((im, index) => { if (im?.url) push({ name: nameOf(im), url: im.url, path: im.path || "", note: im.note || "", markup: im.markup || "", src: "device", where: { kind: "device", listId, rowId, index } }); }); }
  for (const [date, day] of Object.entries(raw.tasks || {})) imgsOf(day).forEach((im, index) => { if (im?.url) push({ name: nameOf(im), url: im.url, path: im.path || "", note: im.note || "", markup: im.markup || "", src: "daily " + date, where: { kind: "daily", date, index } }); });
  const folder = projectFolder(raw);
  if (folder) {
    try {
      const root = await listAll(storageRef(storage, `${base}/tasks/images/${folder}`));
      const items = [...root.items.map(i => ({ ref: i, src: "images" }))];
      for (const p of root.prefixes.slice(0, 24)) { try { const sub = await listAll(p); items.push(...sub.items.map(i => ({ ref: i, src: p.name }))); } catch (_) {} }
      for (const it of items) { if (out.length >= max) break; if (seen.has(it.ref.fullPath)) continue; if (!/\.(jpe?g|png|webp|gif|heic|bmp)$/i.test(it.ref.name)) continue;   // photos only (.keep / .init.txt markers live in the same folders)
        push({ name: it.ref.name, path: it.ref.fullPath, src: it.src, url: null, ref: it.ref, where: { kind: "folder" } }); }
    } catch (e) { console.warn("[jobs] photo folder", e?.code || e); }
  }
  return out.slice(0, max);
}
export async function photoUrl(p) { if (p.url) return p.url; if (!p.ref) return ""; try { p.url = await getDownloadURL(p.ref); } catch (_) { p.url = ""; } return p.url; }
// a sensor's photos are named <customer>_<num>-<serial>[_n].jpg in the project's sensors folder (onlinedetails / radar-tools);
// a device-list row's photos sit on the row itself. photoMatches(p, pick) = does this photo belong to the tapped row?
export function photoMatches(p, pick) {
  if (!pick) return true;
  if (pick.kind === "device") return p.where?.kind === "device" && p.where.listId === pick.listId && p.where.rowId === pick.rowId;
  if (pick.kind === "sensor") { if (pick.rowId && p.where?.kind === "device" && p.where.listId === pick.listId && p.where.rowId === pick.rowId) return true;   // a photo on the Sensors-list row itself
    const m = String(p.name || "").replace(/\.[^.]+$/, "").match(/_(\d+)-([A-Za-z0-9]+?)(?:_\d+)?$/); if (!m) return false;
    return (pick.serial && m[2].toLowerCase() === String(pick.serial).toLowerCase()) || (pick.num != null && Number(m[1]) === Number(pick.num)); }
  return true;
}

const DEVICE_RESERVED = new Set(["_name", "createdAt", "meta", "items"]), imgsOf = r => Array.isArray(r?.images) ? r.images : Object.values(r?.images || {}), nameOf = im => (im.path || im.url).split("/").pop().split("?")[0];
const imagesPathOf = (base, job, where) => where?.kind === "device" ? `${taskPath(base, job.id)}/lists/${where.listId}/${where.rowId}/images` : where?.kind === "daily" ? `${taskPath(base, job.id)}/tasks/${where.date}/images` : null;
const sameImg = (im, photo) => !!im && ((photo.path && im.path === photo.path) || im.url === photo.url);
// a loose photo into the job's storage folder (onlinejob's Images section): {base}/tasks/images/<folder>/<slug>.jpg
export async function addJobPhoto(base, job, file, name) {
  const folder = projectFolder(job?.raw || job); if (!folder) throw new Error("this job has no project folder yet");
  const r = await uploadToFolder({ file, folder: `${base}/tasks/images/${folder}`, name }); return { name: r.name, url: r.url, path: r.path, src: "images", where: { kind: "folder" } };
}
// delete = out of the record it lives in (device row / daily row) + the file; a folder photo is just the file
export async function deleteJobPhoto(base, job, photo) {
  const p = imagesPathOf(base, job, photo.where);
  if (p) { const next = imgsOf({ images: await readOnce(p) }).filter(im => !sameImg(im, photo)); await set(ref(database, p), next); }
  await removeImage(photo.path);
}
// LABELS (universal, 2026-10-04): the bar onlinejob stamps - its text rule (customer - list - device id) as the default, the
// record's `markup` keeps the text on device / daily rows; a folder photo is the file alone. text "" = crop the bar back off.
export function autoLabel(job, photo) { const raw = job?.raw || job || {}, cust = raw.customerName || "", w = photo?.where || {};
  if (w.kind === "device") { const list = raw.lists?.[w.listId] || {}, d = list[w.rowId] || {}; return [cust, list._name || "", d.id || d.label || ""].filter(Boolean).join(" - "); }
  if (w.kind === "daily") return [cust, w.date].filter(Boolean).join(" - ");
  return [cust, raw.project || ""].filter(Boolean).join(" - "); }
export async function labelJobPhoto(base, job, photo, text) {
  const { url } = await relabel({ url: photo.url, path: photo.path, text });
  const p = imagesPathOf(base, job, photo.where);
  if (p) { const next = imgsOf({ images: await readOnce(p) }).map(im => sameImg(im, photo) ? { ...im, url, markup: text || "" } : im); await set(ref(database, p), next); }
  return { ...photo, url, markup: text || "" };
}
export async function setJobPhotoNote(base, job, photo, note) {
  const p = imagesPathOf(base, job, photo.where); if (!p) throw new Error("only device and daily photos carry a note");
  const next = imgsOf({ images: await readOnce(p) }).map(im => sameImg(im, photo) ? { ...im, note } : im); await set(ref(database, p), next);
}

// THE INVOICE RING (2026-10-04): a visit record IS the invoice (onlineinvoice writes invoiceSaved / labor[] / parts[] / total /
// paid / paymentTxId onto tasks/<id>). A ledger row connects to a visit two ways: it is the PAYMENT the invoice created
// (paymentTxId === row id) or it is a PART one of the lines used (sku, else name - parts are matched by name, not id).
const low = s => String(s || "").trim().toLowerCase();
export const invoiceOf = job => { const r = job?.raw || job || {}; return r.invoiceSaved || r.total != null ? { type: r.invoiceType || "invoice", date: r.invoiceDate || "", labor: Array.isArray(r.labor) ? r.labor : [], parts: Array.isArray(r.parts) ? r.parts : [],
  subtotal: r.subtotal, tax: r.tax, total: r.total, paid: !!r.paid, amountPaid: r.amountPaid, paidDate: r.paidDate || "", paymentTxId: r.paymentTxId || "", paymentTxYear: r.paymentTxYear || "", title: r.invoiceTitle || "" } : null; };
export async function invoicesFor(base, tx) {
  const jobs = await loadJobs(base), out = [];
  for (const j of jobs) { const inv = invoiceOf(j); if (!inv) continue;
    if (inv.paymentTxId && inv.paymentTxId === tx.id) { out.push({ job: j, inv, how: "payment" }); continue; }
    const hit = inv.parts.find(p => (tx.sku && p.sku && low(p.sku) === low(tx.sku)) || (tx.name && low(p.part) === low(tx.name)));
    if (hit) out.push({ job: j, inv, how: "part", line: hit }); }
  return out;
}
export async function visitsOfCustomer(base, name, exceptId, jobs) { const n = low(name); if (!n) return []; return (jobs || await loadJobs(base)).filter(j => low(j.customer) === n && j.id !== exceptId); }
// the device lists on a visit (onlinejob): lists/<listId>/{_name, createdAt, <rowId>: {id, serial, model, type, location, status, ip, mac, notes, counted, images}}
const isSensorsList = list => String(list?._name || "").trim().toLowerCase() === "sensors";
// the SENSORS LIST (2026-10-04, L "direct device data to the current lists"): sensorMeta was copied into a device list named
// "Sensors" on each radar project's meta-owner (row = {id: mark, mark, serial, m1-m3, notes, images, counted, labeledAt?,
// runDoneAt?, pos?}). deviceLists() leaves it out; sensorRows() reads it first and falls back to sensorMeta for a job
// that has no such list. sensorMeta itself is untouched - the SES radar apps keep reading it.
export function sensorsListOf(job) { const raw = job?.raw || job || {}; for (const [listId, list] of Object.entries(raw.lists || {})) if (list && typeof list === "object" && isSensorsList(list)) return { listId, list }; return null; }
export function deviceLists(job) { const raw = job?.raw || job || {}, out = [];
  for (const [listId, list] of Object.entries(raw.lists || {})) { if (!list || typeof list !== "object" || isSensorsList(list)) continue;
    const rows = Object.entries(list).filter(([k, v]) => !DEVICE_RESERVED.has(k) && v && typeof v === "object").map(([rowId, d]) => ({ rowId, id: d.id || d.label || "", serial: d.serial || "", model: d.model || "", type: d.type || "", location: d.location || "", ip: d.ip || "", mac: d.mac || "", notes: typeof d.notes === "string" ? d.notes : "", status: d.status || "", counted: !!d.counted, photos: imgsOf(d).filter(i => i && i.url).length }));
    out.push({ listId, name: list._name || listId, rows }); }
  return out;
}

// THE META-OWNER (onlinejob / onlinedetails, 2026-10-04): a project's device lists and device data hang off ONE task - the apps
// resolve it as the first task (bestTime = max of updatedAt / createdAt / startTime / id, ascending) that shares the project AND
// the customer name - so night 6 of a radar job carries none of its own (L: "onlinedetails shows details, the louverse says no
// device lists"). Mirror the apps; when their owner is empty but a sibling holds data, show the sibling.
const normKey = s => String(s || "").trim().toLowerCase();
const bestTime = (t, id) => Math.max(Number(t?.updatedAt) || 0, Number(t?.createdAt) || 0, Number(t?.startTime) || 0, Number(t?.timestamp) || 0, Number(id) || 0);
const hasMeta = j => { const r = j?.raw || j || {}; return !!(r.lists || r.sensorMeta); };
export async function metaOwnerOf(base, job, jobs) {   // jobs = a loadJobs() result the caller already holds (one read, not two)
  const raw = job?.raw || job || {}, pk = normKey(raw.project), ck = normKey(raw.customerName);
  if (!pk && !ck) return job;
  const sibs = (jobs || await loadJobs(base)).filter(j => normKey(j.raw.project) === pk && normKey(j.raw.customerName) === ck).sort((a, b) => bestTime(a.raw, a.id) - bestTime(b.raw, b.id));
  if (!sibs.length) return job;
  return hasMeta(sibs[0]) ? sibs[0] : sibs.find(hasMeta) || sibs[0];
}
// onlinedetails's device data: sensorMeta[<device #>] = {serial, m1, m2, m3 ("Optional Info 1-3" - the radar X / Y / Z), updatedAt,
// labeledAt?, runDoneAt?, pos {x, y}? (placed on the site map)} - a list keyed by device number, 1-based (index 0 is empty)
export function sensorRows(job) {
  const sl = sensorsListOf(job);
  if (sl) return Object.entries(sl.list).filter(([k, v]) => !DEVICE_RESERVED.has(k) && v && typeof v === "object")
    .map(([rowId, v]) => ({ num: String(v.mark ?? v.id ?? v.label ?? ""), serial: v.serial || "", m1: v.m1 || "", m2: v.m2 || "", m3: v.m3 || "", labeled: !!v.labeledAt, run: !!v.runDoneAt, placed: !!(v.pos && v.pos.x != null), updatedAt: Number(v.updatedAt) || 0, listId: sl.listId, rowId, notes: typeof v.notes === "string" ? v.notes : "", photos: imgsOf(v).length, counted: !!v.counted }))
    .sort((a, b) => Number(a.num) - Number(b.num));
  const sm = (job?.raw || job || {}).sensorMeta; if (!sm || typeof sm !== "object") return [];
  const ents = Array.isArray(sm) ? sm.map((v, i) => [i, v]) : Object.entries(sm);
  return ents.filter(([, v]) => v && typeof v === "object").map(([n, v]) => ({ num: String(n), serial: v.serial || "", m1: v.m1 || "", m2: v.m2 || "", m3: v.m3 || "", labeled: !!v.labeledAt, run: !!v.runDoneAt, placed: !!(v.pos && v.pos.x != null), updatedAt: Number(v.updatedAt) || 0 }))
    .sort((a, b) => Number(a.num) - Number(b.num));
}

export const fmtDate = t => t ? new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
export const fmtTime = t => t ? new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "";
export const fmtHours = h => (Math.round(h * 100) / 100).toFixed(2) + " h";
