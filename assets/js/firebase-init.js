import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js';
import { getDatabase, ref, onValue, set, push, get, off, remove, runTransaction, update } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCv2cQGWeXS-w7psrQiZD8dn4R7hStmY1o",
  authDomain: "persinfo-df93f.firebaseapp.com",
  databaseURL: "https://persinfo-df93f-default-rtdb.firebaseio.com",
  projectId: "persinfo-df93f",
  storageBucket: "persinfo-df93f.appspot.com",
  messagingSenderId: "218680336647",
  appId: "1:218680336647:web:7786091136b9e6b28565a2"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export { database, auth, ref, onValue, set, push, get, off, remove, runTransaction, update, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword };
