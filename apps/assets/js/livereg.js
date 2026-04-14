import { database, ref, set, onAuthStateChanged, auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from './firebase-init.js';
        import { accessToken } from './microsoftAuth.js';

        let currentUserUID = null;

        const loginForm = document.getElementById("login-form");
        const logoutButton = document.getElementById("logout");
        const loginEmailInput = document.getElementById("login-email");
        const loginPasswordInput = document.getElementById("login-password");

        const registrationForm = document.getElementById("registration-form");
        const regEmailInput = document.getElementById("reg-email");
        const regPasswordInput = document.getElementById("reg-password");
        const regConfirmPasswordInput = document.getElementById("reg-confirm-password");

        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = loginEmailInput.value;
            const password = loginPasswordInput.value;

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    currentUserUID = userCredential.user.uid;
                    localStorage.setItem("currentUserUID", currentUserUID);
                    loginForm.style.display = "none";
                    logoutButton.style.display = "flex";
                })
                .catch((error) => {
                    alert("Invalid login. Please check your email and password.");
                    console.log(`Error [${error.code}]: ${error.message}`);
                });
        });

        logoutButton.addEventListener("click", () => {
            signOut(auth)
                .then(() => {
                    currentUserUID = null;
                    localStorage.removeItem("currentUserUID");
                    loginForm.style.display = "flex";
                    logoutButton.style.display = "none";
                    alert("Logged out successfully!");
                })
                .catch((error) => {
                    console.log(`Error [${error.code}]: ${error.message}`);
                });
        });

        onAuthStateChanged(auth, (user) => {
            if (user) {
                currentUserUID = user.uid;
                localStorage.setItem("currentUserUID", currentUserUID);
                loginForm.style.display = "none";
                logoutButton.style.display = "flex";
                console.log("Logged in as user:", user.email);
            } else {
                currentUserUID = null;
                localStorage.removeItem("currentUserUID");
                loginForm.style.display = "flex";
                logoutButton.style.display = "none";
            }
        });

        registrationForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            let username = document.getElementById("reg-username").value;
            let firstName = document.getElementById("reg-first-name").value;
            let lastName = document.getElementById("reg-last-name").value;
            let address = document.getElementById("reg-address").value;
            let email = regEmailInput.value;
            let phoneNumber = document.getElementById("reg-phone").value;
            let password = regPasswordInput.value;
            let confirmPassword = regConfirmPasswordInput.value;

            if (password !== confirmPassword) {
                alert("Passwords do not match. Please try again.");
                return;
            }

            let ipAddress = await getIP();

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const userId = userCredential.user.uid;

                await saveUserData(userId, email, username, phoneNumber, firstName, lastName, address, ipAddress);

                alert("Registration successful! You can now log in.");
                registrationForm.reset();
            } catch (error) {
                if (error.code === "auth/email-already-in-use") {
                    try {
                        const userCredential = await signInWithEmailAndPassword(auth, email, password);
                        const userId = userCredential.user.uid;

                        await saveUserData(userId, email, username, phoneNumber, firstName, lastName, address, ipAddress);

                        alert("Account already existed, but database entry was created/updated.");
                        registrationForm.reset();
                    } catch (loginError) {
                        alert("Error signing in existing user: " + loginError.message);
                    }
                } else {
                    alert("Error: " + error.message);
                }
            }
        });

        async function saveUserData(userId, email, username, phoneNumber, firstName, lastName, address, ipAddress) {
            const userInfo = {
                email,
                username,
                phoneNumber,
                firstName,
                lastName,
                address,
                ipAddress
            };

            const userRef = ref(database, `${userId}/info/`);

            try {
                await set(userRef, userInfo);
                console.log("User data saved successfully!");
            } catch (error) {
                console.error("Error saving user data:", error);
            }
        }

        async function getIP() {
            try {
                let response = await fetch('https://api.ipify.org?format=json');
                let data = await response.json();
                return data.ip;
            } catch (error) {
                console.error("Failed to get IP:", error);
                return "Unknown IP";
            }
        }
