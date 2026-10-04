// ui/block.js - the frame every block lives in, on the big canvas: header (title, collapse, remove), a body the block's
// own view fills, drag by the header and resize by the corner, in WORLD pixels (the board's zoom is divided out), snapped
// to the grid. Shape only - a block's logic never lives here.
import { GRID, snap, WORLD } from "../core/layout.js";

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let zTop = 10;
export const HEAD_H = 40;
export function placeBlock(el, b) { el.style.left = b.x + "px"; el.style.top = b.y + "px"; el.style.width = b.w + "px"; el.style.height = (b.collapsed ? HEAD_H : b.h) + "px"; el.classList.toggle("collapsed", !!b.collapsed); }

// def = { title, mount(body, ctx) -> { destroy?, title? }, pub?, sub? }; spec = the layout entry; ctx.board = the canvas api
export function mountBlock(worldEl, spec, def, ctx, handlers) {
  const el = document.createElement("section"); el.className = "lv-block"; el.dataset.id = spec.id; el.dataset.type = spec.type;
  el.innerHTML = `<div class="lv-bhead"><span class="t">${esc(def.title)}</span><span class="keys">${(def.pub || []).map(k => `<i class="pub" title="this block sets ${esc(k)}">${esc(k)} ▸</i>`).join("")}${(def.sub || []).map(k => `<i class="sub" title="this block follows ${esc(k)}">▸ ${esc(k)}</i>`).join("")}</span><button type="button" class="col" title="collapse / expand">${spec.collapsed ? "▸" : "▾"}</button><button type="button" class="rm" title="remove from the board">✕</button></div><div class="lv-body"></div><div class="lv-resize" title="drag to resize"></div>`;
  placeBlock(el, spec); worldEl.appendChild(el);
  const body = el.querySelector(".lv-body"), head = el.querySelector(".lv-bhead"), tEl = el.querySelector(".t");
  let view = null;
  const api = { el, body, spec, setTitle: t => { tEl.textContent = t; }, remount };
  function remount() { try { view?.destroy?.(); } catch (_) {} body.innerHTML = ""; try { view = def.mount(body, { ...ctx, spec, block: api }) || null; } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; } }
  remount();
  el.addEventListener("pointerdown", () => { el.style.zIndex = ++zTop; }, true);   // the one you touch comes to the front
  el.querySelector(".col").onclick = () => { spec.collapsed = !spec.collapsed; el.querySelector(".col").textContent = spec.collapsed ? "▸" : "▾"; placeBlock(el, spec); handlers.onChange(spec); };
  el.querySelector(".rm").onclick = () => { try { view?.destroy?.(); } catch (_) {} el.remove(); handlers.onRemove(spec); };

  // drag (header) + resize (corner): screen deltas divided by the board's zoom, snapped to the grid, kept inside the world
  let drag = null;
  const s = () => (ctx.board && ctx.board.view.s) || 1;
  const down = kind => e => { if (e.button) return; if (kind === "move" && e.target.closest("button")) return;
    e.preventDefault(); e.stopPropagation(); drag = { kind, x0: e.clientX, y0: e.clientY, s0: { ...spec }, scale: s() }; el.classList.add("dragging"); try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {} };
  const move = e => { if (!drag) return; const dx = (e.clientX - drag.x0) / drag.scale, dy = (e.clientY - drag.y0) / drag.scale;
    if (drag.kind === "move") { spec.x = snap(Math.max(0, Math.min(WORLD.w - spec.w, drag.s0.x + dx))); spec.y = snap(Math.max(0, Math.min(WORLD.h - HEAD_H, drag.s0.y + dy))); }
    else { spec.w = snap(Math.max(220, Math.min(WORLD.w - spec.x, drag.s0.w + dx))); spec.h = snap(Math.max(120, Math.min(WORLD.h - spec.y, drag.s0.h + dy))); }
    placeBlock(el, spec); handlers.onMove?.(spec); };
  const up = () => { if (!drag) return; const was = drag; drag = null; el.classList.remove("dragging"); if (was.s0.x !== spec.x || was.s0.y !== spec.y || was.s0.w !== spec.w || was.s0.h !== spec.h) handlers.onChange(spec, true); };
  head.addEventListener("pointerdown", down("move")); el.querySelector(".lv-resize").addEventListener("pointerdown", down("size"));
  for (const t of [head, el.querySelector(".lv-resize")]) { t.addEventListener("pointermove", move); t.addEventListener("pointerup", up); t.addEventListener("pointercancel", up); }
  // a touch inside the body must not pan the board (the board pans only from empty space), but it may scroll the body
  body.addEventListener("pointerdown", e => e.stopPropagation());
  return api;
}
