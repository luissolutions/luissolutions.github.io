import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue, off, set } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

let isFirebaseInitialized = false;
let database;

export function initializeFirebase() {
    if (isFirebaseInitialized) return;

    const appSettings = {
        databaseURL: "https://persinfo-df93f-default-rtdb.firebaseio.com/"
    };

    const app = initializeApp(appSettings);
    database = getDatabase(app);

    isFirebaseInitialized = true;
}

function loginUser(username, password) {
    return new Promise((resolve, reject) => {
        const usersRef = ref(database, "users");
        let usersListener;
        usersListener = onValue(usersRef, snapshot => {
            const users = snapshot.val();

            if (users) {
                const matchingUser = Object.values(users).find(user => user.username === username && user.password === password);

                if (matchingUser) {
                    resolve(matchingUser);
                } else {
                    reject(new Error("Invalid username or password."));
                }
            }

            off(usersRef, usersListener); 
        });
    });
}

function handleLoginFormSubmission(event) {
    console.log("Login form submitted");
    event.preventDefault();

    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    loginUser(username, password)
        .then(matchingUser => {
            const sToken = "7777777";
            const expirationMinutes = 480;
            const expirationTime = new Date().getTime() + (expirationMinutes * 60 * 1000);
            const tokenData = { sToken, expiresAt: expirationTime };
            localStorage.setItem("sToken", JSON.stringify(tokenData));

            const delay = expirationTime - new Date().getTime();
            setTimeout(() => localStorage.removeItem("sToken"), delay);
            alert("Login Successful.");
            window.location.href = "full.html";
        })
        .catch(error => {
            alert("Invalid username or password. Please try again.");
        });
}

function handleRegisterFormSubmission(event) {
    console.log("Register form submitted");
    event.preventDefault();

    const username = document.getElementById("reg-username").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const confirmPassword = document.getElementById("reg-confirm-password").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match. Please try again.");
        return;
    }

    registerNewUser(username, email, password)
        .then(() => {
            alert("Registration successful!");
            document.getElementById("register-form").reset();
        })
        .catch(err => {
            alert("Failed to register user:", err.message);
        });
}

function getIP() {
    return fetch('https://api.ipify.org?format=json')
        .then(response => response.json())
        .then(data => data.ip);
}

function attachLoginEventListener() {
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", handleLoginFormSubmission);
    }
}

function attachRegisterEventListener() {
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", handleRegisterFormSubmission);
    }
}

async function registerNewUser(name, email, password) {
    const ipAddress = await getIP();
    if (!isFirebaseInitialized) {
        throw new Error('Firebase is not initialized');
    }
    const userRef = ref(database, `users/${email.replace(/\W/g, "")}`);
    const userInfo = {
        name,
        email,
        password,
        ipAddress
    };
    return set(userRef, userInfo);
}

export { registerNewUser };

export function attachFirebaseEventListeners() {
    attachLoginEventListener();
    attachRegisterEventListener();
}

document.addEventListener("DOMContentLoaded", function () {
    initializeFirebase();
});