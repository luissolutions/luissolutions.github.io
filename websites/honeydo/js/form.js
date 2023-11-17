document.addEventListener('DOMContentLoaded', function () {

  const form = document.querySelector('.form');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const messageInput = document.getElementById('message');
  const submitButton = document.getElementById('submitBtn');

  submitButton.addEventListener('click', function (e) {
    e.preventDefault();

    const name = nameInput.value;
    const email = emailInput.value;
    const phone = phoneInput.value;
    const message = messageInput.value;

    const formData = {
      name,
      email,
      phone,
      message
    };
    localStorage.setItem('formData', JSON.stringify(formData));

    const emailBody = `${message} %0D%0A %0D%0A ${name} %0D%0A ${phone} %0D%0A ${email}`;

    const subject = `Contact Request from ${name}`;

    window.location.href = `mailto:jimmy@honey-dohelper.com?subject=${encodeURIComponent(subject)}&body=${emailBody}`;
  });
});
