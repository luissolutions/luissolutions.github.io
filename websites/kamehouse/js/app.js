document.addEventListener("DOMContentLoaded", () => {
  const BASE_DIR = "../../";
  const sidebar = document.getElementById("app-sidebar");
  const appFrame = document.getElementById("app-frame");
  const toggleSidebarButton = document.getElementById("toggleSidebarButton");
  const appList = document.createElement("ul");
  const LOCAL_STORAGE_KEY = "lastOpenedApp";

  const components = {
    header: `components/header.html`,
    footer: `components/footer.html`,
  };

  const apps = {
    "Blackjack": "blackjack",
    "Budget App": "budget",
    "Calculator": "calc",
    "Cheat Sheet": "cheatsheet",
    "Chess Game": "chess",
    "Contact Manager": "contact",
    "Conversion Tool": "conversion",
    "Counter": "count",
    "Data Converter": "converting",
    "Data Loader": "loader",
    "Gas Tracker": "gas",
    "Information Viewer": "info",
    "Invoice Maker": "invoice",
    "Learning Tool": "learn",
    "Live Analytics": "liveanalytics",
    "Live Budget": "livebudget",
    "Live Chat": "livechat",
    "Live Chess": "livechess",
    "Live Contacts": "livecontacts",
    "Live Database": "livedatabase",
    "Live Gallery": "livegallery",
    "Live Gas Tracker": "livegas",
    "Live Inventory": "liveinventory",
    "Live Invoice": "liveinvoice",
    "Live Job Tracker": "livejob",
    "Live Learning Tool": "livelearn",
    "Live Links": "livelinks",
    "Live Math Game": "livemathgame",
    "Live Mileage Tracker": "livemileage",
    "Live Notes": "livenotes",
    "Live Registration": "livereg",
    "Live Schedule": "liveschedule",
    "Live Show": "liveshow",
    "Live Tasker": "livetasker",
    "Live Text Editor": "livetext",
    "Live Timer": "livetimer",
    "Local Budget": "localbudget",
    "Local Gallery": "localgallery",
    "Local Gas Tracker": "localgas",
    "Local Inventory": "localinventory",
    "Local Mileage Tracker": "localmileage",
    "Local Timer": "localtimer",
    "Math Game": "mathgame",
    "Mileage Tracker": "mileage",
    "Mouse Game": "mousegame",
    "Notes App": "notes",
    "Password Generator": "password",
    "Percentage Calculator": "percent",
    "Saved Links": "links",
    "Task Manager": "tasker",
    "Timer": "timer",
    "Viewer": "viewer",
  };

  Object.entries(components).forEach(([id, url]) => {
    loadComponent(`#${id}`, url);
  });

  Object.entries(apps).forEach(([name, file]) => {
    const listItem = document.createElement("li");
    listItem.textContent = name;
    listItem.dataset.url = `${BASE_DIR}apps/${file}.html`;
    listItem.addEventListener("click", () => {
      const appUrl = listItem.dataset.url;
      appFrame.src = listItem.dataset.url;
      localStorage.setItem(LOCAL_STORAGE_KEY, appUrl);
    });
    appList.appendChild(listItem);
  });

  sidebar.appendChild(appList);

  const lastOpenedApp = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (lastOpenedApp) {
    appFrame.src = lastOpenedApp;
  }

  toggleSidebarButton.addEventListener("click", () => {
    const isHidden = sidebar.classList.toggle("hidden");
    toggleSidebarButton.textContent = isHidden ? "☰ Show UI" : "☰ Hide UI";

    const rootStyles = document.documentElement.style;
    if (isHidden) {
      rootStyles.setProperty("--headerHeight", "0px");
      rootStyles.setProperty("--footerHeight", "0px");
      header.style.display = "none";
      footer.style.display = "none";
    } else {
      rootStyles.setProperty("--headerHeight", "62px");
      rootStyles.setProperty("--footerHeight", "35px");
      header.style.display = "block";
      footer.style.display = "block";
    }
  });

  loginButton.addEventListener("click", () => {
    appFrame.src = `../bma/login.html`;
  });

  async function loadComponent(selector, url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load component: ${url}`);
      document.querySelector(selector).innerHTML = await response.text();
    } catch (error) {
      console.error(error);
    }
  }
});