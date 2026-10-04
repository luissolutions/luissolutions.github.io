// ui/board.js - the big canvas the blocks sit on (L 2026-10-03: "like the Louverse, bigger canvas ... move it around on a
// grid, think the map from pihub, lots of real estate"). A world of WORLD.w x WORLD.h px under a pan + zoom transform; the
// blocks are real DOM (inputs, frames, scrolling bodies all work) placed in world px; an SVG layer under them draws the
// ARROWS between blocks that feed each other (a block that publishes a store key -> every block that reads it), and an
// arrow lights up the moment its key changes - "showing where other info will change as it changes here".
//   mountBoard(viewEl, worldEl, svgEl, { onView }) -> { view, toWorld, zoomAt, panBy, fit, setView, drawArrows, pulse }
import { WORLD, NARROW } from "../core/layout.js";

export function mountBoard(viewEl, worldEl, svgEl, { onView } = {}) {
  const view = { x: 0, y: 0, s: 1 };   // world -> screen: screen = world * s + (x, y)
  // PHONE (L 2026-10-04 "limit side movement, up and down only"): on a narrow screen the view is a plain vertical scroller -
  // no transform, no pan / zoom / pinch / wheel handling; the column of tiles sets the world's height (fitWorld).
  const narrow = () => NARROW();
  const apply = () => { if (narrow()) { view.x = 0; view.y = 0; view.s = 1; worldEl.style.transform = "none"; } else worldEl.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.s})`; onView?.(view); };
  const toWorld = (cx, cy) => { const r = viewEl.getBoundingClientRect(); if (narrow()) return [cx - r.left + viewEl.scrollLeft, cy - r.top + viewEl.scrollTop]; return [(cx - r.left - view.x) / view.s, (cy - r.top - view.y) / view.s]; };
  function fitWorld(tiles) { if (!narrow()) { worldEl.style.height = ""; return; } const bottom = Math.max(0, ...(tiles || []).map(t => t.y + (t.collapsed ? 40 : t.h))); worldEl.style.height = (bottom + 60) + "px"; }
  const clampView = () => { const r = viewEl.getBoundingClientRect();
    view.x = Math.min(80, Math.max(r.width - WORLD.w * view.s - 80, view.x)); view.y = Math.min(80, Math.max(r.height - WORLD.h * view.s - 80, view.y)); };
  function zoomAt(cx, cy, f) { if (narrow()) return; const r = viewEl.getBoundingClientRect(), px = cx - r.left, py = cy - r.top, ns = Math.max(0.2, Math.min(3, view.s * f)); f = ns / view.s;
    view.x = px - (px - view.x) * f; view.y = py - (py - view.y) * f; view.s = ns; clampView(); apply(); }
  function panBy(dx, dy) { if (narrow()) { viewEl.scrollTop -= dy; return; } view.x += dx; view.y += dy; clampView(); apply(); }
  function setView(v) { if (narrow()) { apply(); return true; } if (v && isFinite(v.s)) { view.x = v.x; view.y = v.y; view.s = v.s; clampView(); apply(); return true; } return false; }
  // fit every block into the viewport (with a margin); the first thing a new browser sees
  function fit(tiles) { if (narrow()) { apply(); fitWorld(tiles); viewEl.scrollTop = 0; return; } const r = viewEl.getBoundingClientRect(); if (!tiles?.length || !r.width) return;
    const x0 = Math.min(...tiles.map(b => b.x)), y0 = Math.min(...tiles.map(b => b.y)), x1 = Math.max(...tiles.map(b => b.x + b.w)), y1 = Math.max(...tiles.map(b => b.y + (b.collapsed ? 40 : b.h)));
    const s = Math.max(0.2, Math.min(1.4, Math.min((r.width - 40) / (x1 - x0), (r.height - 40) / (y1 - y0))));
    view.s = s; view.x = (r.width - (x1 - x0) * s) / 2 - x0 * s; view.y = (r.height - (y1 - y0) * s) / 2 - y0 * s; clampView(); apply(); }

  // ---- input: drag on empty board = pan; wheel = pan, Ctrl/Shift + wheel = zoom; two fingers = pinch + pan; dblclick empty = fit ----
  const ptr = new Map(); let pan = null, pinch = null, mid = null;
  const isEmpty = t => t === viewEl || t === worldEl || t === svgEl || (t && t.closest && t.closest(".lv-grid-bg"));
  // a wheel over a tile body scrolls THE TILE while it has room that way (L 2026-10-04 "make scrolling work in the tiles"); only
  // when it cannot scroll further does the wheel pan the board. Ctrl/Shift + wheel always zooms.
  const bodyCanScroll = (body, dx, dy) => (dy && ((dy < 0 && body.scrollTop > 0) || (dy > 0 && body.scrollTop + body.clientHeight < body.scrollHeight - 1)))
    || (dx && ((dx < 0 && body.scrollLeft > 0) || (dx > 0 && body.scrollLeft + body.clientWidth < body.scrollWidth - 1)));
  viewEl.addEventListener("wheel", e => {
    if (narrow()) return;   // the phone view scrolls on its own
    if (!e.ctrlKey && !e.shiftKey) { const body = e.target.closest && e.target.closest(".lv-body"); if (body && !body.classList.contains("frame") && bodyCanScroll(body, e.deltaX, e.deltaY)) return; }   // native scroll inside the tile
    e.preventDefault(); if (e.ctrlKey || e.shiftKey) zoomAt(e.clientX, e.clientY, Math.exp(-(e.deltaY || e.deltaX) * 0.0015)); else panBy(-e.deltaX, -e.deltaY); }, { passive: false });
  viewEl.addEventListener("pointerdown", e => {
    if (narrow()) return;   // the phone view scrolls on its own - no pan, no pinch
    ptr.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptr.size === 2) { pan = null; const [a, b] = [...ptr.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; e.preventDefault(); return; }
    if (!isEmpty(e.target) || e.button) return;
    pan = [e.clientX, e.clientY]; viewEl.classList.add("panning"); try { viewEl.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault();
  });
  viewEl.addEventListener("pointermove", e => {
    if (!ptr.has(e.pointerId)) return; ptr.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptr.size === 2 && pinch) { const [a, b] = [...ptr.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (mid) panBy(m[0] - mid[0], m[1] - mid[1]); zoomAt(m[0], m[1], d / pinch); pinch = d; mid = m; return; }
    if (pan) { panBy(e.clientX - pan[0], e.clientY - pan[1]); pan = [e.clientX, e.clientY]; }
  });
  const up = e => { ptr.delete(e.pointerId); if (ptr.size < 2) { pinch = null; mid = null; } if (!ptr.size) { pan = null; viewEl.classList.remove("panning"); } };
  viewEl.addEventListener("pointerup", up); viewEl.addEventListener("pointercancel", up);
  viewEl.addEventListener("dblclick", e => { if (isEmpty(e.target)) fitAll(); });
  let fitAll = () => {};

  // ---- arrows: from each block that PUBLISHES a key to each block that SUBSCRIBES to it ----
  const NS = "http://www.w3.org/2000/svg";
  svgEl.innerHTML = `<defs><marker id="lv-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs><g class="lv-arrows"></g>`;
  const g = svgEl.querySelector(".lv-arrows");
  let links = [];   // [{from, to, key, el}]
  function edge(b, side) { const h = b.collapsed ? 40 : b.h; return side === "r" ? [b.x + b.w, b.y + Math.min(60, h / 2)] : side === "l" ? [b.x, b.y + Math.min(60, h / 2)] : side === "b" ? [b.x + b.w / 2, b.y + h] : [b.x + b.w / 2, b.y]; }
  function drawArrows(tiles, defs) {
    g.innerHTML = ""; links = [];
    for (const a of tiles) for (const b of tiles) { if (a === b) continue; const pub = defs[a.type]?.pub || [], sub = defs[b.type]?.sub || [];
      for (const key of pub) if (sub.includes(key)) {
        const goRight = b.x >= a.x + a.w - 40, goLeft = b.x + b.w <= a.x + 40;
        const [x1, y1] = edge(a, goRight ? "r" : goLeft ? "l" : (b.y > a.y ? "b" : "t")), [x2, y2] = edge(b, goRight ? "l" : goLeft ? "r" : (b.y > a.y ? "t" : "b"));
        const dx = Math.max(60, Math.abs(x2 - x1) / 2), d = goRight || goLeft ? `M${x1},${y1} C${x1 + (goRight ? dx : -dx)},${y1} ${x2 - (goRight ? dx : -dx)},${y2} ${x2},${y2}` : `M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`;
        const p = document.createElementNS(NS, "path"); p.setAttribute("d", d); p.setAttribute("class", "lv-link k-" + key); p.setAttribute("marker-end", "url(#lv-arrow)"); p.dataset.key = key; p.dataset.to = b.id; p.dataset.from = a.id;
        const t = document.createElementNS(NS, "text"); t.setAttribute("x", (x1 + x2) / 2); t.setAttribute("y", (y1 + y2) / 2 - 6); t.setAttribute("class", "lv-link-lbl"); t.textContent = key;
        g.appendChild(p); g.appendChild(t); links.push({ from: a.id, to: b.id, key, el: p });
      } }
  }
  // a key just changed: light its arrows and ring the blocks on the receiving end for a moment
  function pulse(key, tileEls) {
    for (const l of links) if (l.key === key) { l.el.classList.remove("live"); void l.el.getBoundingClientRect(); l.el.classList.add("live"); const el = tileEls.get(l.to); if (el) { el.classList.remove("lit"); void el.offsetWidth; el.classList.add("lit"); } }
  }
  const api = { view, toWorld, zoomAt, panBy, setView, fit: b => { fit(b); }, fitWorld, drawArrows, pulse, setFitAll: f => { fitAll = f; } };
  apply(); return api;
}
