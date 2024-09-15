        // Contact Form Script
        function attachContactFormListener() {
            const form = document.getElementById('contactForm');
    
            form.addEventListener('submit', function (e) {
                e.preventDefault();
    
                const name = document.getElementById('name').value;
                const email = document.getElementById('email').value;
                const phone = document.getElementById('phone').value;
                const message = document.getElementById('message').value;
    
                const formData = { name, email, phone, message };
                localStorage.setItem('formData', JSON.stringify(formData));
    
                const emailBody = `${message} %0D%0A %0D%0A ${name} %0D%0A ${phone} %0D%0A ${email}`;
                const subject = `Contact Request from ${name}`;
    
                window.location.href = `mailto:smartelectronicssolutionsllc@gmail.com?subject=${encodeURIComponent(subject)}&body=${emailBody}`;
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
                        emailText.textContent = 'smartelectronicssolutionsllc@gmail.com';
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
