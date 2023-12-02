import { auth, onAuthStateChanged, signOut } from "../../../assets/js/firebase-init.js";

// Check authentication state
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Logged in");
  } else {
    console.error('Not Signed In, Some functions not available.');
  }
});

// Sign out
document.getElementById('signOutButton').addEventListener('click', function () {
  signOut(auth).then(() => {
    console.log('User signed out');
  }).catch((error) => {
    console.error('Sign out error:', error);
  });
});