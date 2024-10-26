const content = document.querySelector('main');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const sidebar = document.getElementById('sidebar');

let isDarkModeActive = localStorage.getItem('darkMode') === 'true';
applyDarkMode(isDarkModeActive);

darkModeToggle.checked = isDarkModeActive;

function applyDarkMode(isDarkMode) {
    content.classList.toggle('dark-mode', isDarkMode);
    sidebar.classList.toggle('dark-mode', isDarkMode);

    const iframe = document.getElementById('myIframe');
    if (iframe && iframe.contentWindow) {
        const iframeDocument = iframe.contentWindow.document;

        try {
            const images = iframeDocument.querySelectorAll('img');
            images.forEach(img => img.classList.toggle('revert-image', isDarkMode));
        } catch (error) {
            console.error('Could not access iframe images due to cross-origin restrictions');
        }
    }
}

darkModeToggle.addEventListener('change', () => {
    isDarkModeActive = darkModeToggle.checked;
    applyDarkMode(isDarkModeActive);
    localStorage.setItem('darkMode', isDarkModeActive.toString());
});