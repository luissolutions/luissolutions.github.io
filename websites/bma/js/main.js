const content = document.querySelector('body');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const images = document.querySelectorAll('img');

let isDarkModeActive = localStorage.getItem('darkMode') === 'true';
applyDarkMode(isDarkModeActive);

darkModeToggle.checked = isDarkModeActive;

function applyDarkMode(isDarkMode) {
    // Apply dark mode to the main content
    content.style.filter = isDarkMode ? 'invert(1)' : 'none';

    // Apply to all images in the main document
    images.forEach(img => img.style.filter = isDarkMode ? 'invert(1)' : 'none');

    // Apply to all iframes
    document.querySelectorAll('iframe').forEach(iframe => {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const iframeImages = iframeDoc.querySelectorAll('img');

            // Counter-invert images in the iframe
            iframeImages.forEach(img => img.style.filter = isDarkMode ? 'invert(1)' : 'none');
        } catch (error) {
            console.error("Couldn't access iframe contents", error);
        }
    });
}

darkModeToggle.addEventListener('change', () => {
    isDarkModeActive = darkModeToggle.checked;
    applyDarkMode(isDarkModeActive);
    localStorage.setItem('darkMode', isDarkModeActive.toString());
});
