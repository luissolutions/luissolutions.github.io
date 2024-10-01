document.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.getElementById('headerContainer');
    const bodyContainer = document.getElementById('bodyContainer');
    const footerContainer = document.getElementById('footerContainer');

    let loadedPages = [];  // Keep track of pages that have been loaded.

    async function loadContent(container, path) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Error fetching ${path}: ${response.statusText}`);
        }
        const html = await response.text();
        container.innerHTML = html;
        attachEventListeners(path);

        if (path === 'pages/login.html') {
            try {
                const { attachFirebaseEventListeners } = await import('../js/firebaseHandler.js');
                attachFirebaseEventListeners();
            } catch (error) {
                console.error('Failed to load and execute Firebase event listeners:', error);
            }
        }
    }

    function attachEventListeners(path) {
        if (path === 'pages/contact.html' && !loadedPages.includes('contact')) {
            attachContactFormListeners();
            attachEmailCopyListener();
            loadedPages.push('contact');
        }

        if (path === 'pages/login.html' && !loadedPages.includes('login')) {
            import('../js/firebaseHandler.js').then(module => {
                module.initializeFirebase();
                module.attachFirebaseEventListeners();
                loadedPages.push('login');
            }).catch(err => {
                console.error('Failed to load Firebase module:', err);
            });
        }

        if (!loadedPages.includes('login-register-toggle')) {
            document.addEventListener('click', function (event) {
                if (event.target.matches('#toggle-register')) {
                    event.preventDefault();
                    document.querySelector('.login-container').style.display = 'none';
                    document.querySelector('.register-container').style.display = 'block';
                } else if (event.target.matches('#toggle-login')) {
                    event.preventDefault();
                    document.querySelector('.register-container').style.display = 'none';
                    document.querySelector('.login-container').style.display = 'block';
                }
            });
            loadedPages.push('login-register-toggle');  // Mark the login/register toggle as set
        }

        if (!loadedPages.includes('navigation')) {
            document.addEventListener('click', function (event) {
                let target = event.target;

                // Traverse up the DOM tree to find an element with data-page or data-scroll-to
                while (target && !target.matches('[data-scroll-to], [data-page]')) {
                    target = target.parentElement;
                }

                // If a matching element is found
                if (target && target.matches('[data-scroll-to], [data-page]')) {
                    event.preventDefault();
                    const sectionId = target.getAttribute('data-scroll-to') || target.getAttribute('data-page');

                    const sectionElement = document.getElementById(sectionId);
                    if (sectionElement) {
                        // Scroll to the section smoothly
                        sectionElement.scrollIntoView({ behavior: 'smooth' });
                    } else {
                        // Load the page dynamically
                        loadPage(bodyContainer, `pages/${sectionId}.html`, false);
                    }
                }
            });
            loadedPages.push('navigation');
            loadedPages.push('login-register');
        }
    }

    function loadPage(container, path) {
        loadContent(container, path);
    }

    function attachContactFormListeners() {
        const form = document.querySelector('.form');
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const messageInput = document.getElementById('message');
        const submitButton = document.getElementById('submitBtn');

        if (submitButton) {
            submitButton.addEventListener('click', function (e) {
                e.preventDefault();

                // Get form field values
                const name = nameInput.value;
                const email = emailInput.value;
                const phone = phoneInput.value;
                const message = messageInput.value;

                // Save form data in LocalStorage
                const formData = {
                    name,
                    email,
                    phone,
                    message
                };
                localStorage.setItem('formData', JSON.stringify(formData));

                // Create email body
                const emailBody = `${message} %0D%0A %0D%0A ${name} %0D%0A ${phone} %0D%0A ${email}`;

                // Create the subject line
                const subject = `Contact Request from ${name}`;

                // Use mailto to open the default email client with pre-filled information
                window.location.href = `mailto:luis@smartelectronicssolutions.com?subject=${encodeURIComponent(subject)}&body=${emailBody}`;
            });
        }
    }

    function attachEmailCopyListener() {
        const emailText = document.getElementById('email-text');

        if (emailText) {
            emailText.addEventListener('click', function () {
                copyToClipboard(emailText.textContent);

                emailText.textContent = 'Email Copied to Clipboard.';
                emailText.style.color = 'green';

                setTimeout(() => {
                    emailText.textContent = 'luis@smartelectronicssolutions.com';
                    emailText.style.color = '';
                }, 2000);
            });
        }
    }

    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }

    // Initial content loading
    loadContent(headerContainer, 'header.html');
    loadContent(bodyContainer, 'pages/home.html', true);
    loadContent(footerContainer, 'footer.html');
});

window.addEventListener('popstate', function (event) {
    location.reload();
});