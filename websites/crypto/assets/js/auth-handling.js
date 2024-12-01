import { auth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, ref } from "../../../../assets/js/firebase-init.js";

// Check for login form and add event listener if present
const loginForm = document.getElementById("login-form");
if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
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
}

const specialAccessPassword = "M1n3Rm4N";

// Check for registration form and add event listener if present
const registrationForm = document.getElementById("registration-form");
if (registrationForm) {
    registrationForm.addEventListener("submit", function (event) {
        event.preventDefault();

        // Prompt for special access password
        const accessPassword = prompt("Please enter the access password to complete registration:");
        if (accessPassword !== specialAccessPassword) {
            alert("Incorrect access password. Registration not allowed.");
            return; // Exit registration if access password is incorrect
        }

        // Get email and passwords from form fields
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;

        if (password !== confirmPassword) {
            alert("Passwords do not match. Please try again.");
            return;
        }

        // Proceed with Firebase registration
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log('User registered:', userCredential.user);
                alert("Registration Successful");
            })
            .catch((error) => {
                console.error('Error registering user:', error);
                alert("Registration failed: " + error.message);
            });

        registrationForm.reset();
    });
}

// Toggling between login and registration forms (only if toggle links are present)
const toggleRegisterLink = document.getElementById('toggle-register');
const toggleLoginLink = document.getElementById('toggle-login');

if (toggleRegisterLink && toggleLoginLink) {
    toggleRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.login-container').style.display = 'none';
        document.querySelector('.register-container').style.display = 'block';
    });

    toggleLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.register-container').style.display = 'none';
        document.querySelector('.login-container').style.display = 'block';
    });
}

// Handle login/logout link
document.addEventListener("componentLoaded:nav", () => {
    const authLink = document.getElementById('authLink');

    if (authLink) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                authLink.textContent = 'Logout';
                authLink.href = '#';
                authLink.onclick = (e) => {
                    e.preventDefault();
                    signOut(auth)
                        .then(() => {
                            window.location.href = 'index.html';
                        })
                        .catch((error) => {
                            console.error('Error signing out:', error);
                        });
                };
            } else {
                authLink.textContent = 'Login';
                authLink.href = 'login.html';
                authLink.onclick = null;
            }
        });
    }
});
