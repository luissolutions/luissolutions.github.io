// tiles/bookmarks.js - Saved Links filed under the picked visit (its project, WO, customer) or the picked vendor (L 2026-10-04:
// "apply bookmarks to a job somehow as relevant"). A bookmark is an ordinary Saved Links row whose categories carry that name,
// so the Links app shows the same thing under that category - nothing is duplicated. + files a new link under the first name.
import { loadLinks, linksFor, addLink } from "../../core/links.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const title = "Bookmarks";
export const sub = ["visitId", "tx"];
export function mount(body, { store, tile }) {
  let stops = [], run = 0, mode = "visit";
  const namesOf = () => { if (mode === "tx") { const tx = store.get("tx"); return tx ? [tx.name].filter(Boolean) : []; }
    const v = store.get("visit"); if (!v) return []; return [v.project, v.wo, v.customer].map(s => String(s || "").trim()).filter(Boolean); };
  const draw = async () => {
    const my = ++run, names = namesOf();
    if (!names.length) { body.innerHTML = `<div class="lv-empty">Pick a visit or a ledger row.</div>`; tile.setTitle("Bookmarks"); return; }
    tile.setTitle(`Bookmarks · ${names[0]}`); body.innerHTML = `<div class="lv-empty">loading…</div>`;
    let links = []; try { links = linksFor(await loadLinks(store.get("base")), names); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; }
    if (my !== run) return;
    body.innerHTML = `<div class="lv-muted" style="font-size:.8rem;margin-bottom:6px">filed under ${names.map(n => `<b>${esc(n)}</b>`).join(" · ")}</div>
      ${links.length ? `<div class="lv-rows">${links.map(l => `<a class="lv-row" href="${esc(l.url)}" target="_blank" rel="noopener"><div><div class="n">${esc(l.title)}</div><div class="s">${esc(l.url.replace(/^https?:\/\//, "").slice(0, 70))}</div></div><div class="v">↗</div></a>`).join("")}</div>` : `<div class="lv-empty">No bookmarks yet.</div>`}
      <form class="lv-form lv-add"><input name="url" type="url" placeholder="https://… (add a bookmark)" required><input name="title" placeholder="title (optional)"><div class="lv-actions"><span class="lv-muted st"></span><button type="submit" class="lv-btn primary">+ file under ${esc(names[0])}</button></div></form>`;
    const f = body.querySelector("form"), st = f.querySelector(".st");
    f.onsubmit = async e => { e.preventDefault(); st.textContent = "saving…"; try { await addLink(store.get("base"), { url: f.url.value, title: f.title.value, categories: [names[0]] }); draw(); } catch (x) { st.textContent = x.message || String(x); } };
  };
  stops.push(store.on("visitId", () => { mode = "visit"; draw(); }), store.on("visit", () => { if (mode === "visit") draw(); }), store.on("tx", tx => { if (tx) { mode = "tx"; draw(); } }), store.on("base", draw));
  draw();
  return { destroy: () => stops.forEach(s => s()) };
}
