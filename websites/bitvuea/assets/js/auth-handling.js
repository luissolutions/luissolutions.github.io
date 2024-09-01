import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "../../../../assets/js/firebase-init.js";

// Login form handling
document.getElementById("login-form").addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((credentials) => {
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Login error:', error);
            alert("Error during login: " + error.message);
        });
});

// Registration form handling
document.getElementById("registration-form").addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    if (password !== confirmPassword) {
        alert("Passwords do not match. Please try again.");
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log('User registered:', userCredential.user);
            alert("Registration Successful");
        })
        .catch((error) => {
            console.error('Error registering user:', error);
            alert("Registration failed: " + error.message);
        });

    document.getElementById("registration-form").reset();
});

// Toggling between login and registration forms
document.getElementById('toggle-register').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('.login-container').style.display = 'none';
    document.querySelector('.register-container').style.display = 'block';
});

document.getElementById('toggle-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector('.register-container').style.display = 'none';
    document.querySelector('.login-container').style.display = 'block';
});
