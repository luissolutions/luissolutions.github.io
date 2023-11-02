const filterSwitch = document.getElementById('filter-switch');
const content = document.querySelector('body');
const darkModeToggle = document.getElementById('dark-mode-toggle');

let isFilterActive = localStorage.getItem('darkMode') === 'true';

if (isFilterActive) {
    content.style.filter = 'invert(1)';
} else {
    content.style.filter = 'none';
}

darkModeToggle.checked = localStorage.getItem('darkMode') === 'true';

darkModeToggle.addEventListener('change', () => {
    const isDarkModeEnabled = darkModeToggle.checked;

    if (isDarkModeEnabled) {
        content.style.filter = 'invert(1)';
    } else {
        content.style.filter = 'none';
    }

    localStorage.setItem('darkMode', isDarkModeEnabled.toString());
}); 