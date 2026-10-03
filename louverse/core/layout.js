// core/layout.js - WHERE things are and WHAT is visible: the one layout store (L 2026-10-03: "one shell shows what you want
// on the screen"). Signed in -> {uid}/workspace/layout in Firebase (same on every device); signed out -> this browser only.
// A layout = { cols, blocks: [{ id, type, x, y, w, h, collapsed, cfg }], updatedAt }  (x/y/w/h in grid cells, 12 across)
import { database, ref, get, set } from "./firebase.js";

export const COLS = 12;
const LOCAL_KEY = "lv_layout_v1";
let uid = null, current = null, saveTimer = 0;

export const PRESETS = {
  Field: [{ type: "joblist", x: 1, y: 1, w: 4, h: 12 }, { type: "jobcard", x: 5, y: 1, w: 4, h: 7 }, { type: "photoset", x: 9, y: 1, w: 4, h: 7 }, { type: "ledger", x: 5, y: 8, w: 8, h: 6 }],
  Finance: [{ type: "ledger", x: 1, y: 1, w: 8, h: 12 }, { type: "joblist", x: 9, y: 1, w: 4, h: 12 }],
  Jobs: [{ type: "joblist", x: 1, y: 1, w: 5, h: 12 }, { type: "jobcard", x: 6, y: 1, w: 7, h: 6 }, { type: "photoset", x: 6, y: 7, w: 7, h: 6 }]
};

const newId = () => "b" + Math.random().toString(36).slice(2, 8);
export const fromPreset = name => ({ cols: COLS, blocks: (PRESETS[name] || PRESETS.Field).map(b => ({ id: newId(), collapsed: false, cfg: {}, ...b })), updatedAt: Date.now() });
const sane = l => l && Array.isArray(l.blocks) && l.blocks.length ? { cols: COLS, updatedAt: l.updatedAt || 0, blocks: l.blocks.filter(b => b && b.type).map(b => ({ id: b.id || newId(), type: b.type, x: clamp(b.x, 1, COLS), y: Math.max(1, b.y | 0), w: clamp(b.w, 2, COLS), h: Math.max(2, b.h | 0), collapsed: !!b.collapsed, cfg: b.cfg || {} })) } : null;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || lo));

function readLocal() { try { return sane(JSON.parse(localStorage.getItem(LOCAL_KEY) || "null")); } catch (_) { return null; } }
function writeLocal(l) { try { localStorage.setItem(LOCAL_KEY, JSON.stringify(l)); } catch (_) {} }

// load for this user: Firebase first (signed in), the local copy as the fallback, a preset when there is nothing yet
export async function loadLayout(user) {
  uid = user?.uid || null;
  let l = null;
  if (uid) { try { const s = await get(ref(database, `${uid}/workspace/layout`)); l = sane(s.exists() ? s.val() : null); } catch (e) { console.warn("[layout] read failed", e); } }
  current = l || readLocal() || fromPreset("Field");
  return current;
}
export const getLayout = () => current;
export function saveLayout(l, { now = false } = {}) {
  current = l; current.updatedAt = Date.now(); writeLocal(current);
  if (!uid) return;
  clearTimeout(saveTimer);
  const go = () => set(ref(database, `${uid}/workspace/layout`), current).catch(e => console.warn("[layout] save failed", e));
  if (now) go(); else saveTimer = setTimeout(go, 600);   // drags save once they settle
}
export function addBlock(type, cfg = {}) {
  const l = current, h = type === "joblist" || type === "ledger" ? 10 : 7, w = 4;
  const y = l.blocks.reduce((m, b) => Math.max(m, b.y + b.h), 1);   // below everything
  const b = { id: newId(), type, x: 1, y, w, h, collapsed: false, cfg }; l.blocks.push(b); saveLayout(l); return b;
}
export function removeBlock(id) { current.blocks = current.blocks.filter(b => b.id !== id); saveLayout(current); }
