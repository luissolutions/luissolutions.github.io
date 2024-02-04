function loadContent(event, path) {
    event.preventDefault();

    fetch(path)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(html => {
            const bodyContainer = document.getElementById('bodyContainer');
            bodyContainer.innerHTML = html;

            // Process all scripts in the loaded content
            const scripts = bodyContainer.querySelectorAll('script');
            scripts.forEach(script => {
                if (script.type === 'module') {
                    // Handle module scripts
                    const moduleScript = document.createElement('script');
                    moduleScript.type = 'module';
                    if (script.src) {
                        moduleScript.src = script.src;
                    } else {
                        moduleScript.textContent = script.textContent;
                    }
                    script.parentNode.replaceChild(moduleScript, script);
                } else {
                    // Handle regular scripts
                    if (script.src) {
                        const newScript = document.createElement('script');
                        newScript.src = script.src;
                        script.parentNode.replaceChild(newScript, script);
                    } else {
                        eval(script.textContent);
                    }
                }
            });
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}

document.addEventListener('DOMContentLoaded', (event) => {
    const toggleButton = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');

    toggleButton.addEventListener('click', () => {
        sidebar.classList.toggle('hidden');
    });
});
