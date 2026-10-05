// tiles/details.js - THE ONE TILE for whatever was tapped last (L 2026-10-04: "I may not need Entry and Details - they could be
// a tile with all the info editable, collapsible for long info like sensors, don't forget the other things that could go into
// detail"). A VISIT: its record editable in place (customer, phone, email, address, project, WO, status, notes - core/jobs
// saveJob), the facts (date, hours, odometer, segments), contact chips, then collapsible sections - invoice, daily entries,
// the customer's other visits (tap = pick), device lists, device data (sensorMeta, 241 rows for a radar store). The lists and
// the device data hang off the project's META-OWNER task (the first visit - core/jobs metaOwnerOf), not every night.
// A LEDGER ROW: its form (txform.js). Last tap wins - the Photos rule. Sections remember open / closed in the browser.
import { loadJobs, loadJob, saveJob, metaOwnerOf, deviceLists, sensorRows, invoiceOf, visitsOfCustomer, fmtDate, fmtTime, fmtHours } from "../../core/jobs.js";
import { money2 } from "../../core/ledger.js";
import { drawTxForm } from "./txform.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const F = [["customerName", "Customer", "text"], ["customerPhone", "Phone", "tel"], ["customerEmail", "Email", "email"], ["customerAddress", "Address", "text"], ["project", "Project", "text"], ["workOrder", "WO", "text"], ["status", "Status", "text"]];
const okey = s => "lv_det_" + s, isOpen = s => { try { return localStorage.getItem(okey(s)) === "1"; } catch (_) { return false; } };
const sec = (key, label, inner) => `<details class="lv-sec" data-sec="${key}"${isOpen(key) ? " open" : ""}><summary>${label}</summary><div class="lv-secb">${inner}</div></details>`;
const fill = (host, key, label, inner) => { const d = host.querySelector(`[data-sec="${key}"]`); if (!d) return; d.querySelector("summary").innerHTML = label; d.querySelector(".lv-secb").innerHTML = inner; };

