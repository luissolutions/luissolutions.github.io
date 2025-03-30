import { auth, onAuthStateChanged, signOut } from '../../../../apps/assets/js/firebase-init.js';

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log(`Logged in as: ${user.email}`);
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