
document.addEventListener('DOMContentLoaded', (event) => {
    const toggleButton = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    const contentItems = sidebar.querySelectorAll('.sidebar-content');

    toggleButton.addEventListener('click', () => {
        sidebar.classList.toggle('hidden');

        var button = document.getElementById('toggleSidebar');

        // Check if sidebar is now visible
        if (!sidebar.classList.contains('hidden')) {
            button.classList.toggle('xbutton');
            button.innerText = "Close Sidebar";
            // Delay content animation until sidebar animation completes
            setTimeout(() => {
                contentItems.forEach(item => {
                    item.classList.add('visible');
                });
            }, 500); // Adjust timing to match sidebar animation
        } else {
            button.classList.toggle('xbutton')
            button.innerText = "Open Sidebar";
            // Immediately hide content if sidebar is hidden
            contentItems.forEach(item => {
                item.classList.remove('visible');
            });
        }
    });
});
