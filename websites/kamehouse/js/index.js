import { auth, signInWithEmailAndPassword } from "./firebase-init.js";

document.addEventListener("submit", function (event) {
    event.preventDefault();
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((credentials) => {
            window.location.href = 'base.html';
        })
        .catch((error) => {
            console.error('Login error:', error);
        });
});

document.getElementById('loadContent').addEventListener('click', function () {
    var sourceName = document.getElementById('iframeSource').value;

    var fullPath = sourceName + ".html";

    window.open(fullPath, '_blank');
});