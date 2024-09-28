import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js"; 
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";

import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);

document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth(app);

    const loginForm = document.getElementById('login-form');
    const logoutButton = document.getElementById('logout');
    const emailInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = emailInput.value;
        const password = passwordInput.value;

        signInWithEmailAndPassword(auth, username, password)
            .then((userCredential) => {
                loginForm.style.display = 'none';
                logoutButton.style.display = 'flex';
                window.location.reload();
            })
    });

    logoutButton.addEventListener('click', () => {
        signOut(auth)
            .then(() => {
                loginForm.style.display = 'flex';
                logoutButton.style.display = 'none';
                window.location.reload();
            })
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginForm.style.display = 'none';
            logoutButton.style.display = 'flex';
        } else {
            loginForm.style.display = 'flex';
            logoutButton.style.display = 'none';
        }
    });
});