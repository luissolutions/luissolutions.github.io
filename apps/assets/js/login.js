import { firebaseConfig } from "../../../assets/js/firebase-config.js";

import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
let currentUserUID = null;

document.addEventListener('DOMContentLoaded', () => {
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
                currentUserUID = userCredential.user.uid;
                localStorage.setItem("currentUserUID", currentUserUID);
                loginForm.style.display = 'none';
                logoutButton.style.display = 'flex';
                window.location.reload();
            })
            .catch((error) => {
                alert("Invalid login. Please check your email and password.");
                console.log(`Error [${error.code}]: ${error.message}`);
            });
    });

    logoutButton.addEventListener('click', () => {
        signOut(auth)
            .then(() => {
                currentUserUID = null;
                localStorage.removeItem("currentUserUID");
                loginForm.style.display = 'flex';
                logoutButton.style.display = 'none';
                window.location.reload();
            })
            .catch((error) => {
                console.log(`Error [${error.code}]: ${error.message}`);
            });
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserUID = user.uid;
            localStorage.setItem("currentUserUID", currentUserUID);
            loginForm.style.display = 'none';
            logoutButton.style.display = 'flex';
            console.log("Logged in as user:", user.email);
        } else {
            currentUserUID = null;
            localStorage.removeItem("currentUserUID");
            loginForm.style.display = 'flex';
            logoutButton.style.display = 'none';
            console.log("No user is logged in.");
        }
    });
});

export function getCurrentUserUID() {
    return localStorage.getItem("currentUserUID");
}