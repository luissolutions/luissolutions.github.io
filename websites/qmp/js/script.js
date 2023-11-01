const filterSwitch = document.getElementById('filter-switch');
const content = document.querySelector('body');

let isFilterActive = false;

filterSwitch.addEventListener('click', () => {
    isFilterActive = !isFilterActive;

    if (isFilterActive) {
        content.style.filter = 'invert(1)';
    } else {
        content.style.filter = 'none';
    }
});
