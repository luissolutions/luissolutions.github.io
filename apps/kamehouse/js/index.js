const calcBtn = document.getElementById('calc-btn')
const calcWin = document.getElementById('calc-win')
const closeBtn = document.getElementById('calc-close-btn')

const passwordBtn = document.getElementById("password-btn");
const passwordWin = document.getElementById("password-win");
const passwordCloseBtn = document.getElementById("password-close-btn");

const FunctionsBtn = document.getElementById("functions-btn");
const functionsWin = document.getElementById("functions-win");
const functionsCloseBtn = document.getElementById("functions-close-btn");

calcBtn.addEventListener('click', function () {
  calcWin.style.display = 'block'
})

closeBtn.addEventListener('click', function () {
  calcWin.style.display = 'none'
})

passwordBtn.addEventListener('click', function () {
  passwordWin.style.display = 'block'
})

passwordCloseBtn.addEventListener("click", function () {
  passwordWin.style.display = 'none'
})


FunctionsBtn.addEventListener("click", function () {
  functionsWin.style.display = 'block'
})

functionsCloseBtn.addEventListener("click", function () {
  functionsWin.style.display = 'none'
})


document.getElementById('registration-form').addEventListener('submit', function (event) {
  event.preventDefault(); // Prevent form submission
  var name = document.getElementById('name').value;
  var email = document.getElementById('email').value;
  var password = document.getElementById('password').value;

  // Perform registration logic here

  // Optional: Reset form fields
  document.getElementById('name').value = '';
  document.getElementById('email').value = '';
  document.getElementById('password').value = '';
});

function handleOutsideClick(event) {
  const navBar = document.querySelector('.nav-bar');
  const hamburger = document.querySelector('.hamburger');

  if (!navBar.contains(event.target) && !hamburger.contains(event.target)) {
    navBar.classList.remove('active');
  }
}

document.addEventListener('click', handleOutsideClick);

function toggleMenu() {
  const navBar = document.querySelector(".nav-bar");
  navBar.classList.toggle("active");

  const dropdownLinks = document.querySelectorAll(".nav-bar a");
  dropdownLinks.forEach(link => {
    link.addEventListener('click', () => {
      navBar.classList.remove('active');
    });
  });
}
