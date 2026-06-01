document.addEventListener("DOMContentLoaded", () => {
  const BASE_DIR = "../../apps/";
  const storage = {
    active: "kamehouse.activeApp",
    favorites: "kamehouse.favoriteApps",
    recent: "kamehouse.recentApps",
    sidebar: "kamehouse.sidebarHidden",
  };

  const apps = [
    app("Blackjack", "blackjack", "Games", "Practice card play in a fast local table."),
    app("Budget App", "budget", "Business", "Plan income, expenses, and simple spending targets."),
    app("Calculator", "calc", "Tools", "Run quick arithmetic from inside the workspace."),
    app("Cheat Sheet", "cheatsheet", "Learning", "Reference commands, syntax, and study notes."),
    app("Chess Game", "chess", "Games", "Play chess in a local board view."),
    app("Contact Manager", "contact", "Business", "Track people, phone numbers, and customer notes."),
    app("Conversion Tool", "conversion", "Tools", "Convert common units and values."),
    app("Counter", "count", "Tools", "Count reps, events, inventory, or field checks."),
    app("Data Converter", "converting", "Tools", "Transform data formats for quick cleanup."),
    app("Data Loader", "loader", "Tools", "Load and preview app data."),
    app("Gas Tracker", "gas", "Field Ops", "Track fuel entries for work and travel."),
    app("Information Viewer", "info", "Tools", "View saved information pages."),
    app("Invoice Maker", "invoice", "Business", "Draft basic invoices and service totals."),
    app("Learning Tool", "learn", "Learning", "Study and review learning material."),
    app("Live Analytics", "liveanalytics", "Live", "Monitor live metrics and business signals."),
    app("Live Budget", "livebudget", "Live", "Sync budget data through the live app."),
    app("Live Chat", "livechat", "Live", "Open the live messaging workspace."),
    app("Live Chess", "livechess", "Live", "Run the connected chess board."),
    app("Live Contacts", "livecontacts", "Live", "Manage synced contacts."),
    app("Live Database", "livedatabase", "Live", "Inspect live database records."),
    app("Live Gallery", "livegallery", "Live", "Browse synced media and image records."),
    app("Live Gas Tracker", "livegas", "Live", "Track fuel entries with cloud storage."),
    app("Live Inventory", "liveinventory", "Live", "Manage synced inventory items."),
    app("Live Invoice", "liveinvoice", "Live", "Create invoices with live data."),
    app("Live Job Tracker", "livejob", "Live", "Track jobs and field workflow."),
    app("Live Keyboard Tester", "livekeystester", "Tools", "Test keyboard input and key events."),
    app("Live Learning Tool", "livelearn", "Live", "Study with synced learning data."),
    app("Live Links", "livelinks", "Live", "Store and open synced bookmarks."),
    app("Live Math Game", "livemathgame", "Games", "Practice math in a live game mode."),
    app("Live Mileage", "livemileage", "Live", "Track mileage through synced entries."),
    app("Live Notes", "livenotes", "Live", "Write and retrieve synced notes."),
    app("Live Registration", "livereg", "Live", "Handle registration records."),
    app("Live Schedule", "liveschedule", "Live", "Review and manage synced schedules."),
    app("Live Show", "liveshow", "Live", "Display live presentation or show data."),
    app("Live Tasker", "livetasker", "Live", "Manage tasks through the connected app."),
    app("Live Text Editor", "livetext", "Live", "Edit saved text documents."),
    app("Live Timer", "livetimer", "Live", "Run synced timers and time blocks."),
    app("Local Budget", "localbudget", "Local", "Use budget tools without cloud sync."),
    app("Local Gallery", "localgallery", "Local", "Browse local gallery data."),
    app("Local Gas Tracker", "localgas", "Local", "Track fuel without live storage."),
    app("Local Inventory", "localinventory", "Local", "Manage inventory locally."),
    app("Local Mileage", "localmileage", "Local", "Track mileage without live storage."),
    app("Local Timer", "localtimer", "Local", "Run local timers."),
    app("Math Game", "mathgame", "Games", "Practice arithmetic in a simple game."),
    app("Mileage Tracker", "mileage", "Field Ops", "Track trip distances and mileage notes."),
    app("Mouse Game", "mousegame", "Games", "Practice pointer movement and reactions."),
    app("Notes App", "notes", "Tools", "Capture quick notes."),
    app("Password Generator", "password", "Tools", "Generate quick passwords."),
    app("Percentage Calculator", "percent", "Tools", "Calculate discounts, margins, and ratios."),
    app("Saved Links", "links", "Tools", "Store useful web links."),
    app("Task Manager", "tasker", "Business", "Track tasks and small projects."),
    app("Timer", "timer", "Tools", "Run timers and focus blocks."),
    app("Viewer", "viewer", "Tools", "Open simple viewer pages."),
  ];

  const elements = {
    appFrame: document.getElementById("app-frame"),
    appGrid: document.getElementById("app-grid"),
    appSearch: document.getElementById("app-search"),
    categoryFilter: document.getElementById("category-filter"),
    emptyState: document.getElementById("empty-state"),
    favoriteCount: document.getElementById("favorite-count"),
    favoritesList: document.getElementById("favorites-list"),
    loginButton: document.getElementById("login-button"),
    manualApp: document.getElementById("manual-app"),
    manualLoader: document.getElementById("manual-loader"),
    openNewTab: document.getElementById("open-new-tab"),
    recentList: document.getElementById("recent-list"),
    reloadFrame: document.getElementById("reload-frame"),
    showLauncher: document.getElementById("show-launcher"),
    sidebar: document.getElementById("sidebar"),
    toggleSidebar: document.getElementById("toggle-sidebar"),
    totalApps: document.getElementById("total-apps"),
    activeTitle: document.getElementById("active-title"),
    activeDescription: document.getElementById("active-description"),
  };

  let favorites = readArray(storage.favorites);
  let recent = readArray(storage.recent);
  let activeAppId = localStorage.getItem(storage.active);

  hydrateCategories();
  hydrateSidebarState();
  render();

  const activeApp = apps.find((item) => item.id === activeAppId);
  if (activeApp) {
    openApp(activeApp, { keepLauncherHidden: true });
  }

  elements.appSearch.addEventListener("input", renderAppGrid);
  elements.categoryFilter.addEventListener("change", renderAppGrid);
  elements.showLauncher.addEventListener("click", showLauncher);
  elements.toggleSidebar.addEventListener("click", toggleSidebar);
  elements.loginButton.addEventListener("click", () => {
    openExternal("../bma/login.html", "Login", "Business login loaded in the workspace.");
  });
  elements.openNewTab.addEventListener("click", openActiveInNewTab);
  elements.reloadFrame.addEventListener("click", () => {
    if (elements.appFrame.src) elements.appFrame.contentWindow.location.reload();
  });
  elements.manualLoader.addEventListener("submit", (event) => {
    event.preventDefault();
    const file = elements.manualApp.value.trim().replace(/\.html$/i, "");
    if (!file) return;
    openExternal(`${BASE_DIR}${file}.html`, file, "Manually loaded app file.");
    elements.manualApp.value = "";
  });

  function app(name, file, category, description) {
    return {
      id: file,
      name,
      file,
      category,
      description,
      url: `${BASE_DIR}${file}.html`,
    };
  }

  function hydrateCategories() {
    const categories = [...new Set(apps.map((item) => item.category))].sort();
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      elements.categoryFilter.appendChild(option);
    });
  }

  function hydrateSidebarState() {
    const isHidden = localStorage.getItem(storage.sidebar) === "true";
    document.body.classList.toggle("sidebar-hidden", isHidden);
    elements.sidebar.classList.toggle("collapsed", isHidden);
  }

  function render() {
    elements.totalApps.textContent = apps.length;
    renderAppGrid();
    renderQuickLists();
  }

  function renderAppGrid() {
    const query = elements.appSearch.value.trim().toLowerCase();
    const category = elements.categoryFilter.value;
    const filteredApps = apps.filter((item) => {
      const text = `${item.name} ${item.category} ${item.description}`.toLowerCase();
      const matchesQuery = !query || text.includes(query);
      const matchesCategory = category === "all" || item.category === category;
      return matchesQuery && matchesCategory;
    });

    elements.appGrid.innerHTML = "";

    filteredApps.forEach((item) => {
      const card = document.createElement("article");
      card.className = "app-card";
      card.classList.toggle("is-active", item.id === activeAppId);

      const header = document.createElement("div");
      header.className = "app-card-header";

      const title = document.createElement("h3");
      title.textContent = item.name;

      const favoriteButton = document.createElement("button");
      favoriteButton.className = "favorite-button";
      favoriteButton.type = "button";
      favoriteButton.title = favorites.includes(item.id) ? "Remove favorite" : "Add favorite";
      favoriteButton.setAttribute("aria-label", favoriteButton.title);
      favoriteButton.textContent = favorites.includes(item.id) ? "*" : "+";
      favoriteButton.classList.toggle("is-favorite", favorites.includes(item.id));
      favoriteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleFavorite(item.id);
      });

      const description = document.createElement("p");
      description.textContent = item.description;

      const tags = document.createElement("div");
      tags.className = "tag-row";
      tags.innerHTML = `<span class="tag">${item.category}</span><span class="tag">${item.file}.html</span>`;

      header.append(title, favoriteButton);
      card.append(header, description, tags);
      card.addEventListener("click", () => openApp(item));
      elements.appGrid.appendChild(card);
    });

    if (!filteredApps.length) {
      const empty = document.createElement("p");
      empty.textContent = "No apps match that search.";
      elements.appGrid.appendChild(empty);
    }
  }

  function renderQuickLists() {
    elements.favoriteCount.textContent = favorites.length;
    renderQuickList(elements.favoritesList, favorites, "No favorites yet.");
    renderQuickList(elements.recentList, recent, "No recent apps yet.");
  }

  function renderQuickList(list, ids, emptyText) {
    list.innerHTML = "";
    const items = ids.map((id) => apps.find((item) => item.id === id)).filter(Boolean);

    if (!items.length) {
      const emptyItem = document.createElement("li");
      emptyItem.textContent = emptyText;
      emptyItem.style.color = "var(--muted)";
      emptyItem.style.fontSize = "0.9rem";
      list.appendChild(emptyItem);
      return;
    }

    items.slice(0, 6).forEach((item) => {
      const listItem = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `<span>${item.name}</span><span>${item.category}</span>`;
      button.addEventListener("click", () => openApp(item));
      listItem.appendChild(button);
      list.appendChild(listItem);
    });
  }

  function openApp(item, options = {}) {
    activeAppId = item.id;
    localStorage.setItem(storage.active, item.id);
    elements.appFrame.src = item.url;
    elements.activeTitle.textContent = item.name;
    elements.activeDescription.textContent = item.description;
    elements.emptyState.classList.add("hidden");
    elements.appGrid.classList.add("hidden");
    pushRecent(item.id);
    if (!options.keepLauncherHidden) renderAppGrid();
    renderQuickLists();
  }

  function openExternal(url, title, description) {
    activeAppId = "";
    elements.appFrame.src = url;
    elements.activeTitle.textContent = title;
    elements.activeDescription.textContent = description;
    elements.emptyState.classList.add("hidden");
    elements.appGrid.classList.add("hidden");
  }

  function showLauncher() {
    elements.appFrame.removeAttribute("src");
    elements.emptyState.classList.add("hidden");
    elements.appGrid.classList.remove("hidden");
    elements.activeTitle.textContent = "Launcher";
    elements.activeDescription.textContent = "Catalog ready.";
    renderAppGrid();
  }

  function toggleFavorite(id) {
    favorites = favorites.includes(id)
      ? favorites.filter((favoriteId) => favoriteId !== id)
      : [id, ...favorites];
    writeArray(storage.favorites, favorites);
    render();
  }

  function pushRecent(id) {
    recent = [id, ...recent.filter((recentId) => recentId !== id)].slice(0, 8);
    writeArray(storage.recent, recent);
  }

  function toggleSidebar() {
    const isHidden = !document.body.classList.contains("sidebar-hidden");
    document.body.classList.toggle("sidebar-hidden", isHidden);
    elements.sidebar.classList.toggle("collapsed", isHidden);
    localStorage.setItem(storage.sidebar, String(isHidden));
  }

  function openActiveInNewTab() {
    const source = elements.appFrame.getAttribute("src");
    if (source) window.open(source, "_blank");
  }

  function readArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function writeArray(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
});
