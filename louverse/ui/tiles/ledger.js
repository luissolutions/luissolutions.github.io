// blocks/ledger.js - the year's ledger: totals by tag, search, rows. Reads the shared store.year so one chip changes every block.
import { loadLedgerYear, totalsByTag, tagLabel, money, money2 } from "../../core/ledger.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const title = "Ledger";
export const sub = ["year", "ledgerSaved"];
export function mount(body, { store, tile }) {
  body.innerHTML = `<div class="lv-tot"></div><div class="tags"></div><input class="lv-search" type="search" placeholder="Search the ledger" autocomplete="off"><div class="lv-rows"></div>`;
  const tot = body.querySelector(".lv-tot"), tags = body.querySelector(".tags"), q = body.querySelector("input"), rows = body.querySelector(".lv-rows");
  let all = [], tag = "", stops = [];
  const draw = () => { const t = q.value.trim().toLowerCase();
    const hit = all.filter(r => (!tag || r.tag === tag) && (!t || `${r.name} ${r.sub} ${r.tags.join(" ")}`.toLowerCase().includes(t))), show = hit.slice(0, 400);
    rows.innerHTML = show.length ? show.map(r => `<div class="lv-row" title="${esc(r.tags.join(" "))}"><div><div class="n">${esc(r.name)}</div><div class="s">${r.dt.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })} ${r.tag ? esc(r.tag) + " " + esc(tagLabel(r.tag)) : ""}${r.sub ? " · " + esc(r.sub) : ""}</div></div><div class="v${r.type === "income" ? " lv-muted" : ""}">${r.type === "income" ? "+" : ""}${money2.format(r.amt)}</div></div>`).join("") + (hit.length > show.length ? `<div class="lv-muted">showing ${show.length} of ${hit.length}</div>` : "")
      : `<div class="lv-empty">${all.length ? "no match" : "no rows"}</div>`; };
  const load = async () => { const year = store.get("year"), base = store.get("base"); tile.setTitle(`Ledger · ${year}`); rows.innerHTML = `<div class="lv-empty">loading…</div>`;
    try { all = await loadLedgerYear(base, year); } catch (e) { all = []; rows.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; }
    if (!all.length && base === "public") { tot.innerHTML = ""; tags.innerHTML = ""; rows.innerHTML = `<div class="lv-empty">Sign in to see your ledger.</div>`; return; }
    const T = totalsByTag(all); tot.innerHTML = `<span>spent <b>${money.format(T.spent)}</b></span><span>income <b>${money.format(T.income)}</b></span><span>${all.length} rows</span>`;
    tags.innerHTML = T.tags.slice(0, 10).map(([t, v]) => `<button type="button" class="lv-chip${t === tag ? " on" : ""}" data-t="${esc(t)}" title="${esc(tagLabel(t))}">${esc(t)} ${money.format(v)}</button>`).join("");
    draw(); };
  tags.addEventListener("click", e => { const b = e.target.closest("[data-t]"); if (!b) return; tag = tag === b.dataset.t ? "" : b.dataset.t; tags.querySelectorAll(".lv-chip").forEach(c => c.classList.toggle("on", c.dataset.t === tag)); draw(); });
  q.addEventListener("input", draw);
  stops.push(store.on("year", load), store.on("base", load)); load();
  return { destroy: () => stops.forEach(s => s()) };
}
