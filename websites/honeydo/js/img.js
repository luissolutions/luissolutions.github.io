document.addEventListener('DOMContentLoaded', function () {
    const sliderContainer = document.getElementById('slider-container');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');

    let currentImageIndex = 0;
    const imageFilenames = [
        'img1.png',
        'img2.png',
        'img3.png',
        'img4.png',
        'img5.png'
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
        img.src = `images/img/${currentImageFilename}`;
        img.className = 'slider-image';
        img.id = 'currentImage'; // Add an id to the image

        // Append the image to the container
        sliderContainer.appendChild(img);

        // Add a click event listener to the image
        img.addEventListener('click', handleImageClick);
    }

    function handleImageClick(event) {
        const image = document.getElementById('currentImage');
        const imageWidth = image.offsetWidth;
        const clickX = event.offsetX;

        // Define the threshold for left and right clicks (10% of the image width)
        const threshold = 0.2 * imageWidth;

        // Determine if the click is within the left or right thresholds
        if (clickX <= threshold) {
            // Clicked on the left 10%, go to the previous image
            changeSlide(-1);
        } else if (clickX >= imageWidth - threshold) {
            // Clicked on the right 10%, go to the next image
            changeSlide(1);
        }
    }

    // Add event listeners for Previous and Next buttons
    prevButton.addEventListener('click', () => {
        changeSlide(-1); // Move to the previous image
    });

    nextButton.addEventListener('click', () => {
        changeSlide(1); // Move to the next image
    });

    // Initialize the slider
    initSlider();
});
