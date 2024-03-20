function toggleDropdown() {
    document.getElementById("myDropdown").classList.toggle("show");
  }

  window.onclick = function (event) {
    if (!event.target.matches('.dropbtn')) {
      var dropdowns = document.getElementsByClassName("dropdown-apps");
      for (var i = 0; i < dropdowns.length; i++) {
        if (dropdowns[i].classList.contains('show')) {
          dropdowns[i].classList.remove('show');
        }
      }
    }
  }

  var appNames = [
    "livelearn",
    "livenotes",
    "livechat",
    "livegas",
    "livemileage",
    "livereg",
    "liveinventory",
    "livechess",
    "gallery",
    "livebudget",
    "invoice",
    "info",
    "viewer",
    "password",
    "converting",
    "liveshow",
  ];

  var pages = appNames.map(function (name) {
    return "../../apps/" + name + ".html";
  });

  var iframe = document.getElementById('myIframe');
  var dropdownContent = document.getElementById('myDropdown');
  var currentIndex = localStorage.getItem('currentIndex') || 0;

  function setIframeSrc(index) {
    currentIndex = index;
    iframe.src = pages[index];
    localStorage.setItem('currentIndex', currentIndex);
  }

  function generateButtons() {
    var buttonsHTML = '';
    appNames.forEach((name, index) => {
      buttonsHTML += `<a onclick="setIframeSrc(${index})">${name.toUpperCase()}</a>`;
    });
    dropdownContent.innerHTML = buttonsHTML;
  }

  window.onload = function () {
    setIframeSrc(currentIndex);
    generateButtons();
  }

  document.getElementById('loadContent').addEventListener('click', loadIframeContent);

  document.getElementById('iframeSource').addEventListener('keyup', function (event) {
    if (event.key === "Enter") {
      loadIframeContent();
    }
  });

  function loadIframeContent() {
    var sourceName = document.getElementById('iframeSource').value;
    var fullPath = "../../apps/" + sourceName + ".html";
    document.getElementById('myIframe').src = fullPath;
  }

  document.getElementById('loadStylesheet').addEventListener('click', function () {
    var stylesheetName = document.getElementById('stylesheet-input').value;
    if (stylesheetName) {
      var fullPath = "../../assets/css/" + stylesheetName + ".css";
      document.getElementById('stylesheet').href = fullPath;
    } else {
      alert("Please enter a stylesheet name.");
    }
  });
