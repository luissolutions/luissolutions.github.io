hamburger = document.querySelector(".hamburger");

hamburger.onclick = function() {
    navBar = document.querySelector(".nav-buttons");
    navBar.classList.toggle("active");
}

function showDescription(id) {
  // Get the clicked description
  var x = document.getElementById(id);

  // Toggle the display of the clicked description
  if (x.style.display === 'block') {
      x.style.display = 'none';
  } else {
      // Hide all descriptions
      var descriptions = document.querySelectorAll('.description');
      descriptions.forEach(function (desc) {
          desc.style.display = 'none';
      });

      x.style.display = 'block';
  }
}

const descriptions = document.querySelectorAll('.description');
const closeButtons = document.querySelectorAll('.closeBtn');

closeButtons.forEach(button => {
  button.addEventListener('click', (event) => {
    const description = event.target.closest('.description');
    if (description) {
      description.style.display = 'none';
    }
  });
});

// Add click event listener to the window
window.addEventListener('click', (event) => {
  descriptions.forEach(description => {
    if (event.target === description) {
      description.style.display = 'none';
    }
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const padlock = document.getElementById('padlock');
  const sTokenData = localStorage.getItem('sToken');

  try {
    const tokenData = JSON.parse(sTokenData);

    if (tokenData && tokenData.sToken === "7777777") {
      padlock.style.filter = 'invert(1)';
    }
  } catch (error) {
    console.error('Error parsing sToken data:', error);
  }

  padlock.addEventListener('dblclick', function () {
    window.location.href = 'login.html';
  });
});

