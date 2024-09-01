// auth-guard.js
import { auth, onAuthStateChanged, signOut } from "../../../../assets/js/firebase-init.js";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = 'login.html';
  } else {
    console.log(`Logged in as: ${user.email}`);
  }
});e

document.getElementById('signOutButton').addEventListener('click', function () {
  signOut(auth).then(() => {
    console.log('User signed out');
    window.location.href = 'index.html';
  }).catch((error) => {
    console.error(error);
  });
});
