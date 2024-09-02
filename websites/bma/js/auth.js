import { getAuth, onAuthStateChanged, signOut } from "../../../assets/js/firebase-init.js";

document.addEventListener("DOMContentLoaded", () => {
  const auth = getAuth();
  const loginButton = document.querySelector("a[href='login.html'] button");
  const accountButton = document.createElement("button");
  const signOutButton = document.getElementById("signOutButton");

  accountButton.textContent = "Account";
  accountButton.addEventListener("click", () => {
    window.location.href = "account.html";
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      if (loginButton) {
        loginButton.replaceWith(accountButton);
      }
      signOutButton.style.display = "inline-block";
    } else {
      if (accountButton.parentNode) {
        accountButton.replaceWith(loginButton);
      }
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
