document.addEventListener('DOMContentLoaded', () => {
    loadContent('header.html', 'headerContainer', setupNavigation);
    loadContent('pages/home.html', 'bodyContainer');
    loadContent('footer.html', 'footerContainer');
});

function loadContent(path, containerId, callback) {
    fetch(path)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(html => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = html;
                if (callback) {
                    callback();
                }
            }
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('nav a[data-page]');
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const path = `pages/${link.getAttribute('data-page')}.html`;
            loadContent(path, 'bodyContainer');
        });
    });
}
