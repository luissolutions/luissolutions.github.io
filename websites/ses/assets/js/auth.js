import { auth, onAuthStateChanged, signOut } from './firebase-init.js';

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Logged in");
    } else {
        window.location.href = 'login.html';
    }
});

document.getElementById('signOutButton').addEventListener('click', function () {
    signOut(auth).then(() => {
        console.log('User signed out');
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error('Sign out error:', error);
    });
});