function toggleDropdown() {
  document.getElementById("myDropdown").classList.toggle("show");
}

window.onclick = function (event) {
  if (!event.target.matches('.dropbtn')) {
    document.querySelectorAll(".dropdown-apps.show").forEach(dropdown => {
      dropdown.classList.remove('show');
    });
  }
}

const appNamesMap = {
  "Time Logging": "livetasker",
  "Notes App": "livenotes",
  "Fuel Logging": "livegas",
  "Quote/Invoice Maker": "liveinvoice",
  "Mileage Logging": "livemileage",
  "Calendar": "liveschedule",
  "Job Info": "livejob",
  "Gallery": "livegallery",
  "Financial Logging": "livebudget",
  "Favorites/Bookmarks": "livelinks",
  "View/Edit Inventory": "liveinventory",
  "View/Edit Database": "livedatabase",
  "Quiz/Testing": "livelearn",
  "Password Generator": "password",
  "Conversion Calculator": "conversion",
  "Percentage Calculator": "percent",
  "Calculator": "calc",
  "Wire Counter": "count",
  "Analytics": "liveanalytics",
  "Timer": "livetimer",
};

const appDisplayNames = Object.keys(appNamesMap);
const iframe = document.getElementById('myIframe');
const dropdownContent = document.getElementById('myDropdown');
let currentIndex = 0;

function setIframeSrc(index) {
  currentIndex = index;
  iframe.src = `../../apps/${appNamesMap[appDisplayNames[index]]}.html`;
  localStorage.setItem('lastUsedApp', index);
}

function generateButtons() {
  dropdownContent.innerHTML = appDisplayNames.map((displayName, index) =>
    `<a onclick="setIframeSrc(${index})">${displayName}</a>`
  ).join('');
}

function loadIframeContent() {
  const sourceName = document.getElementById('iframeSource').value;
  const fullPath = `../../apps/${appNamesMap[sourceName]}.html`;
  iframe.src = fullPath;
  localStorage.setItem('lastUsedApp', appDisplayNames.indexOf(sourceName));
}

function updateTime() {
  const now = new Date();
  const hours = now.getHours() % 12 || 12;
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  const strTime = `${hours}:${minutes} ${ampm}`;
  document.getElementById('clock').innerText = strTime;
  setTimeout(updateTime, 1000);
}

window.onload = function () {
  const lastUsedApp = localStorage.getItem('lastUsedApp');
  if (lastUsedApp !== null) {
    currentIndex = parseInt(lastUsedApp, 10);
  }
  setIframeSrc(currentIndex);
  generateButtons();
  updateTime();
}

document.getElementById('loadContent').addEventListener('click', loadIframeContent);
document.getElementById('iframeSource').addEventListener('keyup', function (e) {
  if (e.key === "Enter") {
    loadIframeContent();
  }
});

document.querySelectorAll(".clock").forEach(clock => {
  clock.addEventListener("dblclick", function () {
    clock.style.display = "none";
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('toggleSidebar');
  const sidebar = document.getElementById('sidebar');
  const contentItems = sidebar.querySelectorAll('.sidebar-content');

  function toggleSidebar() {
    sidebar.classList.toggle('hidden');
    toggleButton.classList.toggle('xbutton');
    toggleButton.innerText = sidebar.classList.contains('hidden') ? "Open Sidebar" : "Close Sidebar";
    contentItems.forEach(item => item.classList.toggle('visible', !sidebar.classList.contains('hidden')));
  }

  toggleButton.addEventListener('click', toggleSidebar);

  document.addEventListener('click', (event) => {
    if (!sidebar.contains(event.target) && !toggleButton.contains(event.target) && !sidebar.classList.contains('hidden')) {
      toggleSidebar();
    }
  });

  setupHeaderFooterLogo();
});

function setupHeaderFooterLogo() {
  const header = document.querySelector("header");
  const footer = document.querySelector("footer");
  const logoImage = document.getElementById("logoImage");

  logoImage.ondblclick = () => {
    header.style.display = "none";
    footer.style.display = "none";
    toggleSidebar.style.top = "0px";
    iframe.style.maxHeight = "95vh";
  };
}

document.getElementById('shortcutIconOne').addEventListener('click', () => setIframeSrc(4));
document.getElementById('shortcutIconTwo').addEventListener('click', () => setIframeSrc(0));

document.getElementById('toggleBookmarks').addEventListener('click', function () {
  const linkIframe = document.getElementById('linkAppIframe');
  const chatIframe = document.getElementById('chatAppIframe');
  const isLinkVisible = linkIframe.style.display === "block";

  linkIframe.style.display = isLinkVisible ? "none" : "block";
  chatIframe.style.height = isLinkVisible ? "95vh" : "46vh";
});