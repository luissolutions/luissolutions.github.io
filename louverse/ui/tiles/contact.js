// tiles/contact.js - the picked visit's CUSTOMER as a contact card (L 2026-10-04: "a contacts window that would show the
// connected contact info and able to fill info out - phone number, more contact card stuff"). The fields live on the visit
// record itself (customerName / Phone / Email / Address - the same ones onlinecontacts edits), saved through core/jobs.saveJob;
// "other visits of this customer" tap -> that visit becomes the picked one.
import { loadJob, saveJob, visitsOfCustomer, fmtDate } from "../../core/jobs.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const F = [["customerName", "Name", "text"], ["customerPhone", "Phone", "tel"], ["customerEmail", "Email", "email"], ["customerAddress", "Address", "text"]];

export const title = "Contact";
export const sub = ["visitId", "visitSaved"];
export const pub = ["visitSaved", "visitId"];
export function mount(body, { store, tile }) {
  let stops = [], run = 0;
  const draw = async () => {
    const id = store.get("visitId"), my = ++run; if (!id) { body.innerHTML = `<div class="lv-empty">Pick a visit.</div>`; tile.setTitle("Contact"); return; }
    let j = store.get("visit"); if (!j || j.id !== id) { try { j = await loadJob(store.get("base"), id); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; } }
    if (!j || my !== run) return; const raw = j.raw || {};
    tile.setTitle(`Contact · ${raw.customerName || j.customer || "?"}`);
    const tel = String(raw.customerPhone || "").replace(/[^\d+]/g, ""), mail = String(raw.customerEmail || "").trim(), addr = String(raw.customerAddress || "").trim();
    body.innerHTML = `<form class="lv-form">
      ${F.map(([k, label, type]) => `<label><b>${label}</b><input name="${k}" type="${type}" value="${esc(raw[k] || "")}" autocomplete="off"></label>`).join("")}
      <div class="lv-chips">${tel ? `<a class="lv-btn" href="tel:${esc(tel)}">📞 call</a><a class="lv-btn" href="sms:${esc(tel)}">💬 text</a>` : ""}${mail ? `<a class="lv-btn" href="mailto:${esc(mail)}">✉️ email</a>` : ""}${addr ? `<a class="lv-btn" href="https://maps.google.com/?q=${encodeURIComponent(addr)}" target="_blank" rel="noopener">🗺 map</a>` : ""}</div>
      <div class="lv-actions"><span class="lv-muted st"></span><button type="submit" class="lv-btn primary">Save</button></div>
    </form><div class="lv-others"></div>`;
    const f = body.querySelector("form"), st = f.querySelector(".st"); f.addEventListener("input", () => { st.textContent = "unsaved"; });
    f.onsubmit = async e => { e.preventDefault(); st.textContent = "saving…"; const patch = {}; for (const [k] of F) patch[k] = f[k].value.trim();
      try { const fresh = await saveJob(store.get("base"), j.id, patch); st.textContent = "saved"; if (fresh) store.set("visit", fresh); store.set("visitSaved", { id: j.id, at: Date.now(), by: "contact" }); }
      catch (x) { st.textContent = "not saved: " + (x.code || x.message); } };
    // the same customer's other visits
    const others = body.querySelector(".lv-others");
    try { const list = await visitsOfCustomer(store.get("base"), raw.customerName || j.customer, j.id); if (my !== run) return;
      others.innerHTML = list.length ? `<div class="lv-muted" style="margin:8px 0 4px;font-size:.8rem">Other visits · ${list.length}</div><div class="lv-rows">${list.slice(0, 20).map(v => `<div class="lv-row" data-id="${esc(v.id)}"><div><div class="n">${esc(v.project || v.wo || "visit")}</div><div class="s">${fmtDate(v.start)}${v.hours ? " · " + v.hours + " h" : ""}</div></div></div>`).join("")}</div>` : "";
      others.querySelectorAll("[data-id]").forEach(r => r.onclick = () => store.set("visitId", r.dataset.id)); } catch (_) {}
  };
  stops.push(store.on("visitId", draw), store.on("base", draw), store.on("visitSaved", s => { if (s && s.by !== "contact" && s.id === store.get("visitId")) draw(); })); draw();
  return { destroy: () => stops.forEach(s => s()) };
}
