// core/store.js - the shared state the blocks talk through. A block never reaches into another block; it sets or reads a
// key here and everyone listening follows (pick a job in the list -> the card and the photos change).
const state = { user: null, base: "public", year: new Date().getFullYear(), jobId: null, job: null };
const listeners = new Map();   // key -> Set(fn)

export const store = {
  get: key => state[key],
  all: () => ({ ...state }),
  set(key, value) {
    if (state[key] === value) return;
    state[key] = value;
    for (const fn of listeners.get(key) || []) { try { fn(value, key); } catch (e) { console.warn("[store]", key, e); } }
    for (const fn of listeners.get("*") || []) { try { fn(value, key); } catch (e) { console.warn("[store]", key, e); } }
  },
  on(key, fn) {   // returns the unsubscribe
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(fn);
    return () => listeners.get(key)?.delete(fn);
  }
};
