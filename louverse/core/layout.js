// core/layout.js - WHERE things are on the board: blocks in world pixels on one big canvas, plus the view (pan + zoom).
// L 2026-10-03: "remember in browser for now", "remove presets", "lots of real estate" - this browser only, no presets, a
// 6000 x 4000 world the view pans and zooms over. (A Firebase copy can come back later - same shape, one more save path.)
export const WORLD = { w: 6000, h: 4000 };
export const GRID = 20;   // blocks snap to this
const KEY = "lv_board_v2";
let current = null, saveTimer = 0;

const newId = () => "b" + Math.random().toString(36).slice(2, 8);
export const snap = v => Math.round(v / GRID) * GRID;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || lo));
const sane = l => {
  if (!l || !Array.isArray(l.blocks)) return null;
  const blocks = l.blocks.filter(b => b && b.type).map(b => ({ id: b.id || newId(), type: b.type, x: snap(clamp(b.x, 0, WORLD.w - 200)), y: snap(clamp(b.y, 0, WORLD.h - 120)),
    w: snap(clamp(b.w, 220, 2400)), h: snap(clamp(b.h, 120, 2000)), collapsed: !!b.collapsed, cfg: b.cfg || {} }));
  return { blocks, view: l.view && isFinite(l.view.s) ? { x: Number(l.view.x) || 0, y: Number(l.view.y) || 0, s: clamp(l.view.s, 0.2, 3) } : null, updatedAt: l.updatedAt || 0 };
};
// the first board: the four blocks side by side with the year feeding the ledger - everything else is L's to arrange
export function defaultLayout() {
  return { blocks: [
    { id: newId(), type: "year", x: 40, y: 40, w: 220, h: 120, collapsed: false, cfg: {} },
    { id: newId(), type: "joblist", x: 40, y: 200, w: 420, h: 640, collapsed: false, cfg: {} },
    { id: newId(), type: "jobcard", x: 540, y: 200, w: 520, h: 360, collapsed: false, cfg: {} },
    { id: newId(), type: "photoset", x: 540, y: 600, w: 520, h: 360, collapsed: false, cfg: {} },
    { id: newId(), type: "ledger", x: 1140, y: 40, w: 640, h: 760, collapsed: false, cfg: {} } ], view: null, updatedAt: Date.now() };
}
export function loadLayout() {
  try { current = sane(JSON.parse(localStorage.getItem(KEY) || "null")); } catch (_) { current = null; }
  if (!current || !current.blocks.length) current = defaultLayout();
  return current;
}
export const getLayout = () => current;
export function saveLayout(l = current) {
  current = l; current.updatedAt = Date.now(); clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(current)); } catch (_) {} }, 300);
}
export function addBlock(type, at, cfg = {}) {
  const sizes = { year: [220, 120], joblist: [420, 640], jobcard: [520, 360], photoset: [520, 360], ledger: [640, 760], page: [700, 520] };
  const [w, h] = sizes[type] || [480, 360];
  const b = { id: newId(), type, x: snap(clamp(at?.x ?? 100, 0, WORLD.w - w)), y: snap(clamp(at?.y ?? 100, 0, WORLD.h - h)), w, h, collapsed: false, cfg };
  current.blocks.push(b); saveLayout(); return b;
}
export function removeBlock(id) { current.blocks = current.blocks.filter(b => b.id !== id); saveLayout(); }
export function resetLayout() { current = defaultLayout(); try { localStorage.removeItem(KEY); } catch (_) {} return current; }
