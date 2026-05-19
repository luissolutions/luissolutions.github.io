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
  "Job Task Logging": { path: "../../apps/online/onlinejob.html", tags: ["tasks", "log", "work"] },
  "Quote/Invoice Maker": { path: "../../apps/online/onlineinvoice.html", tags: ["invoice", "billing", "quote", "finance"] },
  "Project Tracker": { path: "../../apps/online/onlineproject.html", tags: ["details", "jobnotes", "projects"] },
  "Financial Logging": { path: "../../apps/online/onlinefinancials.html", tags: ["budget", "money", "expenses", "finance"] },
  "Financial Budgeting": { path: "../../apps/online/onlinebudget.html", tags: ["budget", "money", "expenses", "finance"] },
  "Job Details": { path: "../../apps/online/onlinedetails.html", tags: ["details", "jobnotes", "job"] },
  "Gas Logging": { path: "../../apps/online/onlinegas.html", tags: ["fuel", "mileage", "gas", "log"] },
  "View/Edit Inventory": { path: "../../apps/online/onlineinventory.html", tags: ["database", "data", "records", "inventory"] },
  "Quiz/Testing": { path: "../../apps/online/onlinelearn.html", tags: ["quiz", "test", "study", "exam", "learn"] },
  "Favorites/Bookmarks": { path: "../../apps/online/onlinelinks.html", tags: ["bookmarks", "links", "favorites", "web"] },
  "Notes App": { path: "../../apps/online/onlinenotes.html", tags: ["notes", "writing", "journal"] },
  "Jobs Calendar": { path: "../../apps/online/onlineschedule.html", tags: ["calendar", "appointments", "schedule"] },
  "Jobs Gallery": { path: "../../apps/online/onlinegallery.html", tags: ["gallery", "photos", "images"] },
  "Analytics": { path: "../../apps/online/onlineanalytics.html", tags: ["analytics", "stats", "charts", "data"] },
  "Mileage Logging": { path: "../../apps/online/onlinemileage.html", tags: ["mileage", "miles", "trip"] },
  "Contacts": { path: "../../apps/online/onlinecontacts.html", tags: ["contacts", "phone", "address", "people"] },
  "Password Generator": { path: "../../apps/local/password.html", tags: ["password", "security", "generator"] },
  "Conversion Calculator": { path: "../../apps/local/converter.html", tags: ["conversion", "convert", "math"] },
  "Calculator": { path: "../../apps/local/calc.html", tags: ["calculator", "math", "numbers"] },
  "Wire Counter": { path: "../../apps/local/count.html", tags: ["count", "wires", "electrical"] },
  "Journal": { path: "../../apps/online/onlinejournal.html", tags: ["journal", "writing", "notes"] },
};

const appDisplayNames = Object.keys(appNamesMap);
const iframe = document.getElementById('myIframe');
const dropdownContent = document.getElementById('myDropdown');
let currentIndex = 0;

const THEME_KEY = "theme";
const THEMES = {
  one: "../../assets/css/dark-styles.css",
  two: "../../assets/css/app-styles.css",
  three: "../../assets/css/excel-styles.css",
};

function getSavedTheme() {
  return localStorage.getItem(THEME_KEY) || "two";
}

function resolveThemeStylesheet(doc) {
  return doc.getElementById("stylesheet") || doc.getElementById("app-stylesheet");
}

function applyThemeToIframe(theme) {
  if (!iframe || !iframe.contentDocument) return;
  const doc = iframe.contentDocument;
  const link = resolveThemeStylesheet(doc);
  if (!link) return;

  const href = THEMES[theme] || THEMES.two;
  const resolved = new URL(href, doc.baseURI).toString();
  link.setAttribute("href", resolved);
}

function initThemeSelector() {
  const selector = document.getElementById("themeSelector");
  if (!selector) return;

  const saved = getSavedTheme();
  selector.value = saved;

  selector.addEventListener("change", () => {
    const selected = selector.value;
    localStorage.setItem(THEME_KEY, selected);
    applyThemeToIframe(selected);
  });
}

function resolveAppName(appNameOrIndex) {
  if (typeof appNameOrIndex === "number") {
    return appDisplayNames[appNameOrIndex] || "";
  }
  return String(appNameOrIndex || "");
}

function resolveAppPath(app) {
  if (!app) return "";
  if (app.path) return app.path;
  if (app.filename) return `../../apps/${app.filename}.html`;
  return "";
}

function setIframeSrc(appNameOrIndex) {
  const appName = resolveAppName(appNameOrIndex);
  const app = appNamesMap[appName];
  const path = resolveAppPath(app);
  if (path) {
    document.getElementById("myIframe").src = path;
    localStorage.setItem("lastUsedApp", appName);

    const dropdown = document.getElementById("myDropdown");
    if (dropdown && dropdown.classList.contains("show")) {
      dropdown.classList.remove("show");
    }
  } else {
    console.warn("App path not found for", appName);
  }
}

function generateButtons() {
  dropdownContent.innerHTML = appDisplayNames.map((displayName, index) =>
    `<a onclick="setIframeSrc(${index})">${displayName}</a>`
  ).join('');
}

function loadIframeContent() {
  const sourceName = document.getElementById('iframeSource').value;
  const app = appNamesMap[sourceName];
  const path = resolveAppPath(app) || `../../apps/${sourceName}.html`;
  iframe.src = path;
  localStorage.setItem('lastUsedApp', sourceName);
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
  setupHeaderFooterLogo();
  initThemeSelector();

  if (iframe) {
    iframe.addEventListener("load", () => {
      applyThemeToIframe(getSavedTheme());
    });
  }
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


function filterApps() {
  const searchInput = document.getElementById("appSearch").value.trim().toLowerCase();
  generateAppList(searchInput);
}

function handleSearch(event) {
  if (event.key === "Enter" && event.shiftKey) {
    event.preventDefault();
    const searchValue = document.getElementById("appSearch").value.trim().toLowerCase();

    for (const [name, app] of Object.entries(appNamesMap)) {
      if ((app.filename && app.filename.toLowerCase() === searchValue) || name.toLowerCase() === searchValue) {
        const path = resolveAppPath(app);
        if (path) {
          document.getElementById("myIframe").src = path;
          localStorage.setItem("lastUsedApp", name);
          return;
        }
      }
    }

    const filePath = `../../apps/${searchValue}.html`;
    document.getElementById("myIframe").src = filePath;
    localStorage.setItem("lastUsedApp", searchValue);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.getElementById("myDropdown");
  let closeDropdownTimer;

  dropdown.addEventListener("mouseleave", () => {
    closeDropdownTimer = setTimeout(() => {
      if (dropdown.classList.contains("show")) dropdown.classList.remove("show");
    }, 2000);
  });

  dropdown.addEventListener("mouseenter", () => {
    clearTimeout(closeDropdownTimer);
  });
});