
function toggleMenu() {
  const navBar = document.querySelector("nav");
  navBar.classList.toggle("active");

  const dropdownLinks = document.querySelectorAll("nav a");
  dropdownLinks.forEach(link => {
    link.addEventListener('click', () => {
      navBar.classList.remove('active');
    });
  });
}

function updateTime() {
  let now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  let ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  let strTime = hours + ':' + minutes + ' ' + ampm;
  document.getElementById('clock').innerText = strTime;
  setTimeout(updateTime, 1000);
}

updateTime();

const clocks = document.getElementsByClassName("clock");

for (const clock of clocks) {
  clock.addEventListener("dblclick", function () {
    clock.style.display = "none";
  });
}

const hideButton = document.getElementById("hide");
const footer = document.querySelector("footer"); // Use class selector

let isFooterHidden = false;

hideButton.addEventListener("click", () => {
  if (isFooterHidden) {
    // If the footer is currently hidden, set the custom property to the original height
    document.documentElement.style.setProperty("--footerHeight", "34px"); // Replace with your original height
  } else {
    // If the footer is not hidden, set the custom property to the desired height
    document.documentElement.style.setProperty("--footerHeight", "130px");
  }

  isFooterHidden = !isFooterHidden; // Toggle the state
});
