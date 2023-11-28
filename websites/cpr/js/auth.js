import { auth, signOut } from "../../../assets/js/firebase-init.js";

document.addEventListener('DOMContentLoaded', () => {
  // Check the auth state
  auth.onAuthStateChanged((user) => {
    if (!user) {
      // User is not logged in, redirect to login page
      window.location.href = 'login.html';
    } else {
      // User is logged in, you can optionally perform other actions here
    }
  });
});

document.getElementById('logoutButton').addEventListener('click', () => {
  signOut(auth).then(() => {
      console.log("You have been logged out");
      // window.location.href = 'login.html';
  }).catch((error) => {
      console.error("Logout error", error);
  });
});