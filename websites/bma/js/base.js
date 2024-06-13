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
  "Quote/Invoice Maker": "liveinvoice",
  "Fuel Logging": "livegas",
  "Mileage Logging": "livemileage",
  "Financial Logging": "livebudget",
  "Notes App": "livenotes",
  "View/Edit Inventory": "liveinventory",
  "View/Edit Database": "livedatabase",
  "Password Generator": "password",
  "Budget Caclulator": "budget",
  "Conversion Calculator": "conversion",
  "Percentage Calculator": "percent",
  "Calculator": "calc",
  "Wire Counter": "count",
  "Timer": "timer",
  "Analytics": "liveanalytics",
};

var appDisplayNames = Object.keys(appNamesMap);

var iframe = document.getElementById('myIframe');
var dropdownContent = document.getElementById('myDropdown');
var currentIndex = 0;

function setIframeSrc(index) {
  currentIndex = index;
  iframe.src = "../../apps/" + appNamesMap[appDisplayNames[index]] + ".html";
}

function generateButtons() {
  var buttonsHTML = '';
  appDisplayNames.forEach(function (displayName, index) {
    buttonsHTML += `<a onclick="setIframeSrc(${index})">${displayName}</a>`;
  });
  dropdownContent.innerHTML = buttonsHTML;
}

window.onload = function () {
  setIframeSrc(currentIndex);
  generateButtons();
}

document.getElementById('loadContent').addEventListener('click', loadIframeContent);
document.getElementById('iframeSource').addEventListener('keyup', function (e) {
  if (event.key === "Enter") {
    loadIframeContent();
  }
});

function loadIframeContent() {
  var sourceName = document.getElementById('iframeSource').value;
  var fullPath = "../../apps/" + appNamesMap[sourceName] + ".html";
  document.getElementById('myIframe').src = fullPath;
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