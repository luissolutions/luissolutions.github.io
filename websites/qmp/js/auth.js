document.addEventListener("DOMContentLoaded", function () {
  // Check if the token exists in the local storage
  var tokenData = JSON.parse(localStorage.getItem("sToken"));  // This will be an object or null
  var currentTime = new Date().getTime();

  if (!tokenData || tokenData.sToken !== "7777777" || tokenData.expiresAt < currentTime) {
    // Token is not "7777777" or it has expired, and the current page is not the login page
    // Redirect the user to the login page
    window.location.href = "login.html";
  }
});
