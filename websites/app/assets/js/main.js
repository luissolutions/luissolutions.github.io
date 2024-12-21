document.addEventListener("DOMContentLoaded", () => {
  const BASE_DIR = "../../";

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
    "Data Converter": "converting",
    "Counter": "count",
    "Gas Tracker": "gas",
    "Information Viewer": "info",
    "Invoice Maker": "invoice",
    "Learning Tool": "learn",
    "Saved Links": "links",
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
    "Data Loader": "loader",
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
    "Task Manager": "tasker",
    "Timer": "timer",
    "Viewer": "viewer",
  };

  const layout = document.getElementById("layout");
  const sidebar = document.getElementById("app-sidebar");
  const appFrame = document.getElementById("app-frame");
  const toggleSidebarButton = document.getElementById("toggleSidebarButton");

  // Load header and footer components
  Object.entries(components).forEach(([id, url]) => {
    loadComponent(`#${id}`, url);
  });

  // Populate sidebar with app list
  const appList = document.createElement("ul");
  Object.entries(apps).forEach(([name, file]) => {
    const listItem = document.createElement("li");
    listItem.textContent = name;
    listItem.dataset.url = `${BASE_DIR}apps/${file}.html`;
    listItem.addEventListener("click", () => {
      appFrame.src = listItem.dataset.url;
    });
    appList.appendChild(listItem);
  });
  sidebar.appendChild(appList);

  // Sidebar toggle functionality
  toggleSidebarButton.addEventListener("click", () => {
    const isHidden = sidebar.classList.toggle("hidden");
    toggleSidebarButton.textContent = isHidden ? "☰ Show Sidebar" : "☰ Hide Sidebar";
  });

  // Utility function to load components dynamically
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