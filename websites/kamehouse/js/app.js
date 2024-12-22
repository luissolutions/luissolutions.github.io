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
    "Live Tasker": "livetasker",
    "Live Schedule": "liveschedule",
    "Live Notes": "livenotes",
    "Live Budget": "livebudget",
    "Live Gas Tracker": "livegas",
    "Live Contacts": "livecontacts",
    "Live Learning Tool": "livelearn",
    "Live Links": "livelinks",
    "Live Analytics": "liveanalytics",
    "Live Chat": "livechat",
    "Live Chess": "livechess",
    "Live Database": "livedatabase",
    "Live Gallery": "livegallery",
    "Live Inventory": "liveinventory",
    "Live Invoice": "liveinvoice",
    "Live Job Tracker": "livejob",
    "Live Math Game": "livemathgame",
    "Live Mileage Tracker": "livemileage",
    "Live Registration": "livereg",
    "Live Show": "liveshow",
    "Live Text Editor": "livetext",
    "Live Timer": "livetimer",
    "Cheat Sheet": "cheatsheet",
    "Viewer": "viewer",
    "Information Viewer": "info",
    "Data Loader": "loader",
    "Password Generator": "password",
    "Blackjack": "blackjack",
    "Budget App": "budget",
    "Calculator": "calc",
    "Chess Game": "chess",
    "Contact Manager": "contact",
    "Conversion Tool": "conversion",
    "Data Converter": "converting",
    "Counter": "count",
    "Gas Tracker": "gas",
    "Invoice Maker": "invoice",
    "Learning Tool": "learn",
    "Saved Links": "links",
    "Math Game": "mathgame",
    "Mileage Tracker": "mileage",
    "Mouse Game": "mousegame",
    "Notes App": "notes",
    "Percentage Calculator": "percent",
    "Task Manager": "tasker",
    "Timer": "timer",
    "Local Budget": "localbudget",
    "Local Gallery": "localgallery",
    "Local Gas Tracker": "localgas",
    "Local Inventory": "localinventory",
    "Local Mileage Tracker": "localmileage",
    "Local Timer": "localtimer",
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