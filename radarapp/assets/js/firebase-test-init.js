import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, listAll, deleteObject } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js';
import { getDatabase, ref as dbRef, set, get, ref } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyBUq3vdvQFgyW_Py6r6zCgQyeIzfZq-ZUU",
  authDomain: "playground-e3690.firebaseapp.com",
  databaseURL: "https://playground-e3690-default-rtdb.firebaseio.com",
  projectId: "playground-e3690",
  storageBucket: "playground-e3690.appspot.com",
  messagingSenderId: "803825556227",
  appId: "1:803825556227:web:556a3db8526287763aa736"
};

const app     = initializeApp(firebaseConfig);
const db      = getDatabase(app);
const storage = getStorage(app);

export {
  db, storage, storageRef, uploadBytes, getDownloadURL, listAll, deleteObject, dbRef, set, get, ref };
