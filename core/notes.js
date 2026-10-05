// core/notes.js - the NOTES domain: {base}/notes/{name} = { name, note, timestamp } (onlinenotes' shape). A locked note
// (AGCM1. / SXOR1. cipher) is listed but never opened here - the word belongs to the Notes app. No HTML in here.
import { database, ref, update, readOnce } from "./firebase.js";

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
