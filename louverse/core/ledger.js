// core/ledger.js - the LEDGER domain: one reader for {base}/money/ledger/{year} (the same rows budget, financials,
// analytics and the galaxy read), the taxonomy rules beside it. No HTML in here.
import { readOnce, database, ref, update } from "./firebase.js";
import { normTag, parentTag, tagLabel, isSpendingTag, SPENDING_TAGS } from "./taxonomy.js";
export { normTag, parentTag, tagLabel, isSpendingTag, SPENDING_TAGS };

export const ledgerPath = (base, year) => `${base}/money/ledger/${year}`;
export const parseDate = d => { if (d == null) return null; const n = Number(d); if (Number.isFinite(n) && n > 1e11) return new Date(n);
  const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)) : null; };
export const toMoney = v => { const n = Number(String(v ?? "").replace(/[^0-9.\-]/g, "")); return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0; };

const cache = new Map();   // "base|year" -> rows
export async function loadLedgerYear(base, year, { fresh = false } = {}) {
  const key = `${base}|${year}`; if (!fresh && cache.has(key)) return cache.get(key);
  const all = (await readOnce(ledgerPath(base, year))) || {}, rows = [];
  for (const [id, r] of Object.entries(all)) {
    if (!r || typeof r !== "object") continue; const dt = parseDate(r.date); if (!dt) continue;
    const raw = Array.isArray(r.tags) ? r.tags.map(t => String(t).trim()).filter(Boolean) : [];
    rows.push({ id, dt, amt: Math.abs(toMoney(r.amt ?? r.amount ?? 0)), name: String(r.name || "").trim(), type: r.type === "income" ? "income" : "expense",
      tags: raw.map(normTag), tag: raw.map(parentTag).find(t => isSpendingTag(t)) || "", sub: r.sub || "", cat: r.cat || "",
      img: typeof r.img === "string" && /^https?:/.test(r.img) ? r.img : "", imgPath: r.imgPath || "", desc: r.desc || "", link: r.link || "" });   // the receipt photo rides along (Photos tile follows a picked row)
  }
  rows.sort((a, b) => b.dt - a.dt); cache.set(key, rows); return rows;
}
// the receipt on a row (the finance apps' two fields); the cached row is patched so every tile holding it sees the change
export async function setRowImage(base, year, id, { url = "", path = "" } = {}) {
  await update(ref(database, `${ledgerPath(base, year)}/${id}`), { img: url || "", imgPath: path || "" });
  return patchCachedRow(base, year, id, { img: url || "", imgPath: path || "" });
}
export function patchCachedRow(base, year, id, patch) { const rows = cache.get(`${base}|${year}`), r = rows && rows.find(x => x.id === id); if (r) Object.assign(r, patch); return r || null; }
export function totalsByTag(rows) {
  const m = new Map(); let income = 0, spent = 0;
  for (const r of rows) { if (r.type === "income") { income += r.amt; continue; } spent += r.amt; const t = r.tag || "(untagged)"; m.set(t, (m.get(t) || 0) + r.amt); }
  return { income, spent, tags: [...m.entries()].sort((a, b) => b[1] - a[1]) };
}
export const money = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const money2 = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });
