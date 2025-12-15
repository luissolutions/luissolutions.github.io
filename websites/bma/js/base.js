function toggleDropdown() {
  const dropdown = document.getElementById("myDropdown");

  dropdown.classList.toggle("show");
  if (!dropdown.classList.contains("show")) return;

  dropdown.innerHTML = `
      <input type="text" id="appSearch" placeholder="Search for an app..." 
             oninput="filterApps()" onkeydown="handleSearch(event)">
      <div id="appList"></div>
  `;

  generateAppList();
  document.getElementById("appSearch").focus();

  document.addEventListener("click", closeDropdownOutside);
}

function closeDropdownOutside(event) {
  const dropdown = document.getElementById("myDropdown");
  const button = document.querySelector(".dropbtn");

  if (!dropdown.contains(event.target) && !button.contains(event.target)) {
    dropdown.classList.remove("show");
    document.removeEventListener("click", closeDropdownOutside);
  }
}

function generateAppList(filterText = "") {
  const appListDiv = document.getElementById("appList");
  if (!appListDiv) return;

  appListDiv.innerHTML = "";

  let matchFound = false;
  const filterLower = filterText.toLowerCase();

  appDisplayNames.forEach((displayName) => {
    const app = appNamesMap[displayName];
    const appTags = app.tags.join(" ").toLowerCase();

    if (displayName.toLowerCase().includes(filterLower) || appTags.includes(filterLower)) {
      const appLink = document.createElement("a");
      appLink.textContent = displayName;
      appLink.onclick = () => setIframeSrc(displayName);
      appListDiv.appendChild(appLink);
      matchFound = true;
    }
  });

  if (!matchFound) {
    appListDiv.innerHTML = `<p style="text-align:center; padding:10px;">No matching apps</p>`;
  }
}

const appNamesMap = {
  "Job Task Logging": { filename: "livetasker", tags: ["tasks", "log", "work"] },
  "Jobs Gallery": { filename: "livegallery", tags: ["gallery", "photos", "images"] },
  "Notes App": { filename: "livenotes", tags: ["notes", "writing", "journal"] },
  "Jobs Calendar": { filename: "liveschedule", tags: ["calendar", "appointments", "schedule"] },
  "Gas Logging": { filename: "livegas", tags: ["fuel", "mileage", "gas", "log"] },
  "Favorites/Bookmarks": { filename: "livelinks", tags: ["bookmarks", "links", "favorites", "web"] },
  "Database": { filename: "liveshow", tags: ["admin", "firebase", "database"] },
  "Quiz/Testing": { filename: "livelearn", tags: ["quiz", "test", "study", "exam", "learn"] },
  "View/Edit Inventory": { filename: "liveinventory", tags: ["database", "data", "records", "inventory"] },
  "Analytics": { filename: "liveanalytics", tags: ["analytics", "stats", "charts", "data"] },
  "Mileage Logging": { filename: "livemileage", tags: ["mileage", "miles", "trip"] },
  "Quote/Invoice Maker": { filename: "liveinvoice", tags: ["invoice", "billing", "quote", "finance"] },
  "Financial Logging": { filename: "livefinancials", tags: ["budget", "money", "expenses", "finance"] },
  "Financial Budgeting": { filename: "livebudget", tags: ["budget", "money", "expenses", "finance"] },
  "Contacts": { filename: "livecontacts", tags: ["contacts", "phone", "address", "people"] },
  "Job Details": { filename: "livedetails", tags: ["details", "jobnotes", "job"] },
  "Project Tracker": { filename: "liveproject", tags: ["details", "jobnotes", "Projects"] },
  "Password Generator": { filename: "password", tags: ["password", "security", "generator"] },
  "Conversion Calculator": { filename: "conversion", tags: ["conversion", "convert", "math"] },
  "Calculator": { filename: "calc", tags: ["calculator", "math", "numbers"] },
  "Wire Counter": { filename: "count", tags: ["count", "wires", "electrical"] },
};

const appDisplayNames = Object.keys(appNamesMap);
const iframe = document.getElementById('myIframe');
const dropdownContent = document.getElementById('myDropdown');
let currentIndex = 0;

function setIframeSrc(appName) {
  const app = appNamesMap[appName];
  if (app) {
    document.getElementById("myIframe").src = `../../apps/${app.filename}.html`;
    localStorage.setItem("lastUsedApp", appName);

    const sidebar = document.getElementById("sidebar");
    const toggleSidebarBtn = document.getElementById("toggleSidebar");

    if (sidebar && !sidebar.classList.contains("hidden")) {
      sidebar.classList.add("hidden");
      toggleSidebarBtn.classList.remove("xbutton");
      toggleSidebarBtn.innerText = "Menu";
    }

    const dropdown = document.getElementById("myDropdown");
    if (dropdown && dropdown.classList.contains("show")) {
      dropdown.classList.remove("show");
    }
  }
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

  if (lastUsedApp && appNamesMap[lastUsedApp]) {
    setIframeSrc(lastUsedApp);
  }

  generateButtons();
  updateTime();
};

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
    toggleButton.innerText = sidebar.classList.contains('hidden') ? "Menu" : "Close";
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

function filterApps() {
  const searchInput = document.getElementById("appSearch").value.trim().toLowerCase();
  generateAppList(searchInput);
}

function handleSearch(event) {
  if (event.key === "Enter" && event.shiftKey) {
    event.preventDefault();
    const searchValue = document.getElementById("appSearch").value.trim().toLowerCase();

    for (const app of Object.values(appNamesMap)) {
      if (app.filename.toLowerCase() === searchValue) {
        document.getElementById("myIframe").src = `../../apps/${app.filename}.html`;
        localStorage.setItem("lastUsedApp", searchValue);
        return;
      }
    }

    const filePath = `../../apps/${searchValue}.html`;
    document.getElementById("myIframe").src = filePath;
    localStorage.setItem("lastUsedApp", searchValue);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.getElementById("myDropdown");
  const sidebar = document.getElementById("sidebar");
  const toggleSidebarBtn = document.getElementById("toggleSidebar");

  let closeDropdownTimer;
  let closeSidebarTimer;

  function closeDropdown() {
    if (dropdown.classList.contains("show")) {
      dropdown.classList.remove("show");
    }
  }

  function closeSidebar() {
    if (!sidebar.classList.contains("hidden")) {
      sidebar.classList.add("hidden");
      toggleSidebarBtn.classList.remove("xbutton");
      toggleSidebarBtn.innerText = "Menu";
    }
  }

  dropdown.addEventListener("mouseleave", () => {
    closeDropdownTimer = setTimeout(() => {
      closeDropdown();
    }, 2000);
  });

  dropdown.addEventListener("mouseenter", () => {
    clearTimeout(closeDropdownTimer);
  });
});