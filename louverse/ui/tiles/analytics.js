// tiles/analytics.js - the year at a glance, redrawn whenever the year (or the ledger) changes: spend by month, income vs
// spend, the top categories. Pure view over core/ledger - the same rows the Ledger tile shows.
import { loadLedgerYear, totalsByTag, tagLabel, money } from "../../core/ledger.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const title = "Analytics";
export const sub = ["year", "ledgerSaved"];
export function mount(body, { store, tile }) {
  let stops = [];
  const draw = async () => {
    const year = store.get("year"), base = store.get("base"); tile.setTitle(`Analytics · ${year}`); body.innerHTML = `<div class="lv-empty">loading…</div>`;
    let rows = []; try { rows = await loadLedgerYear(base, year); } catch (e) { body.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; }
    if (!rows.length) { body.innerHTML = `<div class="lv-empty">${base === "public" ? "Sign in to see your numbers." : "No rows this year."}</div>`; return; }
    const spend = Array(12).fill(0), inc = Array(12).fill(0);
    for (const r of rows) { const m = r.dt.getUTCMonth(); if (r.type === "income") inc[m] += r.amt; else spend[m] += r.amt; }
    const T = totalsByTag(rows), max = Math.max(1, ...spend, ...inc), months = Math.max(1, rows.filter(r => r.type !== "income").reduce((s, r) => s.add(r.dt.getUTCMonth()), new Set()).size);
    body.innerHTML = `<div class="lv-tot"><span>spent <b>${money.format(T.spent)}</b></span><span>income <b>${money.format(T.income)}</b></span><span>net <b class="${T.income - T.spent >= 0 ? "ok" : "bad"}">${money.format(T.income - T.spent)}</b></span><span>avg <b>${money.format(T.spent / months)}</b>/mo</span></div>
      <div class="lv-bars">${spend.map((v, i) => `<div class="col" title="${MON[i]}: spent ${money.format(v)} · income ${money.format(inc[i])}"><div class="bar inc" style="height:${Math.round(inc[i] / max * 100)}%"></div><div class="bar sp" style="height:${Math.round(v / max * 100)}%"></div><span>${MON[i]}</span></div>`).join("")}</div>
      <div class="lv-muted" style="font-size:.78rem;margin:2px 0 8px">bars: spend (accent) and income (muted) by month</div>
      <div class="lv-rows">${T.tags.slice(0, 8).map(([t, v]) => `<div class="lv-row" style="cursor:default"><div><div class="n">${esc(t)} ${esc(tagLabel(t))}</div><div class="s"><i class="lv-meter" style="width:${Math.round(v / (T.tags[0][1] || 1) * 100)}%"></i></div></div><div class="v">${money.format(v)}</div></div>`).join("")}</div>`;
  };
  stops.push(store.on("year", draw), store.on("base", draw), store.on("ledgerSaved", draw)); draw();
  return { destroy: () => stops.forEach(s => s()) };
}
