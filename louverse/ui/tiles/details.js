// tiles/details.js - THE CATCH-ALL for the picked visit (L 2026-10-04: "instead of things having redundant data like Visit and
// Contact, have Details be the catch-all - the job data, notes, sensor data if present"): the record's facts, the customer's
// contact (call / text / email / map), the notes, the invoice line, the customer's other visits (tap = pick), then the project's
// DEVICES - onlinejob's device lists and onlinedetails's device data (sensorMeta). Those two hang off the project's META-OWNER
// task (the first visit of the project, not every night - L: "onlinedetails shows details, the louverse says no device lists"),
// resolved the way the apps do (core/jobs metaOwnerOf). Read-only here: Entry is the form.
import { loadJobs, loadJob, metaOwnerOf, deviceLists, sensorRows, invoiceOf, visitsOfCustomer, fmtDate, fmtTime, fmtHours } from "../../core/jobs.js";
import { money2 } from "../../core/ledger.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const title = "Details";
export const sub = ["visitId", "visitSaved"];
export const pub = ["visitId"];   // a tap on one of the customer's other visits picks it
export function mount(body, { store, tile }) {
  let stops = [], run = 0;
  const kv = (k, v) => v ? `<b>${k}</b><span>${v}</span>` : "";
  const h = t => `<div class="lv-muted h" style="margin:10px 0 4px;font-size:.8rem">${t}</div>`;
  const draw = async () => {
    const id = store.get("visitId"), my = ++run; if (!id) { body.innerHTML = `<div class="lv-empty">Pick a visit.</div>`; tile.setTitle("Details"); return; }
    const base = store.get("base");
    let j = store.get("visit"); if (!j || j.id !== id) { try { j = await loadJob(base, id); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; } }
    if (!j || my !== run) return; const raw = j.raw || {};
    tile.setTitle(`Details · ${raw.customerName || j.customer}`);
    const tel = String(raw.customerPhone || "").replace(/[^\d+]/g, ""), mail = String(raw.customerEmail || "").trim(), addr = String(raw.customerAddress || "").trim();
    const segs = (Array.isArray(raw.segments) ? raw.segments : []).filter(s => s && s.startTime), inv = invoiceOf(j);
    const link = `https://luissolutions.us/apps/online/onlinedetails.html?task=${encodeURIComponent(j.id)}`;
    body.innerHTML = `<div class="lv-kv">
        ${kv("Customer", esc(raw.customerName || j.customer))}${kv("Project", esc(raw.project))}${kv("WO", esc(raw.workOrder))}${kv("Status", esc(j.status))}
        ${kv("Date", `${fmtDate(j.start)} ${fmtTime(j.start)}${j.end ? " → " + fmtTime(j.end) : ""}`)}
        ${kv("Hours", `${fmtHours(j.hours)}${j.travel ? ` (travel ${fmtHours(j.travel)})` : ""}`)}
        ${raw.startOdometer ? kv("Odometer", `${esc(raw.startOdometer)} → ${esc(raw.endOdometer || "")}`) : ""}
        ${kv("Phone", tel ? `<a href="tel:${esc(tel)}">${esc(raw.customerPhone)}</a>` : "")}${kv("Email", mail ? `<a href="mailto:${esc(mail)}">${esc(mail)}</a>` : "")}${kv("Address", esc(addr))}
        ${inv ? kv("Invoice", `${esc(inv.type)} · ${money2.format(Number(inv.total) || 0)} · ${inv.paid ? "paid" + (inv.paidDate ? " " + esc(inv.paidDate) : "") : "unpaid"}`) : ""}
      </div>
      ${segs.length ? `<div class="lv-muted" style="font-size:.82rem;margin:4px 0">${segs.map(s => `${esc(s.type || "work")} ${fmtTime(s.startTime)}–${s.endTime ? fmtTime(s.endTime) : "…"}`).join(" · ")}</div>` : ""}
      <div class="lv-chips">${tel ? `<a class="lv-btn" href="tel:${esc(tel)}">📞 call</a><a class="lv-btn" href="sms:${esc(tel)}">💬 text</a>` : ""}${mail ? `<a class="lv-btn" href="mailto:${esc(mail)}">✉️ email</a>` : ""}${addr ? `<a class="lv-btn" href="https://maps.google.com/?q=${encodeURIComponent(addr)}" target="_blank" rel="noopener">🗺 map</a>` : ""}<button type="button" class="lv-btn primary" data-entry title="edit this visit in the Entry tile">✎ Edit in Entry</button><a class="lv-btn" href="${link}" target="_blank" rel="noopener">Details app ↗</a></div>
      ${j.notes ? h("Notes") + `<div style="white-space:pre-wrap;font-size:.86rem">${esc(j.notes)}</div>` : ""}
      <div class="lv-others"></div><div class="lv-devices"><div class="lv-muted" style="font-size:.8rem;margin-top:8px">loading devices…</div></div>`;
    // "✎ Edit in Entry" (L "not seeing any editing in the tiles"): Details reads, Entry writes - ask the board for an Entry tile
    body.querySelector("[data-entry]").onclick = () => { store.set("tx", null); window.dispatchEvent(new CustomEvent("lv:tile", { detail: { type: "entry", from: tile.spec?.id } })); };
    // the rest needs the whole tasks node - ONE read, shared by "other visits" and the meta-owner lookup
    const othersEl = body.querySelector(".lv-others"), devEl = body.querySelector(".lv-devices");
    let jobs = []; try { jobs = await loadJobs(base); } catch (e) { if (my === run) devEl.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; }
    if (my !== run) return;
    const others = await visitsOfCustomer(base, raw.customerName || j.customer, j.id, jobs);
    othersEl.innerHTML = others.length ? h(`Other visits · ${others.length}`) + `<div class="lv-rows">${others.slice(0, 20).map(v => `<div class="lv-row" data-id="${esc(v.id)}"><div><div class="n">${esc(v.project || v.wo || "visit")}</div><div class="s">${fmtDate(v.start)}${v.hours ? " · " + v.hours + " h" : ""}</div></div></div>`).join("")}</div>` : "";
    othersEl.querySelectorAll("[data-id]").forEach(r => r.onclick = () => store.set("visitId", r.dataset.id));
    const owner = await metaOwnerOf(base, j, jobs), lists = deviceLists(owner), sensors = sensorRows(owner), n = lists.reduce((t, l) => t + l.rows.length, 0) + sensors.length;
    if (!n) { devEl.innerHTML = `<div class="lv-muted" style="font-size:.8rem;margin-top:8px">no device lists or device data on this project</div>`; return; }
    const flags = r => `${r.labeled ? " 🏷" : ""}${r.run ? " ▶" : ""}${r.placed ? " 📍" : ""}`;
    const sum = [sensors.filter(r => r.labeled).length && `${sensors.filter(r => r.labeled).length} labeled`, sensors.filter(r => r.run).length && `${sensors.filter(r => r.run).length} run`, sensors.filter(r => r.placed).length && `${sensors.filter(r => r.placed).length} on map`].filter(Boolean);
    devEl.innerHTML = (owner.id !== j.id ? `<div class="lv-muted" style="font-size:.75rem;margin-top:8px">devices · project record from the first visit, ${esc(fmtDate(owner.start))}</div>` : "")
      + lists.map(l => h(`${esc(l.name)} · ${l.rows.length}${l.rows.some(r => r.counted) ? ` · ${l.rows.filter(r => r.counted).length} counted` : ""}`)
        + `<div class="lv-tbl"><b>ID</b><b>Serial</b><b>Model</b><b>Status</b>${l.rows.map(r => `<span>${r.counted ? "✓ " : ""}${esc(r.id)}</span><span>${esc(r.serial)}</span><span>${esc(r.model || r.type)}</span><span>${esc(r.status)}${r.photos ? ` · 📷${r.photos}` : ""}</span>`).join("")}</div>`).join("")
      + (sensors.length ? h(`Device data · ${sensors.length}${sum.length ? " · " + sum.join(", ") : ""}`)
        + `<div class="lv-tbl five"><b>#</b><b>Serial</b><b>Info 1</b><b>Info 2</b><b>Info 3</b>${sensors.map(r => `<span>${esc(r.num)}${flags(r)}</span><span>${esc(r.serial)}</span><span>${esc(r.m1)}</span><span>${esc(r.m2)}</span><span>${esc(r.m3)}</span>`).join("")}</div>` : "");
  };
  stops.push(store.on("visitId", draw), store.on("base", draw), store.on("visitSaved", s => { if (s && s.id === store.get("visitId")) draw(); })); draw();
  return { destroy: () => stops.forEach(s => s()) };
}