// FULL SCREEN = the app itself (L 2026-10-04): the board frames this page for what is picked
const APP = "https://luissolutions.us/apps/online/";
export const appUrl = store => { const id = store.get("visitId"); return id ? APP + "onlinejob.html?task=" + encodeURIComponent(id) : APP + "onlinejob.html"; };   // the Jobs app, on the picked visit
export const title = "Details";
export const sub = ["visitId", "visitSaved", "tx", "photoPick"];
export const pub = ["visitSaved", "ledgerSaved", "visitId", "photoPick"];
export function mount(body, { store, tile }) {
  let stops = [], run = 0, picked = "";
  // ROW TAP (L "when I click a device list or device data item and it has a picture, use the Photos tile"): a device-list row
  // or a sensor row sets `photoPick` for the Photos tile; the same row again clears it. The tapped row is marked.
  body.addEventListener("click", e => { const cell = e.target.closest("[data-dev],[data-sen]"); if (!cell) return; const key = cell.dataset.dev ? "dev:" + cell.dataset.dev : "sen:" + cell.dataset.sen;
    body.querySelectorAll(".lv-tbl .on").forEach(x => x.classList.remove("on"));
    if (picked === key) { picked = ""; store.set("photoPick", null); return; }
    picked = key; const sel = cell.dataset.dev ? `[data-dev="${CSS.escape(cell.dataset.dev)}"]` : `[data-sen="${CSS.escape(cell.dataset.sen)}"]`; body.querySelectorAll(sel).forEach(x => x.classList.add("on"));
    store.set("photoPick", cell.dataset.dev ? { kind: "device", listId: cell.dataset.list, rowId: cell.dataset.row, label: cell.dataset.label } : { kind: "sensor", num: cell.dataset.sen, serial: cell.dataset.serial || "", label: cell.dataset.label, listId: cell.dataset.list || "", rowId: cell.dataset.row || "" }); });
  const kv = (k, v) => v ? `<b>${k}</b><span>${v}</span>` : "";
  const wireSecs = () => body.querySelectorAll("details.lv-sec").forEach(d => d.addEventListener("toggle", () => { try { localStorage.setItem(okey(d.dataset.sec), d.open ? "1" : "0"); } catch (_) {} }));
  // SIZE-AWARE (L 2026-10-04 "a more detailed view when I make them bigger"): a tall tile (>= 640 px of body) opens every section
  // the person has not closed themselves; shrinking it back closes those again. The user's own open / closed choices win.
  let tallOpen = false;
  const fitSections = () => { const tall = body.clientHeight >= 640; if (tall === tallOpen) return; tallOpen = tall;
    body.querySelectorAll("details.lv-sec").forEach(d => { let saved = null; try { saved = localStorage.getItem(okey(d.dataset.sec)); } catch (_) {} if (saved != null) return; d.open = tall; }); };
  const ro = new ResizeObserver(fitSections); ro.observe(body);

  const drawVisit = async () => {
    const id = store.get("visitId"), my = ++run; if (!id) { body.innerHTML = `<div class="lv-empty">Pick a visit, or tap a row in the Ledger.</div>`; tile.setTitle("Details"); return; }
    const base = store.get("base");
    let j = store.get("visit"); if (!j || j.id !== id) { try { j = await loadJob(base, id); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; } }
    if (!j || my !== run) return; const raw = j.raw || {};
    tile.setTitle(`Details · ${raw.customerName || j.customer}`);
    const tel = String(raw.customerPhone || "").replace(/[^\d+]/g, ""), mail = String(raw.customerEmail || "").trim(), addr = String(raw.customerAddress || "").trim();
    const segs = (Array.isArray(raw.segments) ? raw.segments : []).filter(s => s && s.startTime), inv = invoiceOf(j);
    const days = Object.entries(raw.tasks || {}).filter(([, d]) => d && typeof d === "object").sort((a, b) => a[0] < b[0] ? 1 : -1);
    const imgsOf = r => Array.isArray(r?.images) ? r.images : Object.values(r?.images || {});
    const link = `https://luissolutions.us/apps/online/onlinedetails.html?task=${encodeURIComponent(j.id)}`;
    // THE REST OF THE RECORD (L 2026-10-04 "is there any data we have not been shown?"): GPS where the visit started, vehicle,
    // manager, last photo, QC upload, site-map hubs, updated; comments / links / notes history / QC checklists as sections
    const gps = raw.location && raw.location.latitude && raw.location.longitude ? `${raw.location.latitude},${raw.location.longitude}` : "";
    const comments = Object.entries(raw.comments || {}).filter(([, t]) => typeof t === "string" && t.trim()).sort((a, b) => Number(b[0]) - Number(a[0]));
    const links = (Array.isArray(raw.links) ? raw.links : Object.values(raw.links || {})).filter(l => l && l.url);
    const history = Object.entries(raw.notesHistory || {}).filter(([, t]) => typeof t === "string" && t.trim()).sort((a, b) => Number(b[0]) - Number(a[0]));
    const qcText = s => { const items = Array.isArray(s.items) ? s.items : []; if (!items.length) return s.selected != null ? `selected ${s.selected}` : JSON.stringify(s).slice(0, 80);
      return items.map(it => `${it.label}: ${Array.isArray(it.days) ? `${it.days.filter(Boolean).length}/${it.days.length} days` : it.checked != null ? (it.checked ? "✓" : "–") : (it.value ?? "")}`).join(" · "); };
    const qc = ["radar", "audit", "remote"].map(kind => raw["qcData_" + kind]).map((q, i) => q && q.sections ? { kind: ["radar", "audit", "remote"][i], sections: Object.entries(q.sections).map(([key, s]) => ({ key, text: qcText(s || {}) })) } : null).filter(Boolean);
    // EDITABLE TIMES (L 2026-10-04 "I need a way to edit the times on the Details tile"): one row per segment - work / travel,
    // start, end (datetime-local in the phone's zone, saved as ISO UTC like onlinejob), ✕; "+ segment" adds one. Save writes
    // segments + startTime (earliest) + endTime (latest) - segments own WHEN, hours come from them.
    const toLocal = iso => { const d = iso ? new Date(iso) : null; if (!d || isNaN(d)) return ""; const p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
    const segRow = s => `<div class="lv-seg"><div class="lv-seg-h"><select name="segtype"><option value="work"${(s.type || "work") === "work" ? " selected" : ""}>work</option><option value="travel"${s.type === "travel" ? " selected" : ""}>travel</option></select><span class="lv-note" style="margin:0;flex:1">start → end</span><button type="button" class="lv-btn ico" data-delseg title="remove this segment">✕</button></div><div class="lv-two"><input type="datetime-local" name="segstart" step="900" value="${toLocal(s.startTime)}"><input type="datetime-local" name="segend" step="900" value="${toLocal(s.endTime)}"></div></div>`;
    const pair = (a, b) => `<div class="lv-two">${a}${b}</div>`, inp = ([k, label, type]) => `<label><b>${label}</b><input name="${k}" type="${type}" value="${esc(raw[k] || "")}" autocomplete="off"></label>`;
    body.innerHTML = `<form class="lv-form lv-det">
        ${pair(inp(F[0]), inp(F[1]))}${pair(inp(F[2]), inp(F[3]))}${pair(inp(F[4]), inp(F[5]))}
        ${pair(inp(F[6]), `<label><b>Date</b><span class="lv-ro">${fmtDate(j.start)} ${fmtTime(j.start)}${j.end ? " → " + fmtTime(j.end) : ""}</span></label>`)}
        <label><b>Notes</b><textarea name="notes" rows="4">${esc(j.notes)}</textarea></label>
        <div class="lv-h" style="display:flex;align-items:center;gap:8px">Times<span style="flex:1"></span><button type="button" class="lv-btn" data-addseg>+ segment</button></div>
        <div class="lv-segs">${(segs.length ? segs : []).map(s => segRow(s)).join("")}</div>
        ${!segs.length ? `<div class="lv-note">no segments - the job runs ${fmtTime(j.start)}${j.end ? " → " + fmtTime(j.end) : ""}; add one to set times</div>` : ""}
        <div class="lv-kv">${kv("Hours", `${fmtHours(j.hours)}${j.travel ? ` (travel ${fmtHours(j.travel)})` : ""}`)}${raw.startOdometer ? kv("Odometer", `${esc(raw.startOdometer)} → ${esc(raw.endOdometer || "")}`) : ""}${raw.sensorCount ? kv("Sensors", esc(raw.sensorCount)) : ""}${raw.deviceCount ? kv("Devices", esc(raw.deviceCount)) : ""}${raw.vehicle ? kv("Vehicle", esc(raw.vehicle)) : ""}${raw.managerName ? kv("Manager", esc(raw.managerName)) : ""}${raw.photosAt?.name ? kv("Last photo", `${esc(raw.photosAt.name)}${raw.photosAt.sub ? " · " + esc(raw.photosAt.sub) : ""} · ${fmtDate(raw.photosAt.at)}`) : ""}${raw.lastUploadedQC ? kv("QC uploaded", esc(raw.lastUploadedQC)) : ""}${raw.siteTables?.hubs ? kv("Site map", `${Object.keys(raw.siteTables.hubs).length} hubs placed`) : ""}${(raw.updatedAt || raw.meta?.updatedAt) ? kv("Updated", fmtDate(raw.updatedAt || raw.meta.updatedAt) + " " + fmtTime(raw.updatedAt || raw.meta.updatedAt)) : ""}</div>
        ${segs.length ? `<div class="lv-note">${segs.map(s => `${esc(s.type || "work")} ${fmtTime(s.startTime)}–${s.endTime ? fmtTime(s.endTime) : "…"}`).join(" · ")}</div>` : ""}
        <div class="lv-chips">${tel ? `<a class="lv-btn" href="tel:${esc(tel)}">📞 call</a><a class="lv-btn" href="sms:${esc(tel)}">💬 text</a>` : ""}${mail ? `<a class="lv-btn" href="mailto:${esc(mail)}">✉️ email</a>` : ""}${addr ? `<a class="lv-btn" href="https://maps.google.com/?q=${encodeURIComponent(addr)}" target="_blank" rel="noopener">🗺 map</a>` : ""}${gps ? `<a class="lv-btn" href="https://maps.google.com/?q=${esc(gps)}" target="_blank" rel="noopener" title="where the visit was started (${esc(gps)})">📍 GPS</a>` : ""}<a class="lv-btn" href="${link}" target="_blank" rel="noopener">Details app ↗</a></div>
        <div class="lv-actions"><span class="lv-muted st"></span><button type="submit" class="lv-btn primary">Save</button></div>
      </form>
      ${comments.length ? sec("comments", `Comments · ${comments.length}`, `<div class="lv-kv">${comments.map(([ts, t]) => `<b>${esc(fmtDate(Number(ts)))}</b><span style="white-space:pre-wrap">${esc(t)}</span>`).join("")}</div>`) : ""}
      ${links.length ? sec("links", `Links · ${links.length}`, `<div class="lv-rows">${links.map(l => `<a class="lv-row" href="${esc(l.url)}" target="_blank" rel="noopener"><div><div class="n">${esc(l.title || l.url)}</div><div class="s">${esc(String(l.url).replace(/^https?:\/\//, "").slice(0, 60))}</div></div><div class="v">↗</div></a>`).join("")}</div>`) : ""}
      ${history.length ? sec("history", `Notes history · ${history.length}`, `<div class="lv-kv">${history.map(([ts, t]) => `<b>${esc(fmtDate(Number(ts)))} ${esc(fmtTime(Number(ts)))}</b><span style="white-space:pre-wrap">${esc(String(t).slice(0, 600))}</span>`).join("")}</div>`) : ""}
      ${qc.length ? sec("qc", `QC data · ${qc.map(q => q.kind).join(", ")}`, qc.map(q => `<div class="lv-h">${esc(q.kind)}</div><div class="lv-kv">${q.sections.map(s => `<b>${esc(s.key)}</b><span>${esc(s.text)}</span>`).join("")}</div>`).join("")) : ""}
      ${inv ? sec("invoice", `Invoice · ${esc(inv.type)} · ${money2.format(Number(inv.total) || 0)} · ${inv.paid ? "paid" : "unpaid"}`, `<div class="lv-kv">${kv("Date", esc(inv.date))}${kv("Labor", inv.labor.length ? `${inv.labor.length} line${inv.labor.length === 1 ? "" : "s"}` : "")}${kv("Parts", inv.parts.length ? inv.parts.map(p => `${esc(p.part)} × ${esc(p.quantity)}`).join(", ") : "")}${kv("Subtotal", inv.subtotal != null ? money2.format(Number(inv.subtotal) || 0) : "")}${kv("Tax", inv.tax != null ? money2.format(Number(inv.tax) || 0) : "")}${kv("Total", money2.format(Number(inv.total) || 0))}${kv("Paid", inv.paid ? `${money2.format(Number(inv.amountPaid ?? inv.total) || 0)}${inv.paidDate ? " · " + esc(inv.paidDate) : ""}` : "")}</div>`) : ""}
      ${days.length ? sec("daily", `Daily entries · ${days.length}`, `<div class="lv-kv">${days.map(([date, d]) => `<b>${esc(date)}</b><span>${esc(String(d.notes || d.note || "").slice(0, 160))}${imgsOf(d).length ? ` · 📷${imgsOf(d).length}` : ""}</span>`).join("")}</div>`) : ""}
      ${sec("others", "Other jobs", `<div class="lv-note">loading…</div>`)}
      ${sec("lists", "Devices", `<div class="lv-note">loading…</div>`)}`;   // ONE Devices section (L 2026-10-04 "still seeing both devices"): the sensors ARE a device list now
    wireSecs(); tallOpen = false; fitSections();
    // edit in place: the same keys onlinejob / onlinecontacts write (core/jobs.saveJob allows exactly these + notes)
    const f = body.querySelector("form.lv-det"), st = f.querySelector(".st"); f.addEventListener("input", () => { st.textContent = "unsaved"; });
    const segsEl = f.querySelector(".lv-segs");
    f.querySelector("[data-addseg]").onclick = () => { const last = [...segsEl.querySelectorAll(".lv-seg input[name=segend]")].map(i => i.value).filter(Boolean).pop(); segsEl.insertAdjacentHTML("beforeend", segRow({ type: "work", startTime: last ? new Date(last).toISOString() : (j.end || j.start ? new Date(j.end || j.start).toISOString() : ""), endTime: "" })); st.textContent = "unsaved"; };
    segsEl.addEventListener("click", e => { const b = e.target.closest("[data-delseg]"); if (b) { b.closest(".lv-seg").remove(); st.textContent = "unsaved"; } });
    f.onsubmit = async e => { e.preventDefault(); const patch = {}; for (const [k] of F) patch[k] = f[k].value.trim(); patch.notes = f.notes.value; st.textContent = "saving…";
      const segList = [...segsEl.querySelectorAll(".lv-seg")].map(el => ({ type: el.querySelector("[name=segtype]").value, startTime: el.querySelector("[name=segstart]").value ? new Date(el.querySelector("[name=segstart]").value).toISOString() : null, endTime: el.querySelector("[name=segend]").value ? new Date(el.querySelector("[name=segend]").value).toISOString() : null })).filter(s => s.startTime).sort((a, b) => a.startTime < b.startTime ? -1 : 1);
      if (segList.some(s => s.endTime && s.endTime < s.startTime)) { st.textContent = "a segment ends before it starts"; return; }
      if (segList.length || segs.length) { patch.segments = segList; if (segList.length) { patch.startTime = segList[0].startTime; const ends = segList.map(s => s.endTime).filter(Boolean); patch.endTime = ends.length === segList.length ? ends.sort().pop() : null; } }
      try { const fresh = await saveJob(base, j.id, patch); st.textContent = "saved"; if (fresh) { store.set("visit", fresh); tile.setTitle(`Details · ${fresh.customer}`); } store.set("visitSaved", { id: j.id, at: Date.now(), by: "details" }); }
      catch (x) { st.textContent = "not saved: " + (x.code || x.message); } };
    // the rest needs the whole tasks node - ONE read, shared by "other visits" and the meta-owner lookup
    let jobs = []; try { jobs = await loadJobs(base); } catch (e) { if (my === run) fill(body, "lists", "Devices", `<div class="lv-err">${esc(e.message || e)}</div>`); return; }
    if (my !== run) return;
    const others = await visitsOfCustomer(base, raw.customerName || j.customer, j.id, jobs);
    fill(body, "others", `Other jobs · ${others.length}`, others.length ? `<div class="lv-rows">${others.slice(0, 30).map(v => `<div class="lv-row" data-id="${esc(v.id)}"><div><div class="n">${esc(v.project || v.wo || "visit")}</div><div class="s">${fmtDate(v.start)}${v.hours ? " · " + v.hours + " h" : ""}</div></div></div>`).join("")}</div>` : `<div class="lv-note">none</div>`);
    body.querySelectorAll('[data-sec="others"] [data-id]').forEach(r => r.onclick = () => { store.set("tx", null); store.set("visitId", r.dataset.id); });
    const owner = await metaOwnerOf(base, j, jobs), lists = deviceLists(owner), sensors = sensorRows(owner), nList = lists.reduce((t, l) => t + l.rows.length, 0);
    const from = owner.id !== j.id ? `<div class="lv-note">project record from the first job, ${esc(fmtDate(owner.start))}</div>` : "";
    const listsHtml = lists.map(l => `<div class="lv-h">${esc(l.name)} · ${l.rows.length}${l.rows.some(r => r.counted) ? ` · ${l.rows.filter(r => r.counted).length} counted` : ""}</div>
        <div class="lv-tbl"><b>ID</b><b>Serial</b><b>Model</b><b>Status</b>${l.rows.map(r => { const a = `class="tap" data-dev="${esc(l.listId + "|" + r.rowId)}" data-list="${esc(l.listId)}" data-row="${esc(r.rowId)}" data-label="${esc((l.name ? l.name + " · " : "") + (r.id || r.serial || r.rowId))}" title="tap = its photos in the Photos tile"`;
          const extra = [r.location && "📍 " + r.location, r.ip && "IP " + r.ip, r.mac && "MAC " + r.mac, r.notes].filter(Boolean).join(" · ");   // the row's other fields (L "any data not shown?")
          return `<span ${a}>${r.counted ? "✓ " : ""}${esc(r.id)}</span><span ${a}>${esc(r.serial)}</span><span ${a}>${esc(r.model || r.type)}</span><span ${a}>${esc(r.status)}${r.photos ? ` · 📷${r.photos}` : ""}</span>${extra ? `<span class="lv-rowsub" ${a}>${esc(extra)}</span>` : ""}`; }).join("")}</div>`).join("");
    const flags = r => `${r.labeled ? " 🏷" : ""}${r.run ? " ▶" : ""}${r.placed ? " 📍" : ""}`;
    const sum = [sensors.filter(r => r.labeled).length && `${sensors.filter(r => r.labeled).length} labeled`, sensors.filter(r => r.run).length && `${sensors.filter(r => r.run).length} run`, sensors.filter(r => r.placed).length && `${sensors.filter(r => r.placed).length} on map`].filter(Boolean);
    // DEVICE DATA + a search box (L 2026-10-04 "add a search filter for device data"): #, serial, the three infos and the words
    // labeled / run / map all match; the summary counts "12 of 241"; the tapped row keeps its mark through a re-filter
    const senTable = rows => `<div class="lv-tbl five"><b>#</b><b>Serial</b><b>Info 1</b><b>Info 2</b><b>Info 3</b>${rows.map(r => { const a = `class="tap${picked === "sen:" + r.num ? " on" : ""}" data-sen="${esc(r.num)}" data-serial="${esc(r.serial)}"${r.rowId ? ` data-list="${esc(r.listId)}" data-row="${esc(r.rowId)}"` : ""} data-label="${esc("Sensor " + r.num + (r.serial ? " · " + r.serial : ""))}" title="tap = its photos in the Photos tile"`;
        return `<span ${a}>${esc(r.num)}${flags(r)}</span><span ${a}>${esc(r.serial)}</span><span ${a}>${esc(r.m1)}</span><span ${a}>${esc(r.m2)}</span><span ${a}>${esc(r.m3)}</span>`; }).join("")}</div>`;
    const senLabel = n => `Sensors · ${n == null ? sensors.length : `${n} of ${sensors.length}`}${sum.length ? " · " + sum.join(", ") : ""}`;
    const senHtml = sensors.length ? `<div class="lv-h lv-senh">${senLabel()}</div><input class="lv-search" type="search" placeholder="Search sensors - #, serial, X / Y / Z, labeled / run / map" autocomplete="off"><div class="lv-senrows">${senTable(sensors)}</div>` : "";
    fill(body, "lists", `Devices · ${nList + sensors.length}`, (nList || sensors.length) ? from + listsHtml + senHtml : `<div class="lv-note">none on this project</div>`);
    const senEl = body.querySelector('[data-sec="lists"]'), senQ = senEl?.querySelector(".lv-search"), senHost = senEl?.querySelector(".lv-senrows");
    if (senQ) senQ.addEventListener("input", () => { const t = senQ.value.trim().toLowerCase();
      const hit = !t ? sensors : sensors.filter(r => `${r.num} ${r.serial} ${r.m1} ${r.m2} ${r.m3}${r.labeled ? " labeled" : ""}${r.run ? " run" : ""}${r.placed ? " map placed" : ""}`.toLowerCase().includes(t));
      senHost.innerHTML = senTable(hit); senEl.querySelector(".lv-senh").innerHTML = senLabel(t ? hit.length : null); });
  };
  const drawTx = () => { ++run; drawTxForm(body, { store, tile, title: "Details" }); };
  // last tap wins: a ledger row -> its form; a visit -> the visit; a cleared row falls back to the visit
  stops.push(store.on("tx", tx => tx ? drawTx() : drawVisit()), store.on("visitId", drawVisit), store.on("base", () => store.get("tx") ? drawTx() : drawVisit()),
    store.on("visitSaved", s => { if (s && s.by !== "details" && s.id === store.get("visitId") && !store.get("tx")) drawVisit(); }),
    store.on("photoPick", v => { if (!v) { picked = ""; body.querySelectorAll(".lv-tbl .on").forEach(x => x.classList.remove("on")); } }));   // the Photos "✕" chip clears the mark here too
  if (store.get("tx") && !store.get("visitId")) drawTx(); else drawVisit();
  return { destroy: () => { stops.forEach(s => s()); ro.disconnect(); } };
}
