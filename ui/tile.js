// ui/tile.js - the frame every TILE lives in, on the big canvas: header (title, the keys it sets / follows, collapse, remove),
// a body the tile's own view fills, drag by the header and resize by the corner, in WORLD pixels (the board's zoom is divided
// out), snapped to the grid. Shape only - a tile's logic never lives here.
import { GRID, snap, WORLD, NARROW } from "../core/layout.js";

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let zTop = 10;
export const HEAD_H = 40;
// COLOUR (L 2026-10-04 "each tile a different colour, multiples of a tile a different shade of the same colour"): one hue per
// tile TYPE (CSS --th), and the n-th open copy of a type gets --tn = n, which the CSS turns into a lighter shade of that hue.
export const HUES = { year: 42, joblist: 205, jobcard: 160, entry: 160, details: 268, photoset: 318, ledger: 95, invoice: 20, bookmarks: 185, contact: 140, analytics: 240, notes: 60, radar: 350, page: 300 };
export function tintTile(el, type, nth) { el.style.setProperty("--th", HUES[type] ?? 220); el.style.setProperty("--tn", nth || 0); }
export function placeTile(el, t) { el.style.left = t.x + "px"; el.style.top = t.y + "px"; el.style.width = t.w + "px"; el.style.height = (t.collapsed ? HEAD_H : t.h) + "px"; el.classList.toggle("collapsed", !!t.collapsed); }

// def = { title, mount(body, ctx) -> { destroy?, title? }, pub?, sub? }; spec = the layout entry; ctx.board = the canvas api
export function mountTile(worldEl, spec, def, ctx, handlers) {
  const el = document.createElement("section"); el.className = "lv-tile"; el.dataset.id = spec.id; el.dataset.type = spec.type;
  const title = spec.cfg?.title || def.title;
  el.innerHTML = `<div class="lv-thead"><span class="t">${esc(title)}</span><span class="keys">${(def.pub || []).map(k => `<i class="pub" title="this tile sets ${esc(k)}">${esc(k)} ▸</i>`).join("")}${(def.sub || []).map(k => `<i class="sub" title="this tile follows ${esc(k)}">▸ ${esc(k)}</i>`).join("")}</span><button type="button" class="nudge up" title="move up">▲</button><button type="button" class="nudge dn" title="move down">▼</button><span class="owns" title="the parent tile that drives this copy"></span><button type="button" class="col" title="collapse / expand">${spec.collapsed ? "▸" : "▾"}</button><button type="button" class="max" title="full screen - the whole app for what's picked (L 2026-10-04)">⤢</button><button type="button" class="rm" title="remove from the board">✕</button></div><div class="lv-body"></div><div class="lv-resize" title="drag to resize"></div>`;
  placeTile(el, spec); tintTile(el, spec.type, spec.nth); el.classList.toggle("held", !!spec.held); if ((spec.copies || 1) > 1) el.dataset.copies = spec.copies; worldEl.appendChild(el);
  const body = el.querySelector(".lv-body"), head = el.querySelector(".lv-thead"), tEl = el.querySelector(".t");
  let view = null;
  const api = { el, body, spec, setTitle: t => { tEl.textContent = t; }, remount, unmount: () => { try { view?.destroy?.(); } catch (_) {} view = null; body.innerHTML = ""; body.className = "lv-body"; } };
  function remount() { try { view?.destroy?.(); } catch (_) {} body.innerHTML = ""; body.className = "lv-body"; try { view = def.mount(body, { ...ctx, spec, tile: api }) || null; } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; } }
  remount();
  el.addEventListener("pointerdown", () => { el.style.zIndex = ++zTop; }, true);   // the one you touch comes to the front
  el.querySelector(".col").onclick = () => { spec.collapsed = !spec.collapsed; el.querySelector(".col").textContent = spec.collapsed ? "▸" : "▾"; placeTile(el, spec); handlers.onChange(spec); };
  el.querySelector(".rm").onclick = () => { try { view?.destroy?.(); } catch (_) {} el.remove(); handlers.onRemove(spec); };
  el.querySelector(".max").onclick = e => { e.stopPropagation(); handlers.onMax?.(spec, api); };
  // phone: the arrows move a tile up / down the column (L 2026-10-04 "move top to bottom via arrows instead of drag")
  el.querySelector(".nudge.up").onclick = e => { e.stopPropagation(); handlers.onNudge?.(spec, -1); };
  el.querySelector(".nudge.dn").onclick = e => { e.stopPropagation(); handlers.onNudge?.(spec, 1); };

  // drag (header) + resize (corner): screen deltas divided by the board's zoom, snapped to the grid, kept inside the world
  let drag = null, moveRaf = 0;
  const s = () => (ctx.board && ctx.board.view.s) || 1;
  const down = kind => e => { if (e.button) return; if (kind === "move" && e.target.closest("button")) return;
    if (kind === "move" && NARROW()) return;   // phone: no header drag - the arrows move a tile, a touch here scrolls the view
    e.preventDefault(); e.stopPropagation(); drag = { kind, x0: e.clientX, y0: e.clientY, s0: { ...spec }, scale: s() }; el.classList.add("dragging"); try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {} };
  const move = e => { if (!drag) return;
    // a single event that jumps > 300 screen px is a touch glitch, not a finger (L 2026-10-06 iPad: tiles flung far away) - skip it
    if (drag.lx != null && Math.hypot(e.clientX - drag.lx, e.clientY - drag.ly) > 300) return; drag.lx = e.clientX; drag.ly = e.clientY;
    const dx = (e.clientX - drag.x0) / drag.scale, dy = (e.clientY - drag.y0) / drag.scale;
    if (drag.kind === "move") { spec.x = snap(drag.s0.x + dx); spec.y = snap(drag.s0.y + dy); }   // anywhere - the board has no edges (2026-10-04)
    else { if (!NARROW()) spec.w = snap(Math.max(220, drag.s0.w + dx)); spec.h = snap(Math.max(120, drag.s0.h + dy)); }   // phone: height only ("stretch up and down")
    placeTile(el, spec); if (!moveRaf) moveRaf = requestAnimationFrame(() => { moveRaf = 0; handlers.onMove?.(spec); }); };   // the wires redraw once per frame, not per pointer event (iPad tearing, L 2026-10-04)
  const up = () => { if (!drag) return; const was = drag; drag = null; el.classList.remove("dragging"); if (was.s0.x !== spec.x || was.s0.y !== spec.y || was.s0.w !== spec.w || was.s0.h !== spec.h) handlers.onChange(spec, true); };
  head.addEventListener("pointerdown", down("move")); el.querySelector(".lv-resize").addEventListener("pointerdown", down("size"));
  for (const t of [head, el.querySelector(".lv-resize")]) { t.addEventListener("pointermove", move); t.addEventListener("pointerup", up); t.addEventListener("pointercancel", up); }
  // a touch inside the body must not pan the board (the board pans only from empty space), but it may scroll the body
  body.addEventListener("pointerdown", e => { if (!NARROW()) e.stopPropagation(); });   // phone: nothing to stop - the view scrolls natively
  return api;
}
