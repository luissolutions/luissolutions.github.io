// core/firebase.js - THE one Firebase instance for the Louverse (project persinfo-df93f, the same one every app uses).
// Everything that touches Firebase imports from here; nothing else initialises the SDK.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getDatabase, ref, get, set, update, push, remove, onValue, off, query, limitToLast } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { getStorage, ref as storageRef, listAll, getDownloadURL, uploadBytes, deleteObject } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCv2cQGWeXS-w7psrQiZD8dn4R7hStmY1o",
  authDomain: "persinfo-df93f.firebaseapp.com",
  databaseURL: "https://persinfo-df93f-default-rtdb.firebaseio.com",
  projectId: "persinfo-df93f",
  storageBucket: "persinfo-df93f.appspot.com",
  messagingSenderId: "218680336647",
  appId: "1:218680336647:web:7786091136b9e6b28565a2"
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);
export { ref, get, set, update, push, remove, onValue, off, query, limitToLast, storageRef, listAll, getDownloadURL, uploadBytes, deleteObject, signInWithEmailAndPassword, signOut, onAuthStateChanged };

export const LUIS_UID = "7cIh8rrhVNOjjj5CBDgb3IlqzEh2";
export const TELAID_UID = "SDN0vKPQ1qfN5vxkvhR3auVhDYq1";

// base = the signed-in account's tree, or "public" when nobody is signed in (the same rule every app uses: BASE_PATH = uid || public)
export const baseFor = user => (user && user.uid) || "public";

// one place to wait for the first auth answer; resolves with the user (or null)
let firstAuth = null;
export function whenAuthReady() {
  if (!firstAuth) firstAuth = new Promise(resolve => { const stop = onAuthStateChanged(auth, u => { stop(); resolve(u || null); }); });
  return firstAuth;
}
export const onUser = cb => onAuthStateChanged(auth, u => cb(u || null));
export const readOnce = async path => { const s = await get(ref(database, path)); return s.exists() ? s.val() : null; };
export const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const signOutNow = () => signOut(auth);
