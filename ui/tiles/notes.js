// tiles/notes.js - your notes, edited in place (L 2026-10-03: "the notes app ... able to edit the info"). List on the left,
// the picked note's text on the right, Save writes back through core/notes. A locked note stays locked here - the word
// belongs to the Notes app.
import { loadNotes, saveNote, createNote, renameNote, deleteNote } from "../../core/notes.js";
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// FULL SCREEN = the app itself (L 2026-10-04): the board frames this page for what is picked
const APP = "https://luissolutions.us/apps/online/";
export const appUrl = () => APP + "onlinenotes.html";
export const title = "Notes";
export const sub = ["year"];   // the Year tile narrows the list to the notes written that year (L 2026-10-04 "even the notes has a reference to the year")
export function mount(body, { store, tile }) {
  body.innerHTML = `<div class="lv-split"><div class="lv-left"><div class="lv-actions" style="gap:6px"><input class="lv-search" type="search" placeholder="Find a note" autocomplete="off" style="flex:1;min-width:0"><button type="button" class="lv-btn new" title="New note">+ New</button></div><div class="lv-rows"></div></div><div class="lv-right"><div class="lv-empty">Pick a note.</div></div></div>`;
  const q = body.querySelector("input"), rows = body.querySelector(".lv-rows"), right = body.querySelector(".lv-right");
  let notes = [], sel = null, stops = [];
  const yearOf = () => Number(store.get("year")) || 0;
  const listTitle = inYear => { const y = yearOf(); tile.setTitle(`Notes${y ? " · " + y : ""} · ${inYear}`); };
  const drawList = () => { const t = q.value.trim().toLowerCase(), y = yearOf();
    const inYear = notes.filter(n => !y || !n.ts || new Date(n.ts).getFullYear() === y), elsewhere = notes.length - inYear.length;   // an undated note always shows
    const hit = inYear.filter(n => !t || n.name.toLowerCase().includes(t) || (!n.locked && n.text.toLowerCase().includes(t)));
    if (!notes.find(x => x.id === sel)) listTitle(inYear.length);
    rows.innerHTML = (hit.length ? hit.map(n => `<div class="lv-row${n.id === sel ? " on" : ""}" data-id="${esc(n.id)}"><div><div class="n">${esc(n.name)}</div><div class="s">${n.ts ? new Date(n.ts).toLocaleDateString() : ""}</div></div></div>`).join("") : `<div class="lv-empty">${notes.length ? (inYear.length ? "no match" : `no notes in ${y}`) : "no notes"}</div>`)
      + (elsewhere > 0 ? `<div class="lv-note">${elsewhere} more in other years - change the Year tile</div>` : ""); };
  const drawNote = () => { const n = notes.find(x => x.id === sel); if (!n) { right.innerHTML = `<div class="lv-empty">Pick a note.</div>`; listTitle(notes.filter(x => !yearOf() || !x.ts || new Date(x.ts).getFullYear() === yearOf()).length); return; }
    tile.setTitle(`Notes · ${n.name}`); const canEdit = !n.locked;   // only the lock (the word) blocks editing, never the account (L 2026-10-04)
    // EDIT BAR (L 2026-10-05 "add some edit option"): rename in place, delete with a confirm - locked notes too (the word
    // only guards the text)
    const bar = `<div class="lv-actions" style="gap:6px;margin-bottom:6px"><input class="nm" value="${esc(n.name)}" aria-label="Note name" style="flex:1;min-width:0;font-weight:600"><button type="button" class="lv-btn ren">Rename</button><button type="button" class="lv-btn del" title="Delete this note">🗑 Delete</button></div>`;
    right.innerHTML = bar + (n.locked ? `<div class="lv-empty">Locked — open it in the Notes app with its word.</div>`
      : `<form class="lv-form lv-fill"><textarea name="text" ${canEdit ? "" : "readonly"}>${esc(n.text)}</textarea>${canEdit ? `<div class="lv-actions"><span class="lv-muted st"></span><button type="submit" class="lv-btn primary">Save</button></div>` : ""}</form>`);
    const nm = right.querySelector(".nm");
    right.querySelector(".ren").onclick = async () => { try { const to = await renameNote(store.get("base"), n.id, nm.value); n.id = to; n.name = to; sel = to; drawList(); drawNote(); } catch (x) { alert(x.message || x); } };
    nm.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); right.querySelector(".ren").click(); } });
    right.querySelector(".del").onclick = async () => { if (!confirm(`Delete the note "${n.name}"?`)) return;
      try { await deleteNote(store.get("base"), n.id); notes = notes.filter(x => x !== n); sel = null; drawList(); drawNote(); } catch (x) { alert(x.message || x); } };
    const form = right.querySelector("form"); if (!form) return; const st = form.querySelector(".st");
    form.addEventListener("input", () => { if (st) st.textContent = "unsaved"; });
    form.onsubmit = async e => { e.preventDefault(); if (!canEdit) return; st.textContent = "saving…";
      try { n.ts = await saveNote(store.get("base"), n.id, form.text.value); n.text = form.text.value; st.textContent = "saved"; drawList(); } catch (x) { st.textContent = "not saved: " + (x.code || x.message); } }; };
  const load = async () => { rows.innerHTML = `<div class="lv-empty">loading…</div>`;
    try { notes = await loadNotes(store.get("base")); } catch (e) { notes = []; rows.innerHTML = `<div class="lv-err">${esc(e.message || e)}</div>`; return; }
    if (!notes.length) { rows.innerHTML = `<div class="lv-empty">No notes yet - + New makes one.</div>`; return; }
    sel = null; drawList(); drawNote(); };
  q.addEventListener("input", drawList);
  body.querySelector(".new").onclick = async () => { const name = (q.value.trim() || prompt("Name for the new note:") || "").trim(); if (!name) return;
    try { const { id, ts } = await createNote(store.get("base"), name); notes.unshift({ id, name: id, text: "", ts, locked: false }); q.value = ""; sel = id; drawList(); drawNote();
      right.querySelector("textarea")?.focus(); } catch (x) { alert(x.message || x); } };   // the search text becomes the name when there is one
  rows.addEventListener("click", e => { const r = e.target.closest(".lv-row"); if (!r) return; sel = r.dataset.id; drawList(); drawNote(); });
  stops.push(store.on("base", load), store.on("year", drawList)); load();
  return { destroy: () => stops.forEach(s => s()) };
}
