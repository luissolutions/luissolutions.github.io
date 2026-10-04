// tiles/notes.js - your notes, edited in place (L 2026-10-03: "the notes app ... able to edit the info"). List on the left,
// the picked note's text on the right, Save writes back through core/notes. A locked note stays locked here - the word
// belongs to the Notes app.
import { loadNotes, saveNote } from "../../core/notes.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export const title = "Notes";
export function mount(body, { store, tile }) {
  body.innerHTML = `<div class="lv-split"><div class="lv-left"><input class="lv-search" type="search" placeholder="Find a note" autocomplete="off"><div class="lv-rows"></div></div><div class="lv-right"><div class="lv-empty">Pick a note.</div></div></div>`;
  const q = body.querySelector("input"), rows = body.querySelector(".lv-rows"), right = body.querySelector(".lv-right");
  let notes = [], sel = null, stops = [];
  const drawList = () => { const t = q.value.trim().toLowerCase(), hit = notes.filter(n => !t || n.name.toLowerCase().includes(t) || (!n.locked && n.text.toLowerCase().includes(t)));
    rows.innerHTML = hit.length ? hit.map(n => `<div class="lv-row${n.id === sel ? " on" : ""}" data-id="${esc(n.id)}"><div><div class="n">${esc(n.name)}</div><div class="s">${n.ts ? new Date(n.ts).toLocaleDateString() : ""}</div></div></div>`).join("") : `<div class="lv-empty">${notes.length ? "no match" : "no notes"}</div>`; };
  const drawNote = () => { const n = notes.find(x => x.id === sel); if (!n) { right.innerHTML = `<div class="lv-empty">Pick a note.</div>`; tile.setTitle("Notes"); return; }
    tile.setTitle(`Notes · ${n.name}`); const canEdit = store.get("base") !== "public" && !n.locked;
    right.innerHTML = n.locked ? `<div class="lv-empty">Locked — open it in the Notes app with its word.</div>`
      : `<form class="lv-form lv-fill"><textarea name="text" ${canEdit ? "" : "readonly"}>${esc(n.text)}</textarea>${canEdit ? `<div class="lv-actions"><span class="lv-muted st"></span><button type="submit" class="lv-btn primary">Save</button></div>` : `<div class="lv-muted" style="font-size:.85rem">Sign in to edit.</div>`}</form>`;
    const form = right.querySelector("form"); if (!form) return; const st = form.querySelector(".st");
    form.addEventListener("input", () => { if (st) st.textContent = "unsaved"; });
    form.onsubmit = async e => { e.preventDefault(); if (!canEdit) return; st.textContent = "saving…";
      try { n.ts = await saveNote(store.get("base"), n.id, form.text.value); n.text = form.text.value; st.textContent = "saved"; drawList(); } catch (x) { st.textContent = "not saved: " + (x.code || x.message); } }; };
  const load = async () => { rows.innerHTML = `<div class="lv-empty">loading…</div>`;
    try { notes = await loadNotes(store.get("base")); } catch (e) { notes = []; rows.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; }
    if (!notes.length && store.get("base") === "public") { rows.innerHTML = `<div class="lv-empty">Sign in to see your notes.</div>`; return; }
    sel = null; drawList(); drawNote(); };
  q.addEventListener("input", drawList);
  rows.addEventListener("click", e => { const r = e.target.closest(".lv-row"); if (!r) return; sel = r.dataset.id; drawList(); drawNote(); });
  stops.push(store.on("base", load)); load();
  return { destroy: () => stops.forEach(s => s()) };
}
