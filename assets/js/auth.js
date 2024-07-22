import { auth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from './firebase-init.js';

export function initializeAuth(app) {
    document.getElementById('login-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const email = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        signInWithEmailAndPassword(auth, email, password)
            .then((credentials) => {
                document.getElementById('login-section').style.display = 'none';
                document.getElementById('logout').style.display = 'block';
                app.isAuthenticated = true;
                app.initializeFirebase();
            })
            .catch((error) => {
                console.error('Login error:', error);
            });
    });

    document.getElementById('logout').addEventListener('click', () => {
        signOut(auth).then(() => {
            document.getElementById('login-section').style.display = 'block';
            document.getElementById('logout').style.display = 'none';
            app.isAuthenticated = false;
            app.loadLocalData();
        }).catch((error) => {
            console.error('Logout error:', error);
        });
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log(`Logged in as: ${user.email}`);
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('logout').style.display = 'block';
            app.isAuthenticated = true;
            app.initializeFirebase();
        } else {
            document.getElementById('login-section').style.display = 'block';
            document.getElementById('logout').style.display = 'none';
            app.isAuthenticated = false;
            app.loadLocalData();
        }
    });
}
