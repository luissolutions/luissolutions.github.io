hamburger = document.querySelector(".hamburger");

hamburger.onclick = function () {
  navBar = document.querySelector(".nav-buttons");
  navBar.classList.toggle("active");
}

function showDescription(id) {
  // Get the clicked descript
  var x = document.getElementById(id);

  // Toggle the display of the clicked descript
  if (x.style.display === 'block') {
    x.style.display = 'none';
  } else {
    // Hide all descripts
    var descripts = document.querySelectorAll('.descript');
    descripts.forEach(function (desc) {
      desc.style.display = 'none';
    });

    x.style.display = 'block';
  }
}

const descripts = document.querySelectorAll('.descript');
const closeButtons = document.querySelectorAll('.closeBtn');

closeButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    const descript = e.target.closest('.descript');
    if (descript) {
      descript.style.display = 'none';
    }
  });
});

// Add click event listener to the window
window.addEventListener('click', (event) => {
  descripts.forEach(descript => {
    if (event.target === descript) {
      descript.style.display = 'none';
    }
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const padlock = document.getElementById('padlock');
  const sToken = localStorage.getItem('sToken');

  try {
    if (sToken === "7777777") {
      padlock.style.filter = 'invert(1)';
    }
  } catch (error) {
    console.error('Error parsing sToken data:', error);
  }

  padlock.addEventListener('dblclick', function () {
    window.location.href = 'notes.html';
  });
});

