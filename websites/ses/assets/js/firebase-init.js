import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getDatabase, ref, onValue, set, get, off, remove, runTransaction, push, update } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

const appSettings = {
    apiKey: "AIzaSyAg4UO0ASr-M19XCtoI8AZiNK2l5ddFDd0",
    authDomain: "notes-fba33.firebaseapp.com",
    databaseURL: "https://notes-fba33-default-rtdb.firebaseio.com",
    projectId: "notes-fba33",
    storageBucket: "notes-fba33.appspot.com",
    messagingSenderId: "312617117650",
    appId: "1:312617117650:web:721cc5bf322af639410a0b"
};

const app = initializeApp(appSettings);
const auth = getAuth(app);
const database = getDatabase(app);

export {
  app, database, auth, getAuth, onAuthStateChanged, getDatabase, ref, onValue, set, push, get, off, remove, runTransaction,
  update, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword
};