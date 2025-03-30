import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, initializeAuth, signOut, createUserWithEmailAndPassword, EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import {
  getDatabase, ref, onValue, set, get, off, remove, runTransaction, push, update, limitToLast, query
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import {
  getStorage, ref as storageRef, uploadBytes, getDownloadURL, listAll, uploadBytesResumable, deleteObject, updateMetadata, getBlob, getBytes 
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyAg4UO0ASr-M19XCtoI8AZiNK2l5ddFDd0",
  authDomain: "notes-fba33.firebaseapp.com",
  databaseURL: "https://notes-fba33-default-rtdb.firebaseio.com",
  projectId: "notes-fba33",
  storageBucket: "notes-fba33.appspot.com",
  messagingSenderId: "312617117650",
  appId: "1:312617117650:web:721cc5bf322af639410a0b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

export {
  app, database, auth, storage,
  getAuth, onAuthStateChanged, getDatabase, ref, onValue, set, push, get, off, remove,
  runTransaction, update, signOut, createUserWithEmailAndPassword, limitToLast, query,
  EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile, updateMetadata,
  getStorage, storageRef, uploadBytes, getDownloadURL, listAll, signInWithEmailAndPassword,
  uploadBytesResumable, deleteObject, getFunctions, httpsCallable, initializeAuth, getBlob, getBytes 
};
