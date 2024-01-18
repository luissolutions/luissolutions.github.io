let startTime;
let elapsedTime = 0;
let timerInterval;

function timeToString(time) {
    let diffInHrs = time / 3600000;
    let hh = Math.floor(diffInHrs);

    let diffInMin = (diffInHrs - hh) * 60;
    let mm = Math.floor(diffInMin);

    let diffInSec = (diffInMin - mm) * 60;
    let ss = Math.floor(diffInSec);

    let diffInMs = (diffInSec - ss) * 100;
    let ms = Math.floor(diffInMs);

    let formattedMM = mm.toString().padStart(2, "0");
    let formattedSS = ss.toString().padStart(2, "0");
    let formattedMS = ms.toString().padStart(2, "0");

    return `${formattedMM}:${formattedSS}:${formattedMS}`;
}

function startTimer() {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(function printTime() {
        elapsedTime = Date.now() - startTime;
        document.getElementById("timer").innerText = timeToString(elapsedTime);
    }, 10);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function toggleSidebar() {
    var sidebar = document.getElementById("sidebar");
    if (sidebar.style.right === "0px") {
        sidebar.style.right = "-70%";
    } else {
        sidebar.style.right = "0px";
    }
}

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

document.getElementById("startButton").addEventListener("click", startTimer);
document.getElementById("stopButton").addEventListener("click", stopTimer);
document.getElementById("toggleSidebar").addEventListener("click", toggleSidebar);
