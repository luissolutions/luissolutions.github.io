// tiles/entry.js - the picked LEDGER ROW, edited in place (L 2026-10-04: "another tile for the info of that ledger item I just
// clicked, in a way I can easily edit said info"). Follows `tx` (a tap in the Ledger tile), saves through core/ledger.saveRow
// (only the fields given), then publishes ledgerSaved so the Ledger, Analytics and Photos tiles follow the edit.
import { saveRow } from "../../core/ledger.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const title = "Entry";
export const sub = ["tx"];
export const pub = ["ledgerSaved"];
export function mount(body, { store, tile }) {
  let stops = [];
  const draw = () => {
    const tx = store.get("tx"); if (!tx) { body.innerHTML = `<div class="lv-empty">Tap a row in the Ledger.</div>`; tile.setTitle("Entry"); return; }
    tile.setTitle(`Entry · ${tx.name || "row"}`); const day = tx.dt instanceof Date ? tx.dt.toISOString().slice(0, 10) : "";
    body.innerHTML = `<form class="lv-form">
      <label><b>Name</b><input name="name" value="${esc(tx.name)}"></label>
      <label><b>Detail</b><input name="sub" value="${esc(tx.sub || "")}" placeholder="what it was"></label>
      <div class="lv-two"><label><b>Amount</b><input name="amt" type="number" step="0.01" min="0" inputmode="decimal" value="${tx.amt}"></label><label><b>Date</b><input name="date" type="date" value="${day}"></label></div>
      <label><b>Tags</b><input name="tags" value="${esc((tx.tags || []).join(" "))}" placeholder="🏠 🛒 … (the first spending tag is the category circle)"></label>
      <div class="lv-two"><label><b>Part category</b><input name="cat" value="${esc(tx.cat || "")}" placeholder="parts only"></label><label><b>SKU</b><input name="sku" value="${esc(tx.sku || "")}"></label></div>
      <label><b>Note</b><textarea name="desc" rows="3">${esc(tx.desc || "")}</textarea></label>
      <label><b>Link</b><input name="link" value="${esc(tx.link || "")}" placeholder="https://…"></label>
      <div class="lv-actions"><span class="lv-muted st">${tx.img ? "receipt attached - see Photos" : "no receipt - add one in Photos"}</span><button type="submit" class="lv-btn primary">Save</button></div>
    </form>`;
    const f = body.querySelector("form"), st = f.querySelector(".st"); f.addEventListener("input", () => { st.textContent = "unsaved"; });
    f.onsubmit = async e => { e.preventDefault(); st.textContent = "saving…";
      try { const d = f.date.value, ms = d ? Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), 12) : undefined;
        const patch = { name: f.name.value.trim(), sub: f.sub.value.trim(), amt: Number(f.amt.value) || 0, tags: f.tags.value.split(/\s+/).filter(Boolean), cat: f.cat.value.trim(), sku: f.sku.value.trim(), desc: f.desc.value, link: f.link.value.trim() };
        if (ms) patch.date = ms; const year = tx.year || store.get("year");
        const row = await saveRow(store.get("base"), year, tx.id, patch); st.textContent = "saved";
        store.set("ledgerSaved", Date.now()); store.set("tx", { ...(row || tx), year, dt: ms ? new Date(ms) : tx.dt }); }
      catch (x) { st.textContent = "not saved: " + (x.code || x.message); } };
  };
  stops.push(store.on("tx", draw)); draw();
  return { destroy: () => stops.forEach(s => s()) };
}
