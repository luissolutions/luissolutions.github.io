const content = document.querySelector('main');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const sidebar = document.getElementById('sidebar');

let isDarkModeActive = localStorage.getItem('darkMode') === 'true';
applyDarkMode(isDarkModeActive);

darkModeToggle.checked = isDarkModeActive;

function applyDarkMode(isDarkMode) {
    content.style.filter = isDarkMode ? 'invert(1)' : 'none';

    if (sidebar) {
        sidebar.style.filter = isDarkMode ? 'invert(1)' : 'none';
    }
}

darkModeToggle.addEventListener('change', () => {
    isDarkModeActive = darkModeToggle.checked;
    applyDarkMode(isDarkModeActive);
    localStorage.setItem('darkMode', isDarkModeActive.toString());
});