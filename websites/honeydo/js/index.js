const headerContainer = document.getElementById('headerContainer');
const bodyContainer = document.getElementById('bodyContainer');
const footerContainer = document.getElementById('footerContainer');

// Function to load content into a container
function loadContent(container, path) {
    return fetch(path)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error fetching ${path}: ${response.statusText}`);
            }
            return response.text();
        })
        .then(html => {
            container.innerHTML = html;
        });
}

function handleNavClick(event) {
    event.preventDefault();

    const pageName = event.target.getAttribute('data-page');
    loadPage(bodyContainer, `pages/${pageName}`);
}

function loadPage(container, path) {
    loadContent(container, path)
        .then(() => {
            // If the header was loaded, attach event listeners to the nav links
            if (container === headerContainer) {
                document.querySelectorAll('[data-page]').forEach(link => {
                    link.addEventListener('click', handleNavClick);
                });
            }
        });
}

// Initial content loading
loadPage(headerContainer, 'header.html');
loadPage(bodyContainer, 'pages/home.html');
loadPage(footerContainer, 'footer.html');

// Model 

const model = document.getElementById('model');
const quoteBtn = document.getElementById('quoteBtn');
const closeBtn = document.getElementById('closeBtn'); // Get the close button element

// Show the modal when the "Get a Quote" button is clicked
quoteBtn.addEventListener('click', () => {
    model.style.display = 'block';
});

// Hide the modal when the "X" button is clicked
closeBtn.addEventListener('click', () => {
    model.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === model) {
        model.style.display = 'none';
    }
});
