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
  container.innerHTML = "";

  items.forEach((item) => {
    if (!item.requiresLogin || (item.requiresLogin && userLoggedIn)) {
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
      container.appendChild(thumbnailDiv);
    }
  });
}

function toggleMenu() {
  const nav = document.querySelector('nav');
  const hamburger = document.querySelector('.hamburger');
  nav.classList.toggle('active');
  hamburger.classList.toggle('active');
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