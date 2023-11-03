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



const stylesheetInput = document.getElementById('stylesheet-input');
const stylesheetLink = document.getElementById('stylesheet');

stylesheetInput.addEventListener('input', () => {
    const fileName = stylesheetInput.value.trim();
    if (fileName) {
        // Add .css extension if not present
        const cssFileName = fileName.endsWith('.css') ? fileName : `${fileName}.css`;
        stylesheetLink.href = cssFileName;
    } else {
        // Reset to the default stylesheet if the input is empty
        stylesheetLink.href = 'default.css';
    }
});

document.addEventListener('dblclick', (event) => {
    const target = event.target;

    // Check if the double-clicked element has the #finished ID
    if (target.id === 'finished') {
        // Find the #unfinished element and change its display to "block"
        const unfinishedElement = document.querySelector('#unfinished');
        if (unfinishedElement) {
            unfinishedElement.style.display = 'block';
        }
    }
});
