// tiles/entry.js - THE FORM for whatever was picked last (L 2026-10-04: "Entry is the same as Visit in a way - the input info
// for the selected parent - maybe they can function like Photos"): a tap on a ledger row shows the row's fields, a tap on a
// visit shows the visit's record, the last pick wins - the Photos rule. The two forms are the Visit tile (jobcard.js) and the
// ledger form below, mounted side by side in here; only the active one shows and owns the title.
import { saveRow } from "../../core/ledger.js";
import * as visit from "./jobcard.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const title = "Entry";
export const sub = ["visitId", "tx"];
export const pub = ["ledgerSaved", "visitSaved"];
export function mount(body, { store, tile }) {
  let stops = [], mode = "", titles = { tx: "Entry", visit: "Visit" };
  const txBody = document.createElement("div"), vBody = document.createElement("div"); body.append(txBody, vBody);
  const show = m => { mode = m; txBody.hidden = m !== "tx"; vBody.hidden = m !== "visit"; tile.setTitle(titles[m]); };
  const tileFor = m => ({ ...tile, setTitle: t => { titles[m] = m === "visit" ? String(t).replace(/^Visit\b/, "Entry") : t; if (mode === m) tile.setTitle(titles[m]); } });
  const inner = visit.mount(vBody, { store, tile: tileFor("visit") });   // the visit form, as the Visit tile draws it

  const drawTx = () => {
    const tx = store.get("tx"); if (!tx) { txBody.innerHTML = `<div class="lv-empty">Tap a row in the Ledger, or pick a visit.</div>`; tileFor("tx").setTitle("Entry"); return; }
    tileFor("tx").setTitle(`Entry · ${tx.name || "row"}`); const day = tx.dt instanceof Date ? tx.dt.toISOString().slice(0, 10) : "";
    txBody.innerHTML = `<form class="lv-form">
      <label><b>Name</b><input name="name" value="${esc(tx.name)}"></label>
      <label><b>Detail</b><input name="sub" value="${esc(tx.sub || "")}" placeholder="what it was"></label>
      <div class="lv-two"><label><b>Amount</b><input name="amt" type="number" step="0.01" min="0" inputmode="decimal" value="${tx.amt}"></label><label><b>Date</b><input name="date" type="date" value="${day}"></label></div>
      <label><b>Tags</b><input name="tags" value="${esc((tx.tags || []).join(" "))}" placeholder="🏠 🛒 … (the first spending tag is the category circle)"></label>
      <div class="lv-two"><label><b>Part category</b><input name="cat" value="${esc(tx.cat || "")}" placeholder="parts only"></label><label><b>SKU</b><input name="sku" value="${esc(tx.sku || "")}"></label></div>
      <label><b>Note</b><textarea name="desc" rows="3">${esc(tx.desc || "")}</textarea></label>
      <label><b>Link</b><input name="link" value="${esc(tx.link || "")}" placeholder="https://…"></label>
      <div class="lv-actions"><span class="lv-muted st">${tx.img ? "receipt attached - see Photos" : "no receipt - add one in Photos"}</span><button type="submit" class="lv-btn primary">Save</button></div>
    </form>`;
    const f = txBody.querySelector("form"), st = f.querySelector(".st"); f.addEventListener("input", () => { st.textContent = "unsaved"; });
    f.onsubmit = async e => { e.preventDefault(); st.textContent = "saving…";
      try { const d = f.date.value, ms = d ? Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), 12) : undefined;
        const patch = { name: f.name.value.trim(), sub: f.sub.value.trim(), amt: Number(f.amt.value) || 0, tags: f.tags.value.split(/\s+/).filter(Boolean), cat: f.cat.value.trim(), sku: f.sku.value.trim(), desc: f.desc.value, link: f.link.value.trim() };
        if (ms) patch.date = ms; const year = tx.year || store.get("year");
        const row = await saveRow(store.get("base"), year, tx.id, patch); st.textContent = "saved";
        store.set("ledgerSaved", Date.now()); store.set("tx", { ...(row || tx), year, dt: ms ? new Date(ms) : tx.dt }); }
      catch (x) { st.textContent = "not saved: " + (x.code || x.message); } };
  };
  // last pick wins: a ledger row -> its form; a visit -> the visit's; a cleared row falls back to the visit
  stops.push(store.on("tx", tx => { drawTx(); show(tx ? "tx" : "visit"); }), store.on("visitId", id => { if (id) show("visit"); }));
  drawTx(); show(store.get("tx") && !store.get("visitId") ? "tx" : store.get("visitId") ? "visit" : "tx");
  return { destroy: () => { stops.forEach(s => s()); inner.destroy?.(); } };
}
