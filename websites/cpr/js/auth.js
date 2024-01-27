import { auth, signOut } from "./firebase-init.js";

const specificUserEmail = "luis@luis.com";

document.addEventListener('DOMContentLoaded', () => {
  // Check the auth state
  auth.onAuthStateChanged((user) => {
    if (!user) {
      // User is not logged in, redirect to login page
      window.location.href = 'login.html';
    } else {
      // Check if the logged-in user is the specific user
      if (user.email === specificUserEmail) {
        console.log("Specific user is logged in");
      } else {
        console.log("Different user is logged in");
        window.location.href = 'login.html';
      }
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