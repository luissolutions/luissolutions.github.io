import { getAuth, onAuthStateChanged, signOut } from "../../../assets/js/firebase-init.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth();
  const signOutButton = document.getElementById("signOutButton");

  signOutButton.addEventListener("click", () => {
    signOut(auth).then(() => {
      window.location.href = "login.html";
    }).catch((error) => {
      console.error("Error signing out:", error);
    });
  });
});
