// tiles/txform.js - the LEDGER ROW form (name, detail, amount, date, tags, part category, SKU, note, link), drawn by Details
// (the one tile for whatever was tapped last - L 2026-10-04 "I may not need Entry and Details, they could be a tile") and by
// the legacy Entry tile. Saves through core/ledger.saveRow (only the fields given), publishes ledgerSaved.
import { saveRow } from "../../core/ledger.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function drawTxForm(host, { store, tile, title = "Details" }) {
  const tx = store.get("tx"); if (!tx) { host.innerHTML = `<div class="lv-empty">Tap a row in the Ledger, or pick a visit.</div>`; tile.setTitle(title); return; }
  tile.setTitle(`${title} · ${tx.name || "row"}`); const day = tx.dt instanceof Date ? tx.dt.toISOString().slice(0, 10) : "";
  host.innerHTML = `<form class="lv-form">
    <label><b>Name</b><input name="name" value="${esc(tx.name)}"></label>
    <label><b>Detail</b><input name="sub" value="${esc(tx.sub || "")}" placeholder="what it was"></label>
    <div class="lv-two"><label><b>Amount</b><input name="amt" type="number" step="0.01" min="0" inputmode="decimal" value="${tx.amt}"></label><label><b>Date</b><input name="date" type="date" value="${day}"></label></div>
    <label><b>Tags</b><input name="tags" value="${esc((tx.tags || []).join(" "))}" placeholder="🏠 🛒 … (the first spending tag is the category circle)"></label>
    <div class="lv-two"><label><b>Part category</b><input name="cat" value="${esc(tx.cat || "")}" placeholder="parts only"></label><label><b>SKU</b><input name="sku" value="${esc(tx.sku || "")}"></label></div>
    <label><b>Note</b><textarea name="desc" rows="3">${esc(tx.desc || "")}</textarea></label>
    <label><b>Link</b><input name="link" value="${esc(tx.link || "")}" placeholder="https://…"></label>
    <div class="lv-actions"><span class="lv-muted st">${tx.img ? "receipt attached - see Photos" : "no receipt - add one in Photos"}</span><button type="submit" class="lv-btn primary">Save</button></div>
  </form>`;
  const f = host.querySelector("form"), st = f.querySelector(".st"); f.addEventListener("input", () => { st.textContent = "unsaved"; });
  f.onsubmit = async e => { e.preventDefault(); st.textContent = "saving…";
    try { const d = f.date.value, ms = d ? Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), 12) : undefined;
      const patch = { name: f.name.value.trim(), sub: f.sub.value.trim(), amt: Number(f.amt.value) || 0, tags: f.tags.value.split(/\s+/).filter(Boolean), cat: f.cat.value.trim(), sku: f.sku.value.trim(), desc: f.desc.value, link: f.link.value.trim() };
      if (ms) patch.date = ms; const year = tx.year || store.get("year");
      const row = await saveRow(store.get("base"), year, tx.id, patch); st.textContent = "saved";
      store.set("ledgerSaved", Date.now()); store.set("tx", { ...(row || tx), year, dt: ms ? new Date(ms) : tx.dt }); }
    catch (x) { st.textContent = "not saved: " + (x.code || x.message); } };
}
