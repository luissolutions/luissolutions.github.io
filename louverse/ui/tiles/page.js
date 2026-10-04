// blocks/page.js - any page in a frame (the "block as a frame" step). Same-origin pages share the login; a page from
// another origin (luissolutions.us today) opens signed out inside the frame - that is the browser's storage partition, not a bug.
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const title = "Page";
export function mount(body, { spec, tile, save }) {
  const show = () => { const url = spec.cfg?.url; if (!url) { body.classList.remove("frame"); body.innerHTML = `<form class="lv-kv" style="grid-template-columns:1fr auto;gap:6px"><input class="lv-search" style="margin:0" placeholder="https://…" value=""><button class="lv-btn" type="submit">Open</button></form><div class="lv-muted" style="font-size:.85rem;margin-top:6px">Pages on luissolutions.github.io share your login; other sites open signed out.</div>`;
      body.querySelector("form").onsubmit = e => { e.preventDefault(); const u = body.querySelector("input").value.trim(); if (!u) return; spec.cfg = { ...(spec.cfg || {}), url: u }; save(); show(); }; return; }
    let host = ""; try { host = new URL(url, location.href).host; } catch (_) {}
    tile.setTitle(spec.cfg?.title || `Page · ${host || url}`); body.classList.add("frame");   // a local-app tile keeps its app's name
    body.innerHTML = `<iframe class="lv-frame" src="${esc(url)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`; };
  show();
  return { destroy: () => body.classList.remove("frame") };
}
