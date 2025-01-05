document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById('projects-container')) {
    populateThumbnails(projects, 'projects-container');
  }

  if (document.getElementById('apps-container')) {
    populateThumbnails(apps, 'apps-container');
  }
});

function populateThumbnails(items, containerId, userLoggedIn) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";  // Clear existing content

  // Define category containers
  const categories = {
    "Cloud": [],
    "Game": [],
    "Other": []  // Default category
  };

  // Categorize items based on the category field (which can have multiple categories)
  items.forEach((item) => {
    if (!item.requiresLogin || (item.requiresLogin && userLoggedIn)) {
      // Split the category string by comma and trim any extra spaces
      const itemCategories = item.category ? item.category.split(',').map(cat => cat.trim()) : ["Other"];

      // Ensure each category exists in the categories object
      itemCategories.forEach(category => {
        if (categories[category]) {
          categories[category].push(item);
        } else {
          categories["Other"].push(item);  // If the category doesn't exist, default to "Other"
        }
      });
    }
  });

  // Display items in their respective categories
  Object.keys(categories).forEach((category) => {
    if (categories[category].length > 0) {
      const categorySection = document.createElement("div");
      categorySection.classList.add("category-section");

      const categoryTitle = document.createElement("h2");
      categoryTitle.textContent = category;
      categorySection.appendChild(categoryTitle);

      const categoryContainer = document.createElement("div");
      categoryContainer.classList.add("thumbnail-container");

      categories[category].forEach((item) => {
        const thumbnailDiv = document.createElement("div");
        thumbnailDiv.classList.add("thumbnail");

        const link = document.createElement("a");
        link.href = item.link;
        link.target = "_blank";

        const img = document.createElement("img");
        img.src = item.image && item.image.trim() !== "" ? item.image : "assets/img/default.png";
        img.alt = item.title;

        img.onerror = function () {
          this.onerror = null;
          this.src = "assets/img/default.png";
        };

        const p = document.createElement("p");
        p.textContent = item.title;

        link.appendChild(img);
        link.appendChild(p);
        thumbnailDiv.appendChild(link);
        categoryContainer.appendChild(thumbnailDiv);
      });

      categorySection.appendChild(categoryContainer);
      container.appendChild(categorySection);
    }
  });
}

function toggleMenu() {
  const nav = document.querySelector('nav');
  const hamburger = document.querySelector('.hamburger');
  
  nav.classList.toggle('active');
  hamburger.classList.toggle('active');

  // Only add the click event listener when the menu is active (opened)
  if (nav.classList.contains('active')) {
    document.addEventListener('click', handleOutsideClick);
  } else {
    document.removeEventListener('click', handleOutsideClick);
  }
}

function handleOutsideClick(event) {
  const nav = document.querySelector('nav');
  const hamburger = document.querySelector('.hamburger');
  
  // If the clicked element is not the nav or the hamburger icon, close the nav
  if (!nav.contains(event.target) && !hamburger.contains(event.target)) {
    nav.classList.remove('active');
    hamburger.classList.remove('active');
    
    // Remove the event listener once the menu is closed
    document.removeEventListener('click', handleOutsideClick);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  fetch("header.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("header-placeholder").innerHTML = data;
    });

  fetch("footer.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("footer-placeholder").innerHTML = data;
    });
});