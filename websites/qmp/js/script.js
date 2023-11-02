const filterSwitch = document.getElementById('filter-switch');
const content = document.querySelector('body');

let isFilterActive = localStorage.getItem('darkMode') === 'true';

if (isFilterActive) {
    content.style.filter = 'invert(1)';
} else {
    content.style.filter = 'none';
}

filterSwitch.addEventListener('click', () => {
    isFilterActive = !isFilterActive;

    if (isFilterActive) {
        content.style.filter = 'invert(1)';
    } else {
        content.style.filter = 'none';
    }

    localStorage.setItem('darkMode', isFilterActive.toString());
});

