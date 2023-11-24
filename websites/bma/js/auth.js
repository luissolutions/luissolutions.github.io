document.addEventListener("DOMContentLoaded", function () {
  var tokenData = JSON.parse(localStorage.getItem("sToken"));
  var currentTime = new Date().getTime();

  if (!tokenData || tokenData.sToken !== "999999999" || tokenData.expiresAt < currentTime) {
    window.location.href = "login.html";
  }
});
