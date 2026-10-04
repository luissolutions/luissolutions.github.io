// core/layout.js - WHERE things are on the board: tiles in world pixels on one big canvas, plus the view (pan + zoom).
// L 2026-10-03: "remember in browser for now", "remove presets", "lots of real estate" - this browser only, no presets, a
// 6000 x 4000 world the view pans and zooms over. (A Firebase copy can come back later - same shape, one more save path.)
export const WORLD = { w: 6000, h: 4000 };
export const GRID = 20;   // tiles snap to this
const KEY = "lv_board_v3";
let current = null, saveTimer = 0;

const SIZES = { year: [220, 120], joblist: [420, 640], jobcard: [520, 460], photoset: [520, 360], ledger: [640, 760], analytics: [560, 420], notes: [620, 520], page: [700, 520] };
const newId = () => "t" + Math.random().toString(36).slice(2, 8);
export const snap = v => Math.round(v / GRID) * GRID;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || lo));
const sane = l => {
  if (!l || !Array.isArray(l.tiles)) return null;
  const tiles = l.tiles.filter(t => t && t.type).map(t => ({ id: t.id || newId(), type: t.type, x: snap(clamp(t.x, 0, WORLD.w - 200)), y: snap(clamp(t.y, 0, WORLD.h - 120)),
    w: snap(clamp(t.w, 220, 2400)), h: snap(clamp(t.h, 120, 2000)), collapsed: !!t.collapsed, cfg: t.cfg || {} }));
  return { tiles, view: l.view && isFinite(l.view.s) ? { x: Number(l.view.x) || 0, y: Number(l.view.y) || 0, s: clamp(l.view.s, 0.2, 3) } : null, updatedAt: l.updatedAt || 0 };
};
// the first board: jobs on the left wired to the job + its photos, the year feeding the ledger and the analytics, notes below
export function defaultLayout() {
  const T = (type, x, y) => ({ id: newId(), type, x, y, w: SIZES[type][0], h: SIZES[type][1], collapsed: false, cfg: {} });
  return { tiles: [T("year", 40, 40), T("joblist", 40, 200), T("jobcard", 540, 200), T("photoset", 540, 700), T("ledger", 1140, 40), T("analytics", 1140, 840), T("notes", 40, 880)], view: null, updatedAt: Date.now() };
}
export function loadLayout() {
  try { current = sane(JSON.parse(localStorage.getItem(KEY) || "null")); } catch (_) { current = null; }
  if (!current || !current.tiles.length) current = defaultLayout();
  return current;
}
export const getLayout = () => current;
export function saveLayout(l = current) {
  current = l; current.updatedAt = Date.now(); clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(current)); } catch (_) {} }, 300);
}
export function addTile(type, at, cfg = {}) {
  const [w, h] = SIZES[type] || [480, 360];
  const t = { id: newId(), type, x: snap(clamp(at?.x ?? 100, 0, WORLD.w - w)), y: snap(clamp(at?.y ?? 100, 0, WORLD.h - h)), w, h, collapsed: false, cfg };
  current.tiles.push(t); saveLayout(); return t;
}
// THE PHONE BOARD (L 2026-10-04 "the ledger is showing up too wide"): on a narrow screen every tile is as wide as the screen and
// they stack in one column in reading order (top-left first); heights capped so a tile never swallows the screen. Saved like any layout.
export const NARROW = () => (window.innerWidth || 1000) <= 640;
export function columnLayout(l = current, vw = window.innerWidth || 390) {
  const w = snap(Math.max(220, vw - 24)); let y = 20;
  for (const t of [...l.tiles].sort((a, b) => (a.y - b.y) || (a.x - b.x))) { t.x = 20; t.y = y; t.w = w; t.h = snap(Math.min(t.h, 560)); y += (t.collapsed ? 40 : t.h) + 20; }
  saveLayout(l); return l;
}
export function removeTile(id) { current.tiles = current.tiles.filter(t => t.id !== id); saveLayout(); }
export function resetLayout() { current = defaultLayout(); try { localStorage.removeItem(KEY); } catch (_) {} return current; }
