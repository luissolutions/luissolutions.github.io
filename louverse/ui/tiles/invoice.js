// tiles/invoice.js - the INVOICE on a visit, or the invoice a ledger row belongs to (L 2026-10-04: "if that item was used in an
// invoice, I want that sort of arrow connecting it, in that it was utilized here"). A visit record IS its invoice (onlineinvoice
// writes the lines onto tasks/<id>); a ledger row reaches an invoice as the PAYMENT it created (paymentTxId) or as a PART a
// line used (sku / name). Last pick wins: a visit shows its invoice, a row lists the invoices it touches; "open visit" picks it.
import { loadJob, invoiceOf, invoicesFor, fmtDate } from "../../core/jobs.js";
import { money2, loadLedgerYear } from "../../core/ledger.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const num = v => Number(String(v ?? "").replace(/[^0-9.\-]/g, "")) || 0;

export const title = "Invoice";
export const sub = ["visitId", "tx"];
export const pub = ["visitId", "tx"];
export function mount(body, { store, tile }) {
  let stops = [], run = 0;
  const lines = inv => `<div class="lv-inv">
      ${inv.labor.length ? `<div class="lv-muted h">Labor</div>${inv.labor.map(l => `<div class="r"><span>${esc(l.description || "labor")}</span><span>${esc(l.hours || "")} h × ${money2.format(num(l.rate))}</span><span>${money2.format(num(l.total))}</span></div>`).join("")}` : ""}
      ${inv.parts.length ? `<div class="lv-muted h">Parts</div>${inv.parts.map(p => `<div class="r"><span>${esc(p.part || p.sku || "part")}</span><span>${esc(p.quantity || 1)} × ${money2.format(num(p.price))}</span><span>${money2.format(num(p.total))}</span></div>`).join("")}` : ""}
      <div class="r t"><span>Subtotal</span><span></span><span>${money2.format(num(inv.subtotal))}</span></div>
      ${num(inv.tax) ? `<div class="r"><span>Tax</span><span></span><span>${money2.format(num(inv.tax))}</span></div>` : ""}
      <div class="r t"><span>Total</span><span></span><span>${money2.format(num(inv.total))}</span></div>
      <div class="r"><span>${inv.paid ? "Paid" : "Unpaid"}</span><span>${inv.paid ? esc(inv.paidDate || "") : ""}</span><span>${inv.paid ? money2.format(num(inv.amountPaid || inv.total)) : ""}</span></div>
    </div>`;
  const drawVisit = async () => {
    const id = store.get("visitId"), my = ++run; if (!id) { body.innerHTML = `<div class="lv-empty">Pick a visit, or a ledger row.</div>`; tile.setTitle("Invoice"); return; }
    let j = store.get("visit"); if (!j || j.id !== id) { try { j = await loadJob(store.get("base"), id); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; } }
    if (!j || my !== run) return; const inv = invoiceOf(j);
    tile.setTitle(`Invoice · ${j.customer}`);
    if (!inv) { body.innerHTML = `<div class="lv-empty">No invoice on this visit yet.</div><div class="lv-foot"><a class="lv-btn" href="https://luissolutions.us/apps/online/onlineinvoice.html?task=${encodeURIComponent(j.id)}" target="_blank" rel="noopener">make one in the Invoice app ↗</a></div>`; return; }
    body.innerHTML = `<div class="lv-note">${esc(inv.type)}${inv.date ? " · " + esc(inv.date) : ""}${inv.title ? " · " + esc(inv.title) : ""}</div>${lines(inv)}
      <div class="lv-foot">${inv.paymentTxId ? `<button type="button" class="lv-btn" data-pay>show the payment row ▸</button>` : ""}<a class="lv-btn" href="https://luissolutions.us/apps/online/onlineinvoice.html?task=${encodeURIComponent(j.id)}" target="_blank" rel="noopener">open in the Invoice app ↗</a></div>`;
    const pay = body.querySelector("[data-pay]"); if (pay) pay.onclick = async () => { pay.textContent = "looking…";
      try { const rows = await loadLedgerYear(store.get("base"), Number(inv.paymentTxYear) || store.get("year")); const row = rows.find(r => r.id === inv.paymentTxId);
        if (row) { if (Number(inv.paymentTxYear) && Number(inv.paymentTxYear) !== store.get("year")) store.set("year", Number(inv.paymentTxYear)); store.set("tx", { ...row, year: Number(inv.paymentTxYear) || store.get("year") }); pay.textContent = "payment row picked ▸"; }
        else pay.textContent = "payment row not found"; } catch (e) { pay.textContent = "could not read: " + (e.message || e); } };
  };
  const drawTx = async tx => {
    const my = ++run; tile.setTitle(`Invoice · ${tx.name}`); body.innerHTML = `<div class="lv-empty">looking for invoices that used this…</div>`;
    let hits = []; try { hits = await invoicesFor(store.get("base"), tx); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; }
    if (my !== run) return;
    if (!hits.length) { body.innerHTML = `<div class="lv-empty">${esc(tx.name)} is not on any invoice${tx.type === "income" ? " as a payment" : " as a part"}.</div>`; return; }
    body.innerHTML = `<div class="lv-rows">${hits.map((h, i) => `<div class="lv-row" data-i="${i}"><div><div class="n">${esc(h.job.customer)} · ${money2.format(num(h.inv.total))}${h.inv.paid ? " · paid" : ""}</div><div class="s">${h.how === "payment" ? "this row is the payment" : `used ${esc(h.line.quantity || 1)} × ${esc(h.line.part || "")}`} · ${esc(h.inv.date || fmtDate(h.job.start))}</div></div><div class="v">open ▸</div></div>`).join("")}</div>`;
    body.querySelectorAll("[data-i]").forEach(r => r.onclick = () => store.set("visitId", hits[Number(r.dataset.i)].job.id));
  };
  stops.push(store.on("visitId", drawVisit), store.on("base", drawVisit), store.on("tx", tx => tx ? drawTx(tx) : drawVisit()), store.on("visitSaved", s => { if (s && s.id === store.get("visitId")) drawVisit(); }));
  const tx = store.get("tx"); if (tx && !store.get("visitId")) drawTx(tx); else drawVisit();
  return { destroy: () => stops.forEach(s => s()) };
}
