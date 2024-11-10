const content = document.querySelector('main');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const sidebar = document.getElementById('sidebar');

let isDarkModeActive = localStorage.getItem('darkMode') === 'true';
applyDarkMode(isDarkModeActive);

if (darkModeToggle) {
    darkModeToggle.checked = isDarkModeActive;

    darkModeToggle.addEventListener('change', () => {
        isDarkModeActive = darkModeToggle.checked;
        applyDarkMode(isDarkModeActive);
        localStorage.setItem('darkMode', isDarkModeActive.toString());
    });
}

function applyDarkMode(isDarkMode) {
    if (content) {
        content.classList.toggle('dark-mode', isDarkMode);
    }
    if (sidebar) {
        sidebar.classList.toggle('dark-mode', isDarkMode);
    }

    const iframe = document.getElementById('myIframe');
    if (iframe && iframe.contentWindow) {
        try {
            const iframeDocument = iframe.contentWindow.document;
            const images = iframeDocument.querySelectorAll('img');
            images.forEach(img => img.classList.toggle('revert-image', isDarkMode));
        } catch (error) {
            console.error('Could not access iframe images due to cross-origin restrictions');
        }
    }
}