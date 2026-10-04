// ui/tile.js - the frame every TILE lives in, on the big canvas: header (title, the keys it sets / follows, collapse, remove),
// a body the tile's own view fills, drag by the header and resize by the corner, in WORLD pixels (the board's zoom is divided
// out), snapped to the grid. Shape only - a tile's logic never lives here.
import { GRID, snap, WORLD, NARROW } from "../core/layout.js";

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let zTop = 10;
export const HEAD_H = 40;
export function placeTile(el, t) { el.style.left = t.x + "px"; el.style.top = t.y + "px"; el.style.width = t.w + "px"; el.style.height = (t.collapsed ? HEAD_H : t.h) + "px"; el.classList.toggle("collapsed", !!t.collapsed); }

// def = { title, mount(body, ctx) -> { destroy?, title? }, pub?, sub? }; spec = the layout entry; ctx.board = the canvas api
export function mountTile(worldEl, spec, def, ctx, handlers) {
  const el = document.createElement("section"); el.className = "lv-tile"; el.dataset.id = spec.id; el.dataset.type = spec.type;
  const title = spec.cfg?.title || def.title;
  el.innerHTML = `<div class="lv-thead"><span class="t">${esc(title)}</span><span class="keys">${(def.pub || []).map(k => `<i class="pub" title="this tile sets ${esc(k)}">${esc(k)} ▸</i>`).join("")}${(def.sub || []).map(k => `<i class="sub" title="this tile follows ${esc(k)}">▸ ${esc(k)}</i>`).join("")}</span><button type="button" class="nudge up" title="move up">▲</button><button type="button" class="nudge dn" title="move down">▼</button><button type="button" class="col" title="collapse / expand">${spec.collapsed ? "▸" : "▾"}</button><button type="button" class="rm" title="remove from the board">✕</button></div><div class="lv-body"></div><div class="lv-resize" title="drag to resize"></div>`;
  placeTile(el, spec); worldEl.appendChild(el);
  const body = el.querySelector(".lv-body"), head = el.querySelector(".lv-thead"), tEl = el.querySelector(".t");
  let view = null;
  const api = { el, body, spec, setTitle: t => { tEl.textContent = t; }, remount };
  function remount() { try { view?.destroy?.(); } catch (_) {} body.innerHTML = ""; body.className = "lv-body"; try { view = def.mount(body, { ...ctx, spec, tile: api }) || null; } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; } }
  remount();
  el.addEventListener("pointerdown", () => { el.style.zIndex = ++zTop; }, true);   // the one you touch comes to the front
  el.querySelector(".col").onclick = () => { spec.collapsed = !spec.collapsed; el.querySelector(".col").textContent = spec.collapsed ? "▸" : "▾"; placeTile(el, spec); handlers.onChange(spec); };
  el.querySelector(".rm").onclick = () => { try { view?.destroy?.(); } catch (_) {} el.remove(); handlers.onRemove(spec); };
  // phone: the arrows move a tile up / down the column (L 2026-10-04 "move top to bottom via arrows instead of drag")
  el.querySelector(".nudge.up").onclick = e => { e.stopPropagation(); handlers.onNudge?.(spec, -1); };
  el.querySelector(".nudge.dn").onclick = e => { e.stopPropagation(); handlers.onNudge?.(spec, 1); };

  // drag (header) + resize (corner): screen deltas divided by the board's zoom, snapped to the grid, kept inside the world
  let drag = null;
  const s = () => (ctx.board && ctx.board.view.s) || 1;
  const down = kind => e => { if (e.button) return; if (kind === "move" && e.target.closest("button")) return;
    if (kind === "move" && NARROW()) return;   // phone: no header drag - the arrows move a tile, a touch here scrolls the view
    e.preventDefault(); e.stopPropagation(); drag = { kind, x0: e.clientX, y0: e.clientY, s0: { ...spec }, scale: s() }; el.classList.add("dragging"); try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {} };
  const move = e => { if (!drag) return; const dx = (e.clientX - drag.x0) / drag.scale, dy = (e.clientY - drag.y0) / drag.scale;
    if (drag.kind === "move") { spec.x = snap(Math.max(0, Math.min(WORLD.w - spec.w, drag.s0.x + dx))); spec.y = snap(Math.max(0, Math.min(WORLD.h - HEAD_H, drag.s0.y + dy))); }
    else { if (!NARROW()) spec.w = snap(Math.max(220, Math.min(WORLD.w - spec.x, drag.s0.w + dx))); spec.h = snap(Math.max(120, Math.min(WORLD.h - spec.y, drag.s0.h + dy))); }   // phone: height only ("stretch up and down")
    placeTile(el, spec); handlers.onMove?.(spec); };
  const up = () => { if (!drag) return; const was = drag; drag = null; el.classList.remove("dragging"); if (was.s0.x !== spec.x || was.s0.y !== spec.y || was.s0.w !== spec.w || was.s0.h !== spec.h) handlers.onChange(spec, true); };
  head.addEventListener("pointerdown", down("move")); el.querySelector(".lv-resize").addEventListener("pointerdown", down("size"));
  for (const t of [head, el.querySelector(".lv-resize")]) { t.addEventListener("pointermove", move); t.addEventListener("pointerup", up); t.addEventListener("pointercancel", up); }
  // a touch inside the body must not pan the board (the board pans only from empty space), but it may scroll the body
  body.addEventListener("pointerdown", e => { if (!NARROW()) e.stopPropagation(); });   // phone: nothing to stop - the view scrolls natively
  return api;
}
