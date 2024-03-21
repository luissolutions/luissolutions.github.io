document.addEventListener('DOMContentLoaded', (event) => {
    const toggleButton = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    const contentItems = sidebar.querySelectorAll('.sidebar-content');

    // Function to toggle sidebar visibility
    function toggleSidebar() {
        sidebar.classList.toggle('hidden');

        // Toggle button class and text based on sidebar visibility
        toggleButton.classList.toggle('xbutton');
        if (!sidebar.classList.contains('hidden')) {
            toggleButton.innerText = "Close Sidebar";
            // Delay content animation until sidebar animation completes
            setTimeout(() => {
                contentItems.forEach(item => {
                    item.classList.add('visible');
                });
            }, 500); // Adjust timing to match sidebar animation
        } else {
            toggleButton.innerText = "Open Sidebar";
            // Immediately hide content if sidebar is hidden
            contentItems.forEach(item => {
                item.classList.remove('visible');
            });
        }
    }

    // Event listener for the toggle button
    toggleButton.addEventListener('click', toggleSidebar);

    // Event listener for clicks outside the sidebar to close it
    document.addEventListener('click', (event) => {
        const isClickInsideSidebar = sidebar.contains(event.target);
        const isClickOnToggleButton = toggleButton.contains(event.target);

        // Close the sidebar if a click outside is detected and the sidebar is open
        if (!isClickInsideSidebar && !isClickOnToggleButton && !sidebar.classList.contains('hidden')) {
            toggleSidebar(); // Use the toggleSidebar function to close and update UI
        }
    });
});
