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


