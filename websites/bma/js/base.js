function toggleDropdown() {
  document.getElementById("myDropdown").classList.toggle("show");
}

window.onclick = function (event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName("dropdown-apps");
    for (var i = 0; i < dropdowns.length; i++) {
      if (dropdowns[i].classList.contains('show')) {
        dropdowns[i].classList.remove('show');
      }
    }
  }
}

var appNamesMap = {
  "Task Logging": "livetasker",
  "Quote/Invoice Maker": "liveinvoice",
  "Fuel Logging": "livegas",
  "Mileage Logging": "livemileage",
  "Financial Logging": "livebudget",
  "Notes App": "livenotes",
  "Favorites/Bookmarks": "livelinks",
  "View/Edit Inventory": "liveinventory",
  "View/Edit Database": "livedatabase",
  "Gallery/Uplaod": "livegallery",
  "Timer": "livetimer",
  "Quiz/Testing": "livelearn",
  "Password Generator": "password",
  "Conversion Calculator": "conversion",
  "Percentage Calculator": "percent",
  "Calculator": "calc",
  "Wire Counter": "count",
  "Analytics": "liveanalytics",
};

var appDisplayNames = Object.keys(appNamesMap);
var iframe = document.getElementById('myIframe');
var dropdownContent = document.getElementById('myDropdown');
var currentIndex = 0;

function setIframeSrc(index) {
  currentIndex = index;
  var appSrc = "../../apps/" + appNamesMap[appDisplayNames[index]] + ".html";
  iframe.src = appSrc;
  localStorage.setItem('lastUsedApp', index);
}

function generateButtons() {
  var buttonsHTML = '';
  appDisplayNames.forEach(function (displayName, index) {
    buttonsHTML += `<a onclick="setIframeSrc(${index})">${displayName}</a>`;
  });
  dropdownContent.innerHTML = buttonsHTML;
}

window.onload = function () {
  var lastUsedApp = localStorage.getItem('lastUsedApp');
  if (lastUsedApp !== null) {
    currentIndex = parseInt(lastUsedApp, 10);
  }
  setIframeSrc(currentIndex);
  generateButtons();
}

document.getElementById('loadContent').addEventListener('click', loadIframeContent);
document.getElementById('iframeSource').addEventListener('keyup', function (e) {
  if (e.key === "Enter") {
    loadIframeContent();
  }
});

function loadIframeContent() {
  var sourceName = document.getElementById('iframeSource').value;
  var fullPath = "../../apps/" + appNamesMap[sourceName] + ".html";
  document.getElementById('myIframe').src = fullPath;
  localStorage.setItem('lastUsedApp', appDisplayNames.indexOf(sourceName)); // Store the index when loaded manually
}

function updateTime() {
  let now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  let ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  let strTime = hours + ':' + minutes + ' ' + ampm;
  document.getElementById('clock').innerText = strTime;
  setTimeout(updateTime, 1000);
}

updateTime();

const clocks = document.getElementsByClassName("clock");

for (const clock of clocks) {
  clock.addEventListener("dblclick", function () {
    clock.style.display = "none";
  });
}