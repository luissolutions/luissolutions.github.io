// tiles/bookmarks.js - SAVED LINKS as their own tile (L 2026-10-04: "bookmarks could probably be their own thing"): every link,
// a search box and the categories as chips; when a visit or a vendor is picked, one more chip ("📍 <name>") narrows the list to
// the links filed under it - optional, off by default. + files a new link under the active category (or the picked name).
// Rows are the onlinelinks app's own ({base}/links: url, title, categories[]) - the same list, nothing duplicated.
import { loadLinks, linksFor, addLink } from "../../core/links.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const title = "Bookmarks";
export const sub = ["visitId", "tx"];
export function mount(body, { store, tile }) {
  let stops = [], run = 0, links = [], cat = "", q = "", follow = false, pickMode = "";
  const pickNames = () => { if (pickMode === "tx") { const tx = store.get("tx"); return tx ? [tx.name].filter(Boolean) : []; }
    const v = store.get("visit"); if (!v || !store.get("visitId")) return []; return [v.project, v.wo, v.customer].map(s => String(s || "").trim()).filter(Boolean); };
  const cats = () => { const m = new Map(); for (const l of links) for (const c of l.categories) m.set(c, (m.get(c) || 0) + 1); return [...m.entries()].sort((a, b) => b[1] - a[1]); };
  const draw = () => {
    const names = pickNames(), t = q.trim().toLowerCase();
    let list = links; if (follow && names.length) list = linksFor(list, names); if (cat) list = list.filter(l => l.categories.includes(cat));
    if (t) list = list.filter(l => `${l.title} ${l.url} ${l.categories.join(" ")}`.toLowerCase().includes(t));
    tile.setTitle(`Bookmarks · ${list.length}${cat ? " · " + cat : follow && names.length ? " · 📍 " + names[0] : ""}`);
    const top = cats().slice(0, 14);
    body.innerHTML = `<input class="lv-search" type="search" placeholder="Search links (title, url, category)" value="${esc(q)}" autocomplete="off">
      <div class="lv-chips lv-cats">${names.length ? `<button type="button" class="lv-chip${follow ? " on" : ""}" data-follow="1" title="only the links filed under ${esc(names.join(" / "))}">📍 ${esc(names[0])}</button>` : ""}<button type="button" class="lv-chip${!cat ? " on" : ""}" data-cat="">All ${links.length}</button>${top.map(([c, n]) => `<button type="button" class="lv-chip${c === cat ? " on" : ""}" data-cat="${esc(c)}">${esc(c)} ${n}</button>`).join("")}</div>
      ${list.length ? `<div class="lv-rows">${list.slice(0, 200).map(l => `<a class="lv-row" href="${esc(l.url)}" target="_blank" rel="noopener"><div><div class="n">${esc(l.title)}</div><div class="s">${esc(l.url.replace(/^https?:\/\//, "").slice(0, 60))}${l.categories.length ? " · " + esc(l.categories.join(", ")) : ""}</div></div><div class="v">↗</div></a>`).join("")}${list.length > 200 ? `<div class="lv-muted">showing 200 of ${list.length}</div>` : ""}</div>` : `<div class="lv-empty">${links.length ? "no match" : "no links yet"}</div>`}
      <form class="lv-form lv-add"><input name="url" type="url" placeholder="https://… (add a link)" required><div class="lv-two"><input name="title" placeholder="title (optional)"><input name="cat" placeholder="category" value="${esc(cat || names[0] || "")}"></div><div class="lv-actions"><span class="lv-muted st"></span><button type="submit" class="lv-btn primary">+ add</button></div></form>`;
    const s = body.querySelector(".lv-search"); s.addEventListener("input", () => { q = s.value; const pos = s.selectionStart; draw(); const s2 = body.querySelector(".lv-search"); s2.focus(); try { s2.setSelectionRange(pos, pos); } catch (_) {} });
    body.querySelectorAll("[data-cat]").forEach(b => b.onclick = () => { cat = b.dataset.cat; follow = false; draw(); });
    const fb = body.querySelector("[data-follow]"); if (fb) fb.onclick = () => { follow = !follow; if (follow) cat = ""; draw(); };
    const f = body.querySelector("form"), st = f.querySelector(".st");
    f.onsubmit = async e => { e.preventDefault(); st.textContent = "saving…";
      try { const row = await addLink(store.get("base"), { url: f.url.value, title: f.title.value, categories: [f.cat.value.trim()].filter(Boolean) }); links.unshift(row); draw(); } catch (x) { st.textContent = x.message || String(x); } };
  };
  const load = async () => { const my = ++run; body.innerHTML = `<div class="lv-empty">loading…</div>`;
    try { links = await loadLinks(store.get("base")); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; }
    if (my !== run) return; links.sort((a, b) => a.title.localeCompare(b.title)); draw(); };
  stops.push(store.on("base", load), store.on("visitId", () => { pickMode = "visit"; draw(); }), store.on("visit", () => { if (pickMode === "visit") draw(); }), store.on("tx", tx => { if (tx) { pickMode = "tx"; draw(); } }));
  load();
  return { destroy: () => stops.forEach(s => s()) };
}
