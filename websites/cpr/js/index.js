// Get references to the necessary elements using getElementById
const loginLink = document.getElementById('loginLink');
const model = document.getElementById('model');

// Function to load and inject the registration form
function loadRegistrationForm() {
  fetch('reg.html')
    .then(response => response.text())
    .then(html => {
      // Inject the loaded HTML into the model
      model.innerHTML = html;
      
      // Attach a click event listener to the close button
      const closeBtn = model.querySelector('#closeBtn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          model.style.display = 'none';
        });
      }

      model.style.display = 'block';
    })
    .catch(error => {
      console.error('Error loading registration form:', error);
    });
}

// Show the model when the link is clicked and load the registration form
loginLink.addEventListener('click', (event) => {
  event.preventDefault(); // Prevent the default behavior of the link (e.g., navigation)

  loadRegistrationForm();
});

// Hide the model when clicking outside of it
window.addEventListener('click', (event) => {
  if (event.target === model) {
    model.style.display = 'none';
  }
});
