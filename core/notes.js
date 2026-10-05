// core/notes.js - the NOTES domain: {base}/notes/{name} = { name, note, timestamp } (onlinenotes' shape). A locked note
// (AGCM1. / SXOR1. cipher) is listed but never opened here - the word belongs to the Notes app. No HTML in here.
import { database, ref, update, set, remove, readOnce } from "./firebase.js";

export const notesPath = base => `${base}/notes`;
export const isLocked = text => /^(AGCM1\.|SXOR1\.)/.test(String(text || ""));
export async function loadNotes(base) {
  const all = (await readOnce(notesPath(base))) || {};
  return Object.entries(all).filter(([, v]) => v && typeof v === "object" && (typeof v.note === "string" || typeof v.name === "string")).map(([id, v]) => ({ id, name: v.name || id, text: typeof v.note === "string" ? v.note : "", ts: Number(v.timestamp) || 0, locked: isLocked(v.note) }))
    .sort((a, b) => b.ts - a.ts);
}
export async function saveNote(base, id, text) {
  const ts = Date.now(); await update(ref(database, `${notesPath(base)}/${id}`), { note: text, timestamp: ts }); return ts;
}

// NEW / RENAME / DELETE (L 2026-10-05 "add some edit option in the notes tile"). The key IS the name (onlinenotes' shape),
// minus the characters a database key can't hold; rename = write under the new key, then remove the old one.
export const noteKey = name => String(name || "").trim().replace(/[.#$\[\]\/]/g, "-");
export async function createNote(base, name) {
  const id = noteKey(name); if (!id) throw new Error("Give the note a name.");
  if (await readOnce(`${notesPath(base)}/${id}`)) throw new Error(`There is already a note called "${id}".`);
  const ts = Date.now(); await set(ref(database, `${notesPath(base)}/${id}`), { name: id, note: "", timestamp: ts }); return { id, ts };
}
export async function renameNote(base, id, newName) {
  const to = noteKey(newName); if (!to) throw new Error("Give the note a name."); if (to === id) return id;
  if (await readOnce(`${notesPath(base)}/${to}`)) throw new Error(`There is already a note called "${to}".`);
  const cur = await readOnce(`${notesPath(base)}/${id}`); if (!cur) throw new Error("That note is gone.");
  await set(ref(database, `${notesPath(base)}/${to}`), { ...cur, name: to }); await remove(ref(database, `${notesPath(base)}/${id}`)); return to;
}
export const deleteNote = (base, id) => remove(ref(database, `${notesPath(base)}/${id}`));
