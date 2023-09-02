
function toggleMenu() {
  const navBar = document.querySelector(".nav-bar");
  navBar.classList.toggle("active");

  const dropdownLinks = document.querySelectorAll(".nav-bar a");
  dropdownLinks.forEach(link => {
    link.addEventListener('click', () => {
      navBar.classList.remove('active');
    });
  });
}

var appNames = [
  "livegas",
  "livemileage",
  "livenotes",
  "reg",
  "gallery",
  "budget",
  "invoice",
  "info",
  "liveinventory",
];

var pages = appNames.map(function (name) {
  return "../" + name + ".html";
});

var iframe = document.getElementById('myIframe');
var appButtons = document.getElementById('appButtons');
var currentIndex = localStorage.getItem('currentIndex') || 0;

function setIframeSrc(index) {
  currentIndex = index;
  iframe.src = pages[index];
  localStorage.setItem('currentIndex', currentIndex);
}

function cycleIframeSrc(isNext) {
  currentIndex = isNext ? (currentIndex + 1) % pages.length : (currentIndex - 1 + pages.length) % pages.length;
  setIframeSrc(currentIndex);
}

function generateButtons() {
  var buttonsHTML = `<button onclick="cycleIframeSrc(false)">⬆️</button>`;

  appNames.forEach((name, index) => {
    buttonsHTML += `<button onclick="setIframeSrc(${index})">${name.toUpperCase()}</button>`;
  });

  buttonsHTML += `<button onclick="cycleIframeSrc(true)">⬇️</button>`;

  appButtons.innerHTML = buttonsHTML;
}

window.onload = function () {
  setIframeSrc(currentIndex);
  generateButtons();
}

document.getElementById('loadContent').addEventListener('click', function () {
  var sourceName = document.getElementById('iframeSource').value;
  var fullPath = "../" + sourceName + ".html";
  document.getElementById('myIframe').src = fullPath;
});
