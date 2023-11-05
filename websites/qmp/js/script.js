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

const hideParentCheckboxes = document.querySelectorAll('.hide-parent-checkbox');

hideParentCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        const parentDiv = checkbox.closest('div');
        if (parentDiv) {
            parentDiv.style.display = checkbox.checked ? 'none' : 'block';
        }
    });
});
