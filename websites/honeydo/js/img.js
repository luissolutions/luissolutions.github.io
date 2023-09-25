document.addEventListener('DOMContentLoaded', function () {
    const photoContainer = document.getElementById('photoContainer');
    const subfolderRadioButtons = document.getElementById('subfolderRadioButtons');

    let currentPhotoIndex = 0;
    let photoUrls = [];

    // Fetch photo URLs and populate subfolders
    function fetchPhotoUrls() {
        fetch('../honeydo/js/images.json')
            .then(response => response.json())
            .then(urls => {
                photoUrls = urls;
                populateSubfolders();
                displayCurrentPhoto();
            })
            .catch(error => {
                console.error('Error loading photo URLs:', error);
            });
    }

    function populateSubfolders() {
        const subfolders = extractSubfolders(photoUrls);
        subfolderRadioButtons.innerHTML = ''; // Clear any existing radio buttons

        subfolders.forEach(folder => {
            const radioLabel = document.createElement('label');
            radioLabel.textContent = folder;

            const radioButton = document.createElement('input');
            radioButton.type = 'radio';
            radioButton.name = 'subfolder'; // Set the same 'name' for radio buttons to make them mutually exclusive
            radioButton.value = folder;

            radioLabel.appendChild(radioButton);
            subfolderRadioButtons.appendChild(radioLabel);
        });

        // Add an event listener to handle changes in the selected subfolder
        subfolderRadioButtons.addEventListener('change', handleSubfolderChange);
    }

    function extractSubfolders(urls) {
        const folderSet = new Set();
        urls.forEach(url => {
            const splitPath = url.split('/');
            if (splitPath.length > 3) {
                folderSet.add(splitPath[4]);
            }
        });
        return [...folderSet];
    }

    function displayCurrentPhoto(selectedSubFolder) {
        const filteredUrls = photoUrls.filter(url => url.includes(`/${selectedSubFolder}/`));

        photoContainer.innerHTML = '';

        if (currentPhotoIndex >= 0 && currentPhotoIndex < filteredUrls.length) {
            const img = createPhotoElement(filteredUrls[currentPhotoIndex]);
            photoContainer.appendChild(img);
        }
    }

    function createPhotoElement(src) {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'photo';
    
        img.addEventListener('click', function (event) {
            const clickX = event.clientX - img.getBoundingClientRect().left;
            const imgWidth = img.offsetWidth;
    
            if (clickX < imgWidth / 2) {
                loadPreviousImage();
            } else {
                loadNextImage();
            }
        });
    
        return img;
    }    

    function loadNextImage() {
        const selectedSubFolder = document.querySelector('input[name="subfolder"]:checked').value;
        const filteredUrls = photoUrls.filter(url => url.includes(`/${selectedSubFolder}/`));
    
        currentPhotoIndex = (currentPhotoIndex + 1) % filteredUrls.length;
        displayCurrentPhoto(selectedSubFolder);
    }
    
    function loadPreviousImage() {
        const selectedSubFolder = document.querySelector('input[name="subfolder"]:checked').value;
        const filteredUrls = photoUrls.filter(url => url.includes(`/${selectedSubFolder}/`));
    
        currentPhotoIndex = (currentPhotoIndex - 1 + filteredUrls.length) % filteredUrls.length;
        displayCurrentPhoto(selectedSubFolder);
    }    

    function handleSubfolderChange(event) {
        const selectedSubFolder = event.target.value;
        currentPhotoIndex = 0;
        displayCurrentPhoto(selectedSubFolder);
    }

    // Call the function to fetch data and set up the page
    fetchPhotoUrls();
});
