// core/jobs.js - the JOBS domain, no HTML in here. The record shape is onlinejob's ({base}/tasks/{id}): customerName,
// customerAddress, project, workOrder, startTime/endTime (ISO, UTC), segments [{startTime, endTime, type}], status, notes,
// startOdometer/endOdometer, lists (device lists with photos), tasks (daily entries with photos), sensorCount ...
// Photos live under ONE storage root {base}/tasks/images/<project folder>/... (see reference_onlinejob_images).
import { database, storage, ref, get, update, storageRef, listAll, getDownloadURL, readOnce } from "./firebase.js";

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
  const allowed = ["customerName", "customerAddress", "customerPhone", "project", "workOrder", "status", "notes"], body = {};
  for (const k of allowed) if (k in patch) body[k] = patch[k];
  if (!Object.keys(body).length) return null;
  body.updatedAt = Date.now(); await update(ref(database, taskPath(base, id)), body); return loadJob(base, id);
}

// every photo a job has, from its three homes: the storage folder (loose + subfolders, one level), device-list rows, daily rows
export async function listJobPhotos(base, job, { max = 80 } = {}) {
  const out = [], seen = new Set(), push = (p) => { const k = p.path || p.url; if (!k || seen.has(k)) return; seen.add(k); out.push(p); };
  const raw = job?.raw || job || {};
  for (const list of Object.values(raw.lists || {})) for (const row of Object.values(list || {})) for (const im of (Array.isArray(row?.images) ? row.images : Object.values(row?.images || {}))) if (im?.url) push({ name: (im.path || im.url).split("/").pop().split("?")[0], url: im.url, path: im.path || "", src: "device" });
  for (const [date, day] of Object.entries(raw.tasks || {})) for (const im of (Array.isArray(day?.images) ? day.images : Object.values(day?.images || {}))) if (im?.url) push({ name: (im.path || im.url).split("/").pop().split("?")[0], url: im.url, path: im.path || "", src: "daily " + date });
  const folder = projectFolder(raw);
  if (folder) {
    try {
      const root = await listAll(storageRef(storage, `${base}/tasks/images/${folder}`));
      const items = [...root.items.map(i => ({ ref: i, src: "images" }))];
      for (const p of root.prefixes.slice(0, 12)) { try { const sub = await listAll(p); items.push(...sub.items.map(i => ({ ref: i, src: p.name }))); } catch (_) {} }
      for (const it of items) { if (out.length >= max) break; if (seen.has(it.ref.fullPath)) continue; if (!/\.(jpe?g|png|webp|gif|heic|bmp)$/i.test(it.ref.name)) continue;   // photos only (.keep / .init.txt markers live in the same folders)
        push({ name: it.ref.name, path: it.ref.fullPath, src: it.src, url: null, ref: it.ref }); }
    } catch (e) { console.warn("[jobs] photo folder", e?.code || e); }
  }
  const slice = out.slice(0, max);
  await Promise.all(slice.map(async p => { if (!p.url && p.ref) { try { p.url = await getDownloadURL(p.ref); } catch (_) { p.url = ""; } } }));
  return slice.filter(p => p.url);
}

export const fmtDate = t => t ? new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "";
export const fmtTime = t => t ? new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "";
export const fmtHours = h => (Math.round(h * 100) / 100).toFixed(2) + " h";
