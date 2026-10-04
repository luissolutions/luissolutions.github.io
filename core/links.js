// core/links.js - the SAVED LINKS domain ({base}/links - the onlinelinks app's rows {url, title, categories[]}), no HTML in here.
// A bookmark "on" a visit or a vendor is a link whose categories carry that name (project code, customer, vendor) - the same
// rows the Saved Links app shows under that category, so nothing is duplicated (L 2026-10-04 "apply bookmarks to a job").
import { database, ref, set, update, readOnce } from "./firebase.js";

export const linksPath = base => `${base}/links`;
const norm = s => String(s || "").trim().toLowerCase();

export async function loadLinks(base) {
  const all = (await readOnce(linksPath(base))) || {};
  return Object.entries(all).filter(([, v]) => v && typeof v === "object").map(([id, v]) => ({ id, url: String(v.url || ""), title: String(v.title || v.url || ""),
    categories: Array.isArray(v.categories) ? v.categories.map(String) : v.categories && typeof v.categories === "object" ? Object.values(v.categories).map(String) : [] }));
}
// the links filed under any of these names (case-insensitive) - a visit offers its project, WO and customer; a vendor its name
export const linksFor = (links, names) => { const want = new Set((names || []).map(norm).filter(Boolean)); return want.size ? links.filter(l => l.categories.some(c => want.has(norm(c)))) : []; };

export async function addLink(base, { url, title, categories }) {
  const u = String(url || "").trim(); if (!/^https?:\/\//i.test(u)) throw new Error("a link starts with http:// or https://");
  const id = "bm_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const row = { url: u, title: String(title || "").trim() || u.replace(/^https?:\/\//, "").slice(0, 60), categories: [...new Set((categories || []).map(c => String(c).trim()).filter(Boolean))] };
  await set(ref(database, `${linksPath(base)}/${id}`), row); return { id, ...row };
}
// edit a link in place - url / title / categories (the same three fields the Links app keeps); remove one
export async function saveLink(base, id, patch) {
  const body = {}; if ("url" in patch) { const u = String(patch.url || "").trim(); if (!/^https?:\/\//i.test(u)) throw new Error("a link starts with http:// or https://"); body.url = u; }
  if ("title" in patch) body.title = String(patch.title || "").trim(); if ("categories" in patch) body.categories = [...new Set((patch.categories || []).map(c => String(c).trim()).filter(Boolean))];
  if (!Object.keys(body).length) return null; await update(ref(database, `${linksPath(base)}/${id}`), body); return body;
}
export async function removeLink(base, id) { await set(ref(database, `${linksPath(base)}/${id}`), null); }
// file an existing link under one more name (a bookmark added to a second visit)
export async function tagLink(base, link, name) {
  const cats = [...new Set([...(link.categories || []), String(name).trim()].filter(Boolean))];
  await update(ref(database, `${linksPath(base)}/${link.id}`), { categories: cats }); return { ...link, categories: cats };
}
