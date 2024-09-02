import { auth } from './firebase-init-noauth.js'; 

document.addEventListener("DOMContentLoaded", () => {
    const signOutButton = document.getElementById('signOutButton');
    if (signOutButton) {
        signOutButton.addEventListener('click', () => {
            signOut(auth).then(() => {
                console.log('User signed out');
                window.location.href = 'index.html';
            }).catch((error) => {
                console.error('Sign out error:', error);
            });
        });
    }

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            console.log(`Logged in as: ${user.email}`);
        }
    });
});
