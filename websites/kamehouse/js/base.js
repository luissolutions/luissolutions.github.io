document.addEventListener('DOMContentLoaded', function () {
  const dropbtn = document.querySelector('.dropbtn');
  const dropdown = document.getElementById("myDropdown");

  dropbtn.addEventListener('click', toggleDropdown);

  document.addEventListener('click', function (event) {
    if (!event.target.matches('.dropbtn') && !dropdown.contains(event.target) && dropdown.classList.contains('show')) {
      dropdown.classList.remove('show');
    }
  });

  generateButtons();
  setIframeSrc(parseInt(currentIndex));

  document.getElementById('loadContent').addEventListener('click', loadIframeContent);
  document.getElementById('iframeSource').addEventListener('keyup', function (event) {
    if (event.key === "Enter") {
      loadIframeContent();
    }
  });

  document.getElementById('loadStylesheet').addEventListener('click', function () {
    const stylesheetName = document.getElementById('stylesheet-input').value.trim();
    if (stylesheetName) {
      const fullPath = "../../assets/css/" + stylesheetName + ".css";
      document.getElementById('stylesheet').href = fullPath;
    } else {
      alert("Please enter a stylesheet name.");
    }
  });
});

function toggleDropdown() {
  const dropdown = document.getElementById("myDropdown");
  dropdown.classList.toggle("show");
}

var appNames = [
  "livelearn", 
  "livelinks",
  "livenotes", 
  "livebudget",
  "livegas", 
  "livemileage",
  "livetimer", 
  "livetasker", 
  "liveinventory", 
  "livedatabase", 
  "livechat", 
  "livereg", 
  "livechess", 
  "gallery", 
  "invoice", 
  "info", 
  "viewer", 
  "password", 
  "converting", 
  "cheatsheet",
];

var pages = appNames.map(name => "../../apps/" + name + ".html");
var iframe = document.getElementById('myIframe');
var dropdownContent = document.getElementById('myDropdown');
var currentIndex = localStorage.getItem('currentIndex') || 0;

function setIframeSrc(index) {
  currentIndex = index;
  iframe.src = pages[index];
  localStorage.setItem('currentIndex', currentIndex);
}

function generateButtons() {
  var buttonsHTML = appNames.map((name, index) =>
    `<a href="#" data-index="${index}">${name.toUpperCase()}</a>`
  ).join('');
  dropdownContent.innerHTML = buttonsHTML;

  dropdownContent.querySelectorAll('a').forEach(item => {
    item.addEventListener('click', function () {
      setIframeSrc(this.getAttribute('data-index'));
      dropdownContent.classList.remove('show');
    });
  });
}

function loadIframeContent() {
  var sourceName = document.getElementById('iframeSource').value.trim();
  var fullPath = "../../apps/" + sourceName + ".html";
  iframe.src = fullPath;
}
