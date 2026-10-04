// tiles/analytics.js - the year at a glance, TWO FACES (L 2026-10-04 "Analytics could have two things, the budget and the
// other one for jobs, based on what's selected parent"): the MONEY face (spend by month, income vs spend, the categories -
// pure view over core/ledger) when the last tap was a ledger row or the year, the VISITS face (hours by month, work vs
// travel, the customers by hours) when the last tap was a visit. Last tap wins, the Photos rule.
import { loadLedgerYear, totalsByTag, tagLabel, money } from "../../core/ledger.js";
import { loadJobs, fmtDate, fmtHours } from "../../core/jobs.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// FULL SCREEN = the app itself (L 2026-10-04): the board frames this page for what is picked
const APP = "https://luissolutions.us/apps/online/";
let lastMode = "money";
export const appUrl = () => APP + (lastMode === "jobs" ? "onlineanalytics.html" : "onlinebudget.html");   // the Invoice Analytics app for the visits face, the Budget Planner for money (L: "I was talking onlineanalytics.html")
export const title = "Analytics";
export const sub = ["year", "ledgerSaved", "visitId", "tx", "visitSaved"];
export const pub = ["tx", "visitId"];   // a row in the month panel picks it, like the Ledger / Visits tiles do
// DRILL-DOWN (L 2026-10-04 "can the analytics show more info, like click each month to show data"): tap a month bar -> that
// month's rows (newest first) with its totals, tap a category / customer -> only those rows in the month (or the whole year
// when no month is picked); tap a row -> it becomes the picked ledger row / visit (Details / Photos follow). ✕ closes.
export function mount(body, { store, tile }) {
  let stops = [], month = null, tag = "", rows = [], jobs = [], mode = "money", run = 0;
  const monthOf = r => mode === "jobs" ? new Date(r.start).getMonth() : r.dt.getUTCMonth();
  const drawPanel = () => {
    const host = body.querySelector(".lv-drill"); if (!host) return;
    if (month == null && !tag) { host.innerHTML = ""; return; }
    if (mode === "jobs") {
      const list = jobs.filter(j => (month == null || monthOf(j) === month) && (!tag || j.customer === tag)).sort((a, b) => b.start - a.start);
      const h = list.reduce((s, j) => s + j.hours, 0), tr = list.reduce((s, j) => s + j.travel, 0);
      host.innerHTML = `<div class="lv-h" style="display:flex;align-items:center;gap:8px">${month != null ? MON[month] : "all year"}${tag ? " · " + esc(tag) : ""} · ${list.length} visit${list.length === 1 ? "" : "s"}<span style="flex:1"></span><button type="button" class="lv-btn ico" data-close title="close">✕</button></div>
        <div class="lv-tot"><span>hours <b>${fmtHours(h)}</b></span>${tr ? `<span>travel <b>${fmtHours(tr)}</b></span>` : ""}<span>avg <b>${fmtHours(list.length ? h / list.length : 0)}</b>/visit</span></div>
        ${list.length ? `<div class="lv-rows">${list.slice(0, 150).map(j => `<div class="lv-row" data-id="${esc(j.id)}"><div><div class="n">${esc(j.customer)}</div><div class="s">${esc([j.project, j.wo].filter(Boolean).join(" · "))} ${fmtDate(j.start)}</div></div><div class="v">${fmtHours(j.hours)}</div></div>`).join("")}${list.length > 150 ? `<div class="lv-note">showing 150 of ${list.length}</div>` : ""}</div>` : `<div class="lv-empty">nothing here</div>`}`;
      host.querySelector("[data-close]").onclick = () => { month = null; tag = ""; body.querySelectorAll(".lv-bars .col.on, .lv-cats .on").forEach(x => x.classList.remove("on")); drawPanel(); };
      host.querySelectorAll(".lv-row[data-id]").forEach(el => el.onclick = () => { const j = jobs.find(x => x.id === el.dataset.id); if (j) { store.set("tx", null); store.set("visit", j); store.set("visitId", j.id); } });
      return;
    }
    const list = rows.filter(r => (month == null || monthOf(r) === month) && (!tag || (tag === "(untagged)" ? (!r.tag && r.type !== "income") : (r.tags || []).includes(tag)))).sort((a, b) => b.dt - a.dt);   // "(untagged)" is totalsByTag's bucket for tag-less spending, not a tag on a row (L 2026-10-04)
    const sp = list.filter(r => r.type !== "income").reduce((s, r) => s + r.amt, 0), inc = list.filter(r => r.type === "income").reduce((s, r) => s + r.amt, 0);
    host.innerHTML = `<div class="lv-h" style="display:flex;align-items:center;gap:8px">${month != null ? MON[month] : "all year"}${tag ? " · " + esc(tag) + " " + esc(tagLabel(tag)) : ""} · ${list.length} row${list.length === 1 ? "" : "s"}<span style="flex:1"></span><button type="button" class="lv-btn ico" data-close title="close">✕</button></div>
      <div class="lv-tot"><span>spent <b>${money.format(sp)}</b></span>${inc ? `<span>income <b>${money.format(inc)}</b></span><span>net <b class="${inc - sp >= 0 ? "ok" : "bad"}">${money.format(inc - sp)}</b></span>` : ""}</div>
      ${list.length ? `<div class="lv-rows">${list.slice(0, 150).map(r => `<div class="lv-row" data-id="${esc(r.id)}"><div><div class="n">${r.img ? "📎 " : ""}${esc(r.name)}</div><div class="s">${r.dt.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })}${(r.tags || []).length ? " · " + esc((r.tags || []).join(" ")) : ""}${r.sub ? " · " + esc(r.sub) : ""}</div></div><div class="v">${r.type === "income" ? "+" : ""}${money.format(r.amt)}</div></div>`).join("")}${list.length > 150 ? `<div class="lv-note">showing 150 of ${list.length}</div>` : ""}</div>` : `<div class="lv-empty">nothing here</div>`}`;
    host.querySelector("[data-close]").onclick = () => { month = null; tag = ""; body.querySelectorAll(".lv-bars .col.on, .lv-cats .on").forEach(x => x.classList.remove("on")); drawPanel(); };
    host.querySelectorAll(".lv-row[data-id]").forEach(el => el.onclick = () => { const r = rows.find(x => x.id === el.dataset.id); if (r) store.set("tx", { ...r, year: store.get("year") }); });
  };
  const wire = () => {
    body.querySelectorAll(".lv-bars .col").forEach(c => c.onclick = () => { const m = Number(c.dataset.m); month = month === m ? null : m; body.querySelectorAll(".lv-bars .col").forEach(x => x.classList.toggle("on", Number(x.dataset.m) === month)); drawPanel(); });
    body.querySelectorAll(".lv-cats .lv-row").forEach(c => c.onclick = () => { tag = tag === c.dataset.tag ? "" : c.dataset.tag; body.querySelectorAll(".lv-cats .lv-row").forEach(x => x.classList.toggle("on", x.dataset.tag === tag)); drawPanel(); });
    drawPanel();
  };
  // THE VISITS FACE: hours by month (work accent, travel muted), totals, the customers by hours; the picked visit's customer is marked
  const drawJobs = async () => {
    const year = Number(store.get("year")) || 0, base = store.get("base"), my = ++run; tile.setTitle(`Analytics · jobs ${year}`); body.innerHTML = `<div class="lv-empty">loading…</div>`;
    let all = []; try { all = await loadJobs(base); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; }
    if (my !== run) return;
    jobs = all.filter(j => !year || new Date(j.start).getFullYear() === year);
    if (!jobs.length) { body.innerHTML = `<div class="lv-empty">No jobs in ${year}.</div>`; return; }
    const work = Array(12).fill(0), trav = Array(12).fill(0); for (const j of jobs) { const m = monthOf(j); work[m] += j.hours; trav[m] += j.travel; }
    const H = jobs.reduce((s, j) => s + j.hours, 0), TR = jobs.reduce((s, j) => s + j.travel, 0), max = Math.max(1, ...work.map((w, i) => w + trav[i]));
    const byCust = [...jobs.reduce((m, j) => m.set(j.customer, (m.get(j.customer) || 0) + j.hours), new Map()).entries()].sort((a, b) => b[1] - a[1]);
    const picked = store.get("visit"), pickedCust = picked && store.get("visitId") ? picked.customer : "";
    body.innerHTML = `<div class="lv-tot"><span>jobs <b>${jobs.length}</b></span><span>hours <b>${fmtHours(H)}</b></span>${TR ? `<span>travel <b>${fmtHours(TR)}</b></span>` : ""}<span>avg <b>${fmtHours(H / jobs.length)}</b>/visit</span></div>
      <div class="lv-bars">${work.map((v, i) => `<div class="col${month === i ? " on" : ""}" data-m="${i}" title="${MON[i]}: work ${fmtHours(v)} · travel ${fmtHours(trav[i])} · ${jobs.filter(j => monthOf(j) === i).length} visits - tap for the visits"><div class="bar inc" style="height:${Math.round(trav[i] / max * 100)}%"></div><div class="bar sp" style="height:${Math.round(v / max * 100)}%"></div><span>${MON[i]}</span></div>`).join("")}</div>
      <div class="lv-note">bars: work hours (accent) and travel (muted) by month - tap a month or a customer for its jobs${pickedCust ? ` · picked: ${esc(pickedCust)}` : ""}</div>
      <div class="lv-rows lv-cats">${byCust.map(([c, v], i) => `<div class="lv-row${tag === c || (!tag && c === pickedCust) ? " on" : ""}${i >= 8 ? " more" : ""}" data-tag="${esc(c)}"><div><div class="n">${esc(c)}</div><div class="s"><i class="lv-meter" style="width:${Math.round(v / (byCust[0][1] || 1) * 100)}%"></i></div></div><div class="v">${fmtHours(v)} · ${jobs.filter(j => j.customer === c).length}</div></div>`).join("")}</div>
      <div class="lv-drill"></div>`;
    wire();
  };
  const drawMoney = async () => {
    const year = store.get("year"), base = store.get("base"), my = ++run; tile.setTitle(`Analytics · money ${year}`); body.innerHTML = `<div class="lv-empty">loading…</div>`;
    rows = []; try { rows = await loadLedgerYear(base, year); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; }
    if (my !== run) return;
    if (!rows.length) { body.innerHTML = `<div class="lv-empty">No rows this year.</div>`; return; }
    const spend = Array(12).fill(0), inc = Array(12).fill(0);
    for (const r of rows) { const m = r.dt.getUTCMonth(); if (r.type === "income") inc[m] += r.amt; else spend[m] += r.amt; }
    const T = totalsByTag(rows), max = Math.max(1, ...spend, ...inc), months = Math.max(1, rows.filter(r => r.type !== "income").reduce((s, r) => s.add(r.dt.getUTCMonth()), new Set()).size);
    body.innerHTML = `<div class="lv-tot"><span>spent <b>${money.format(T.spent)}</b></span><span>income <b>${money.format(T.income)}</b></span><span>net <b class="${T.income - T.spent >= 0 ? "ok" : "bad"}">${money.format(T.income - T.spent)}</b></span><span>avg <b>${money.format(T.spent / months)}</b>/mo</span></div>
      <div class="lv-bars">${spend.map((v, i) => `<div class="col${month === i ? " on" : ""}" data-m="${i}" title="${MON[i]}: spent ${money.format(v)} · income ${money.format(inc[i])} - tap for the rows"><div class="bar inc" style="height:${Math.round(inc[i] / max * 100)}%"></div><div class="bar sp" style="height:${Math.round(v / max * 100)}%"></div><span>${MON[i]}</span></div>`).join("")}</div>
      <div class="lv-note">bars: spend (accent) and income (muted) by month - tap a month or a category for its rows</div>
      <div class="lv-rows lv-cats">${T.tags.map(([t, v], i) => `<div class="lv-row${tag === t ? " on" : ""}${i >= 8 ? " more" : ""}" data-tag="${esc(t)}"><div><div class="n">${esc(t)} ${esc(tagLabel(t))}</div><div class="s"><i class="lv-meter" style="width:${Math.round(v / (T.tags[0][1] || 1) * 100)}%"></i></div></div><div class="v">${money.format(v)}</div></div>`).join("")}</div>
      <div class="lv-drill"></div>`;
    wire();
  };
  const show = m => { if (m !== mode) { month = null; tag = ""; } mode = m; lastMode = m; return m === "jobs" ? drawJobs() : drawMoney(); };
  const draw = () => show(mode);
  // last tap wins: a visit -> the visits face; a ledger row (or the Year tile) -> the money face
  stops.push(store.on("year", draw), store.on("base", draw), store.on("ledgerSaved", () => { if (mode === "money") drawMoney(); }),
    store.on("visitSaved", () => { if (mode === "jobs") drawJobs(); }),
    store.on("visitId", id => { if (id) show("jobs"); }), store.on("tx", tx => { if (tx) show("money"); }));
  show(store.get("visitId") && !store.get("tx") ? "jobs" : "money");
  return { destroy: () => stops.forEach(s => s()) };
}
