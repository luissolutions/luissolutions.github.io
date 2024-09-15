        // Contact Form Script
        function attachContactFormListener() {
            const form = document.getElementById('contactForm');

            form.addEventListener('submit', function (e) {
                e.preventDefault();

                const name = document.getElementById('name').value.trim();
                const email = document.getElementById('email').value.trim();
                const phone = document.getElementById('phone').value.trim();
                const message = document.getElementById('message').value.trim();

                const emailBody = `Name: ${name}%0D%0AEmail: ${email}%0D%0APhone: ${phone}%0D%0A%0D%0A${message}`;
                const subject = `Contact Request from ${name}`;

                window.location.href = `mailto:your.email@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
            });
        }

        function attachEmailCopyListener() {
            const emailText = document.getElementById('email-text');

            if (emailText) {
                emailText.addEventListener('click', function () {
                    copyToClipboard(emailText.textContent);

                    emailText.textContent = 'Email Copied to Clipboard.';
                    emailText.style.color = 'green';

                    setTimeout(() => {
                        emailText.textContent = 'your.email@example.com';
                        emailText.style.color = '';
                    }, 2000);
                });
            }
        }

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).catch(err => {
                console.error('Could not copy text: ', err);
            });
        }

        attachContactFormListener();
        attachEmailCopyListener();
