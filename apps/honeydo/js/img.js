document.addEventListener('DOMContentLoaded', function () {
    const sliderContainer = document.getElementById('slider-container');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');

    let currentImageIndex = 0;
    const imageFilenames = [
        'img1.png', // Replace with your actual image filenames
        'img2.png',
        'img3.jpg',
        // Add more image filenames as needed
    ];

    function initSlider() {

        // Initial display
        displayCurrentImage();
    }

    function changeSlide(n) {
        currentImageIndex += n;

        // Wrap around to the first image if at the end
        if (currentImageIndex >= imageFilenames.length) {
            currentImageIndex = 0;
        }
        // Wrap around to the last image if at the beginning
        else if (currentImageIndex < 0) {
            currentImageIndex = imageFilenames.length - 1;
        }

        displayCurrentImage();
    }

    function displayCurrentImage() {
        // Clear the container
        sliderContainer.innerHTML = '';

        // Create an image element and set its source
        const currentImageFilename = imageFilenames[currentImageIndex];
        const img = document.createElement('img');
        img.src = `../images/img/${currentImageFilename}`;
        img.className = 'slider-image';

        // Append the image to the container
        sliderContainer.appendChild(img);
    }

    // Initialize the slider
    initSlider();
});
