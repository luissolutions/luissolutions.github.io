document.addEventListener('DOMContentLoaded', function () {

  const form = document.querySelector('.form');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const messageInput = document.getElementById('message');
  const submitButton = document.getElementById('submitBtn');

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
    window.location.href = `mailto:honeydhelper2020@gmail.com?subject=${encodeURIComponent(subject)}&body=${emailBody}`;
  });
});
