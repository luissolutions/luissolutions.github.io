const headerContainer = document.getElementById('headerContainer');
const bodyContainer = document.getElementById('bodyContainer');
const footerContainer = document.getElementById('footerContainer');
const link = document.querySelector('link[rel="stylesheet"]');

// Content Loading Functions
function loadContent(container, path) {
  fetch(path)
    .then(response => response.text())
    .then(html => {
      container.innerHTML = html;
    })
    .catch(error => {
      console.error(`Error loading content from ${path}: ${error}`);
    });
}

function loadHeader() {
  loadContent(headerContainer, 'header.html');
}

function loadFooter() {
  loadContent(footerContainer, 'footer.html');
}

function loadPage(pageName) {
  console.log(`Loading page: ${pageName}`);
  let pathPages = `pages/${pageName}`;
  let pathApps = `apps/${pageName}`;

  fetch(pathPages)
    .then(response => {
      if (!response.ok) {
        return fetch(pathApps);
      }
      return response;
    })
    .then(response => {
      if (response.ok) {
        return response.text();
      }
      throw new Error(`File not found in either 'pages' or 'apps' folder.`);
    })
    .then(html => {
      bodyContainer.innerHTML = html;
      localStorage.setItem('selectedPage', JSON.stringify({ pageName }));

      let handler = handlers[pageName];
      console.log(`Handler for ${pageName}: ${handler}`);
      if (handler) {
        handler();
      }
    })
    .catch(error => {
      console.error(`Error loading ${pageName}: ${error}`);
    });
}

// Event Handlers
function handleOutsideClick(event) {
  const navBar = document.querySelector('nav');
  const hamburger = document.querySelector('.hamburger');

  if (!navBar.contains(event.target) && !hamburger.contains(event.target)) {
    navBar.classList.remove('active');
  }
}

function toggleMenu() {
  const navBar = document.querySelector("nav");
  navBar.classList.toggle("active");

  const dropdownLinks = document.querySelectorAll("nav a");
  dropdownLinks.forEach(link => {
    link.addEventListener('click', () => {
      navBar.classList.remove('active');
    });
  });
}

// Theme Handling
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  link.href = savedTheme;

  const radioButton = document.querySelector(`input[value="${savedTheme}"]`);
  if (radioButton) {
    radioButton.checked = true;
  }
}

// Initial Content Loading
loadHeader();
loadFooter();

let selectedPage = localStorage.getItem('selectedPage');
if (selectedPage) {
  selectedPage = JSON.parse(selectedPage);
  loadPage(selectedPage.pageName);
} else {
  loadPage('home.html');
}

document.addEventListener('click', handleOutsideClick);


// Function to load page based on user input
function loadPageFromInput() {
  const inputElement = document.getElementById('pageInput');
  const userInput = inputElement.value.trim();

  if (userInput) {
    loadPage(userInput + '.html');
  }
}