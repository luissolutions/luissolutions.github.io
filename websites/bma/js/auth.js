import { getAuth, onAuthStateChanged, signOut } from "../../../assets/js/firebase-init.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth();
  const loginButton = document.getElementById("loginButton");
  const accountButton = document.getElementById("accountButton");
  const signOutButton = document.getElementById("signOutButton");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      loginButton.style.display = "none";
      accountButton.style.display = "inline-block";
      signOutButton.style.display = "inline-block";
    } else {
      loginButton.style.display = "inline-block";
      accountButton.style.display = "none";
      signOutButton.style.display = "none";
    }
  });

  signOutButton.addEventListener("click", () => {
    signOut(auth).then(() => {
      window.location.href = "login.html";
    }).catch((error) => {
      console.error("Error signing out:", error);
    });
  });
});
