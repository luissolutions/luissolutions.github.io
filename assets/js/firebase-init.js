// firebase-init.js

import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {  getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getDatabase, ref, onValue, set, get, off, remove, runTransaction, push, update, limitToLast, query } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

function initializeAuth(app) {
  document.getElementById('login-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
      .then((credentials) => {
        console.log('Logged in successfully:', credentials.user.email);
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('logout').style.display = 'block';
        app.isAuthenticated = true;
        app.initializeFirebase();
      })
      .catch((error) => {
        console.error('Login error:', error.message);
        alert('Login failed. Please check your credentials and try again.');
      });
  });

  document.getElementById('logout').addEventListener('click', () => {
    signOut(auth).then(() => {
      console.log('Logged out successfully');
      document.getElementById('login-section').style.display = 'block';
      document.getElementById('logout').style.display = 'none';
      app.isAuthenticated = false;
      app.loadLocalData();
    }).catch((error) => {
      console.error('Logout error:', error.message);
      alert('Logout failed. Please try again.');
    });
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log(`Logged in as: ${user.email}`);
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('logout').style.display = 'block';
      app.isAuthenticated = true;
      app.initializeFirebase();
    } else {
      document.getElementById('login-section').style.display = 'block';
      document.getElementById('logout').style.display = 'none';
      app.isAuthenticated = false;
      app.loadLocalData();
    }
  });
}

export { app, database, auth, getAuth, onAuthStateChanged, getDatabase, ref, onValue, set, push, get, off, remove, runTransaction, update, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, limitToLast, query, initializeAuth };