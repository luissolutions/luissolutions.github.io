// core/layout.js - WHERE things are on the board: tiles in world pixels on one big canvas, plus the view (pan + zoom).
// L 2026-10-03: "remember in browser for now", "remove presets", "lots of real estate" - this browser only, no presets, a
// 6000 x 4000 world the view pans and zooms over. (A Firebase copy can come back later - same shape, one more save path.)
export const WORLD = { w: 6000, h: 4000 };
export const GRID = 20;   // tiles snap to this
const KEY = "lv_board_v3";
let current = null, saveTimer = 0;

const SIZES = { year: [220, 120], joblist: [420, 640], jobcard: [520, 460], details: [520, 680], entry: [520, 460], photoset: [520, 360], ledger: [640, 760], analytics: [560, 420], notes: [620, 520], page: [700, 520] };
const newId = () => "t" + Math.random().toString(36).slice(2, 8);
export const snap = v => Math.round(v / GRID) * GRID;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || lo));
const sane = l => {
  if (!l || !Array.isArray(l.tiles)) return null;
  const tiles = l.tiles.filter(t => t && t.type).map(t => ({ id: t.id || newId(), type: t.type, x: snap(clamp(t.x, -1e6, 1e6)), y: snap(clamp(t.y, -1e6, 1e6)),   // no edges (2026-10-04)
    w: snap(clamp(t.w, 220, 2400)), h: snap(clamp(t.h, 120, 2000)), collapsed: !!t.collapsed, held: !!t.held, ord: Number.isFinite(t.ord) ? t.ord : undefined, cfg: t.cfg || {} }));
  return { tiles, view: l.view && isFinite(l.view.s) ? { x: Number(l.view.x) || 0, y: Number(l.view.y) || 0, s: clamp(l.view.s, 0.2, 3) } : null, updatedAt: l.updatedAt || 0 };
};
// the first board: jobs on the left wired to the job + its photos, the year feeding the ledger and the analytics, notes below
export function defaultLayout() {
  const T = (type, x, y) => ({ id: newId(), type, x, y, w: SIZES[type][0], h: SIZES[type][1], collapsed: false, cfg: {} });
  return { tiles: [T("year", 40, 40), T("joblist", 40, 200), T("details", 540, 200), T("photoset", 540, 920), T("ledger", 1140, 40), T("analytics", 1140, 840), T("notes", 40, 880)], view: null, updatedAt: Date.now() };   // Details + Entry, not Visit (folded away 2026-10-04)
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
// HELD vs LIVE (L 2026-10-04 "once a 2nd Photos / Details tile is opened, the parent takes ownership of that one only - cycle
// only when there is a single one it can update"): opening another copy of a type HOLDS the copies already there (they keep
// what they show) and the new one is the LIVE copy that follows picks. One live copy per type; `setLive` moves it.
export function addTile(type, at, cfg = {}) {
  const [w, h] = SIZES[type] || [480, 360];
  const t = { id: newId(), type, x: snap(clamp(at?.x ?? 100, -1e6, 1e6)), y: snap(clamp(at?.y ?? 100, -1e6, 1e6)), w, h, collapsed: false, held: false, cfg };
  for (const o of current.tiles) if (o.type === type) o.held = true;
  current.tiles.push(t); saveLayout(); return t;
}
export function setLive(id) { const t = current.tiles.find(x => x.id === id); if (!t) return; for (const o of current.tiles) if (o.type === t.type) o.held = o.id !== id; saveLayout(); }
// a type always has EXACTLY one live copy: after a removal (none left live) or on an old layout (all live) the newest live
// copy keeps it and the rest hold
export function ensureLive(l = current) { const byType = new Map(); for (const t of l.tiles) { if (!byType.has(t.type)) byType.set(t.type, []); byType.get(t.type).push(t); }
  for (const list of byType.values()) { const newestFirst = list.slice().sort((a, b) => a.id < b.id ? 1 : -1); const live = newestFirst.find(t => !t.held) || newestFirst[0]; for (const t of list) t.held = t !== live; } }
// THE PHONE BOARD (L 2026-10-04 "the ledger is showing up too wide"): on a narrow screen every tile is as wide as the screen and
// they stack in one column in reading order (top-left first); heights capped so a tile never swallows the screen. Saved like any layout.
// + a GUTTER on the right (L 2026-10-04 "a space of background to the right so I have an area I can scroll down at that isn't in
// the tile, in case there's scrolling needed in the tile"): tiles stop ~50 px short of the right edge; that strip is the view, a
// finger there always scrolls the board even when the tile under it would scroll itself.
// + LANDSCAPE (L 2026-10-04 "set up a proper view also for landscape mode"): PHONE MODE is any touch device whose shorter side is
// <= 640 (either way round) or any window <= 640 wide; sideways, the column becomes TWO columns of the same standard width,
// filled shortest-first in the tiles' order (`ord`, the ▲▼ order), still native scroll, still the gutter. `?phone=1` forces it.
export const GUTTER = 50;
const FORCE_PHONE = typeof location !== "undefined" && /[?&]phone=1/.test(location.search);
export const NARROW = () => { const w = window.innerWidth || 1000, h = window.innerHeight || 800;
  return FORCE_PHONE || w <= 640 || (!!window.matchMedia && matchMedia("(pointer: coarse)").matches && Math.min(w, h) <= 640); };
export const COLS = (vw = window.innerWidth || 390) => vw > 640 ? 2 : 1;
export const byOrd = (a, b) => ((Number.isFinite(a.ord) ? a.ord : 1e9) - (Number.isFinite(b.ord) ? b.ord : 1e9)) || (a.y - b.y) || (a.x - b.x);
export function columnLayout(l = current, vw = window.innerWidth || 390) {
  const cols = COLS(vw), w = Math.max(220, Math.floor((vw - 20 - GUTTER - (cols - 1) * 20) / cols / GRID) * GRID), ys = Array(cols).fill(20);
  [...l.tiles].sort(byOrd).forEach((t, k) => { let c = 0; for (let i = 1; i < cols; i++) if (ys[i] < ys[c]) c = i;   // the shortest column takes the next tile
    t.ord = k; t.x = 20 + c * (w + 20); t.y = ys[c]; t.w = w; t.h = snap(t.h); ys[c] += (t.collapsed ? 40 : t.h) + 20; });   // heights are the person's (stretch up and down)
  saveLayout(l); return l;
}
export function removeTile(id) { current.tiles = current.tiles.filter(t => t.id !== id); saveLayout(); }
export function resetLayout() { current = defaultLayout(); try { localStorage.removeItem(KEY); } catch (_) {} return current; }
