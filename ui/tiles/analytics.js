// tiles/analytics.js - the year at a glance, redrawn whenever the year (or the ledger) changes: spend by month, income vs
// spend, the top categories. Pure view over core/ledger - the same rows the Ledger tile shows.
import { loadLedgerYear, totalsByTag, tagLabel, money } from "../../core/ledger.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const title = "Analytics";
export const sub = ["year", "ledgerSaved"];
export const pub = ["tx"];   // a row in the month panel picks it, like the Ledger does
// DRILL-DOWN (L 2026-10-04 "can the analytics show more info, like click each month to show data"): tap a month bar -> that
// month's rows (newest first) with its spent / income / net, tap a category -> only that tag's rows in the month (or the
// whole year when no month is picked); tap a row -> it becomes the picked ledger row (Details / Photos follow). ✕ closes.
export function mount(body, { store, tile }) {
  let stops = [], month = null, tag = "", rows = [];
  const drawPanel = () => {
    const host = body.querySelector(".lv-drill"); if (!host) return;
    if (month == null && !tag) { host.innerHTML = ""; return; }
    const list = rows.filter(r => (month == null || r.dt.getUTCMonth() === month) && (!tag || (r.tags || []).includes(tag))).sort((a, b) => b.dt - a.dt);
    const sp = list.filter(r => r.type !== "income").reduce((s, r) => s + r.amt, 0), inc = list.filter(r => r.type === "income").reduce((s, r) => s + r.amt, 0);
    host.innerHTML = `<div class="lv-h" style="display:flex;align-items:center;gap:8px">${month != null ? MON[month] : "all year"}${tag ? " · " + esc(tag) + " " + esc(tagLabel(tag)) : ""} · ${list.length} row${list.length === 1 ? "" : "s"}<span style="flex:1"></span><button type="button" class="lv-btn ico" data-close title="close">✕</button></div>
      <div class="lv-tot"><span>spent <b>${money.format(sp)}</b></span>${inc ? `<span>income <b>${money.format(inc)}</b></span><span>net <b class="${inc - sp >= 0 ? "ok" : "bad"}">${money.format(inc - sp)}</b></span>` : ""}</div>
      ${list.length ? `<div class="lv-rows">${list.slice(0, 150).map(r => `<div class="lv-row" data-id="${esc(r.id)}"><div><div class="n">${r.img ? "📎 " : ""}${esc(r.name)}</div><div class="s">${r.dt.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })}${(r.tags || []).length ? " · " + esc((r.tags || []).join(" ")) : ""}${r.sub ? " · " + esc(r.sub) : ""}</div></div><div class="v">${r.type === "income" ? "+" : ""}${money.format(r.amt)}</div></div>`).join("")}${list.length > 150 ? `<div class="lv-note">showing 150 of ${list.length}</div>` : ""}</div>` : `<div class="lv-empty">nothing here</div>`}`;
    host.querySelector("[data-close]").onclick = () => { month = null; tag = ""; body.querySelectorAll(".lv-bars .col.on, .lv-cats .on").forEach(x => x.classList.remove("on")); drawPanel(); };
    host.querySelectorAll(".lv-row[data-id]").forEach(el => el.onclick = () => { const r = rows.find(x => x.id === el.dataset.id); if (r) store.set("tx", { ...r, year: store.get("year") }); });
  };
  const draw = async () => {
    const year = store.get("year"), base = store.get("base"); tile.setTitle(`Analytics · ${year}`); body.innerHTML = `<div class="lv-empty">loading…</div>`;
    rows = []; try { rows = await loadLedgerYear(base, year); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; }
    if (!rows.length) { body.innerHTML = `<div class="lv-empty">No rows this year.</div>`; return; }
    const spend = Array(12).fill(0), inc = Array(12).fill(0);
    for (const r of rows) { const m = r.dt.getUTCMonth(); if (r.type === "income") inc[m] += r.amt; else spend[m] += r.amt; }
    const T = totalsByTag(rows), max = Math.max(1, ...spend, ...inc), months = Math.max(1, rows.filter(r => r.type !== "income").reduce((s, r) => s.add(r.dt.getUTCMonth()), new Set()).size);
    body.innerHTML = `<div class="lv-tot"><span>spent <b>${money.format(T.spent)}</b></span><span>income <b>${money.format(T.income)}</b></span><span>net <b class="${T.income - T.spent >= 0 ? "ok" : "bad"}">${money.format(T.income - T.spent)}</b></span><span>avg <b>${money.format(T.spent / months)}</b>/mo</span></div>
      <div class="lv-bars">${spend.map((v, i) => `<div class="col${month === i ? " on" : ""}" data-m="${i}" title="${MON[i]}: spent ${money.format(v)} · income ${money.format(inc[i])} - tap for the rows"><div class="bar inc" style="height:${Math.round(inc[i] / max * 100)}%"></div><div class="bar sp" style="height:${Math.round(v / max * 100)}%"></div><span>${MON[i]}</span></div>`).join("")}</div>
      <div class="lv-note">bars: spend (accent) and income (muted) by month - tap a month or a category for its rows</div>
      <div class="lv-rows lv-cats">${T.tags.map(([t, v], i) => `<div class="lv-row${tag === t ? " on" : ""}${i >= 8 ? " more" : ""}" data-tag="${esc(t)}"><div><div class="n">${esc(t)} ${esc(tagLabel(t))}</div><div class="s"><i class="lv-meter" style="width:${Math.round(v / (T.tags[0][1] || 1) * 100)}%"></i></div></div><div class="v">${money.format(v)}</div></div>`).join("")}</div>
      <div class="lv-drill"></div>`;
    body.querySelectorAll(".lv-bars .col").forEach(c => c.onclick = () => { const m = Number(c.dataset.m); month = month === m ? null : m; body.querySelectorAll(".lv-bars .col").forEach(x => x.classList.toggle("on", Number(x.dataset.m) === month)); drawPanel(); });
    body.querySelectorAll(".lv-cats .lv-row").forEach(c => c.onclick = () => { tag = tag === c.dataset.tag ? "" : c.dataset.tag; body.querySelectorAll(".lv-cats .lv-row").forEach(x => x.classList.toggle("on", x.dataset.tag === tag)); drawPanel(); });
    drawPanel();
  };
  stops.push(store.on("year", draw), store.on("base", draw), store.on("ledgerSaved", draw)); draw();
  return { destroy: () => stops.forEach(s => s()) };
}
