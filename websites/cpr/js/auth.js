document.addEventListener("DOMContentLoaded", () => {
    // Check if the token exists in local storage
    var tokenData = JSON.parse(localStorage.getItem("token")); // This will be an object or null
    var currentTime = new Date().getTime();

    // Define the token expiration time in milliseconds (e.g., 480 minutes)
    var expirationMinutes = 480;
    var expirationTime = expirationMinutes * 60 * 1000; // Convert minutes to milliseconds

    if (!tokenData || tokenData.expiresAt < currentTime) {
        // Token is not present or has expired, redirect to login.html
        window.location.href = "login.html";
    } else {
        // Token is valid, the user can stay on this page
    }
});
