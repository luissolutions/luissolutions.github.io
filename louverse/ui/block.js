// ui/block.js - the frame every block lives in: header (title, collapse, remove), a body the block's own view fills,
// drag by the header and resize by the corner on a desktop (grid cells), stacked and still on a phone. The block's logic
// never lives here - this is shape only.
import { COLS } from "../core/layout.js";

const phone = () => matchMedia("(max-width: 700px)").matches;
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function place(el, b) { el.style.gridColumn = `${b.x} / span ${b.w}`; el.style.gridRow = `${b.y} / span ${b.collapsed ? 1 : b.h}`; el.style.order = b.y * 100 + b.x; el.classList.toggle("collapsed", !!b.collapsed); }
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + (b.collapsed ? 1 : b.h) && b.y < a.y + (a.collapsed ? 1 : a.h);
// the moved block stays where it was dropped; anything it now covers is pushed down until nothing overlaps (dashboard gravity)
export function settle(blocks, moved) {
  const order = blocks.filter(b => b !== moved).sort((p, q) => p.y - q.y || p.x - q.x); let guard = 0;
  let changed = true; while (changed && guard++ < 200) { changed = false;
    for (const b of order) { const against = [moved, ...order.filter(o => o !== b && o.y < b.y)]; for (const o of against) if (overlaps(b, o)) { b.y = o.y + (o.collapsed ? 1 : o.h); changed = true; } } }
}

// def = { title, mount(body, ctx) -> { destroy?, title? } }; spec = the layout entry; handlers: onChange(spec), onRemove(spec)
export function mountBlock(grid, spec, def, ctx, handlers) {
  const el = document.createElement("section"); el.className = "lv-block"; el.dataset.id = spec.id;
  el.innerHTML = `<div class="lv-bhead"><span class="t">${esc(def.title)}</span><button type="button" class="col" title="collapse / expand">${spec.collapsed ? "▸" : "▾"}</button><button type="button" class="rm" title="remove from the board">✕</button></div><div class="lv-body"></div><div class="lv-resize" title="drag to resize"></div>`;
  place(el, spec); grid.appendChild(el);
  const body = el.querySelector(".lv-body"), head = el.querySelector(".lv-bhead"), tEl = el.querySelector(".t");
  let view = null;
  const api = { el, body, spec, setTitle: t => { tEl.textContent = t; }, remount };
  function remount() { try { view?.destroy?.(); } catch (_) {} body.innerHTML = ""; try { view = def.mount(body, { ...ctx, spec, block: api }) || null; } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; } }
  remount();
  el.querySelector(".col").onclick = () => { spec.collapsed = !spec.collapsed; el.querySelector(".col").textContent = spec.collapsed ? "▸" : "▾"; place(el, spec); handlers.onChange(spec); };
  el.querySelector(".rm").onclick = () => { try { view?.destroy?.(); } catch (_) {} el.remove(); handlers.onRemove(spec); };

  // drag (header) + resize (corner): pointer events, grid-cell maths from the grid's real size
  const cell = () => { const r = grid.getBoundingClientRect(), cs = getComputedStyle(grid), gap = parseFloat(cs.columnGap) || 10, padL = parseFloat(cs.paddingLeft) || 0, padR = parseFloat(cs.paddingRight) || 0;
    return { cw: (r.width - padL - padR - gap * (COLS - 1)) / COLS + gap, rh: (parseFloat(cs.gridAutoRows) || 40) + (parseFloat(cs.rowGap) || 10) }; };
  let drag = null;
  const down = kind => e => { if (phone() || e.button) return; if (kind === "move" && e.target.closest("button")) return;
    e.preventDefault(); drag = { kind, x0: e.clientX, y0: e.clientY, s: { ...spec }, c: cell() }; el.classList.add("dragging"); try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {} };
  const move = e => { if (!drag) return; const dx = Math.round((e.clientX - drag.x0) / drag.c.cw), dy = Math.round((e.clientY - drag.y0) / drag.c.rh);
    if (drag.kind === "move") { spec.x = Math.max(1, Math.min(COLS - spec.w + 1, drag.s.x + dx)); spec.y = Math.max(1, drag.s.y + dy); }
    else { spec.w = Math.max(2, Math.min(COLS - spec.x + 1, drag.s.w + dx)); spec.h = Math.max(2, drag.s.h + dy); }
    place(el, spec); };
  const up = () => { if (!drag) return; const was = drag; drag = null; el.classList.remove("dragging"); if (was.s.x !== spec.x || was.s.y !== spec.y || was.s.w !== spec.w || was.s.h !== spec.h) handlers.onChange(spec, true); };
  head.addEventListener("pointerdown", down("move")); el.querySelector(".lv-resize").addEventListener("pointerdown", down("size"));
  for (const t of [head, el.querySelector(".lv-resize")]) { t.addEventListener("pointermove", move); t.addEventListener("pointerup", up); t.addEventListener("pointercancel", up); }
  return api;
}
