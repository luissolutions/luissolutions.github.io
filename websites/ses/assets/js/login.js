import {
    database, auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, ref, set
} from './firebase-init.js';

const mainForm = document.getElementById('loginForm');
const emailInp = document.getElementById('loginEmail');
const passInp = document.getElementById('loginPassword');

const emailReg = document.getElementById('regEmail');
const passReg = document.getElementById('regPassword');
const confirmPassReg = document.getElementById('regConfirmPassword');

mainForm.addEventListener('submit', function (evt) {
    evt.preventDefault();
    signInWithEmailAndPassword(auth, emailInp.value, passInp.value)
        .then(() => {
            window.location.href = 'notes.html';
        })
        .catch((error) => {
            console.error('Login error:', error);
            alert("Error during login: " + error.message);
        });
});

document.getElementById('show-login-btn').addEventListener('click', () => {
    document.getElementById('login-form-container').style.display = 'block';
    document.getElementById('signup-form-container').style.display = 'none';
});

document.getElementById('show-signup-btn').addEventListener('click', () => {
    document.getElementById('login-form-container').style.display = 'none';
    document.getElementById('signup-form-container').style.display = 'block';
});

document.getElementById("register-submit").addEventListener("click", function (event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const firstName = document.getElementById("first-name").value;
    const lastName = document.getElementById("last-name").value;
    const address = document.getElementById("address").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("regConfirmPassword").value;
    const phone = document.getElementById("phone").value;

    if (!username || !email || !password) {
        alert("Please fill out all required fields (Username, Email, Password).");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match. Please try again.");
        return;
    }

    var userInfo = {
        email: email,
        username: username,
        password: password,
        phone: phone,
        firstName: firstName,
        lastName: lastName,
        address: address
    };

    var userRef = ref(database, "users/" + email.replace(/\W/g, ""));
    set(userRef, userInfo);

    handleRegistration(event);

});

function handleRegistration(evt2) {
    evt2.preventDefault();

    if (passReg.value !== confirmPassReg.value) {
        alert('Passwords do not match. Please try again.');
        return;
    }

    if (auth.currentUser) {
        createUserWithEmailAndPassword(auth, emailReg.value, passReg.value)
            .then((credentials) => {
                console.log('User created:', credentials.user);
                alert("Registration successful!");
                document.getElementById("regForm").reset();
            })
            .catch((error) => {
                console.error('Registration error:', error);
                alert("Somethings wrong")
            });
    } else {
        alert('You need to log in before you can register.');
    }
}
