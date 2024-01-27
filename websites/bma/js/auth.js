import { auth, onAuthStateChanged, signOut } from "../../../assets/js/firebase-init.js";

// Check authentication state
onAuthStateChanged(auth, (user) => {
  if (user) {
    const email = user.email || 'No email';
    console.log(`Logged in as: (${email})`);
  } else {
    console.error('Not Signed In.');
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