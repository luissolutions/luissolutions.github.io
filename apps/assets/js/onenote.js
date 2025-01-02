const clientId = "f5ef88e6-7af0-40af-ae6a-5a9d3342360e";
const tenantId = "f9cb31b8-4d87-4d78-89f4-636d4e6f6509";
const redirectUri = `${window.location.origin}${window.location.pathname}`;
let accessToken;
let isProcessing = false;

const storage = {
    setAccessToken: (token) => localStorage.setItem("accessToken", token),
    getAccessToken: () => localStorage.getItem("accessToken"),
    clearAccessToken: () => localStorage.removeItem("accessToken")
};

function extractAccessTokenFromUrl() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get("access_token");

    if (token) {
        accessToken = token;
        storage.setAccessToken(token);
        console.log("Access Token:", accessToken);
        alert("Successfully logged in!");
        history.replaceState(null, null, window.location.pathname);
    } else {
        alert("Unable to retrieve access token. Check your Azure configuration.");
    }
}

function initializeAccessToken() {
    accessToken = storage.getAccessToken();
    if (!accessToken && window.location.hash) {
        extractAccessTokenFromUrl();
    } else if (accessToken) {
        console.log("Using stored access token.");
    } else {
        console.log("No access token found. Please log in.");
    }
}

function loginToMicrosoft() {
    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&scope=${encodeURIComponent("Notes.Create Notes.ReadWrite User.Read")}&response_mode=fragment`;
    window.location.href = authUrl;
}

function logoutFromMicrosoft() {
    storage.clearAccessToken();
    accessToken = null;

    const logoutUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = logoutUrl;
}

function convertToOneNoteHTML(data) {
    return Object.keys(data)
        .map((id) => {
            const task = data[id];
            return `
                <div>
                    <h1>${task.customerName || "Unnamed Task"}</h1>
                    <p><b>Project:</b> ${task.project || "N/A"}</p>
                    <p><b>Address:</b> ${task.customerAddress || "N/A"}</p>
                    <p><b>Notes:</b> ${task.notes || "No notes provided"}</p>
                    <p><b>Start Time:</b> ${task.startTime || "N/A"}</p>
                    <p><b>End Time:</b> ${task.endTime || "N/A"}</p>
                    <p><b>Location:</b> Latitude: ${task.location?.latitude || "N/A"}, Longitude: ${task.location?.longitude || "N/A"}</p>
                </div>
                <hr>`;
        })
        .join("");
}

async function fetchApi(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (response.ok) {
            return response.json();
        }
        console.error("API Error:", await response.text());
    } catch (error) {
        console.error("Fetch Error:", error);
    }
    return null;
}

async function doesPageExist(taskTitle, sectionId) {
    if (!accessToken) return false;

    const apiUrl = `https://graph.microsoft.com/v1.0/me/onenote/sections/${sectionId}/pages`;
    const pages = await fetchApi(apiUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    return pages?.value.some((page) => page.title === taskTitle) || false;
}

let sectionCache = {};

async function getOrCreateSection(sectionName) {
    if (sectionCache[sectionName]) {
        return sectionCache[sectionName];
    }

    const notebooksUrl = "https://graph.microsoft.com/v1.0/me/onenote/notebooks";
    const notebooks = await fetchApiWithRetry(notebooksUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    const defaultNotebook = notebooks?.value.find((notebook) => notebook.isDefault);
    if (!defaultNotebook) {
        console.error("No default notebook found.");
        return null;
    }

    const sectionsUrl = `https://graph.microsoft.com/v1.0/me/onenote/notebooks/${defaultNotebook.id}/sections`;
    const sections = await fetchApiWithRetry(sectionsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    let section = sections?.value.find((sec) => sec.displayName === sectionName);

    if (!section) {
        section = await fetchApiWithRetry(sectionsUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ displayName: sectionName })
        });
    }

    if (section) {
        sectionCache[sectionName] = section;
    }

    return section;
}

async function sendTaskToOneNote(taskTitle, taskHtml, taskStartTime, sectionId) {
    if (!accessToken) return;

    const pageExists = await doesPageExist(taskTitle, sectionId);
    if (pageExists) return;

    const apiUrl = `https://graph.microsoft.com/v1.0/me/onenote/sections/${sectionId}/pages`;
    const creationDate = new Date(taskStartTime || Date.now()).toISOString();

    await fetchApi(apiUrl, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/xhtml+xml"
        },
        body: `
            <html xmlns="http://www.w3.org/1999/xhtml">
                <head>
                    <title>${taskTitle}</title>
                    <meta name="created" content="${creationDate}" />
                </head>
                ${taskHtml}
            </html>`
    });
}

async function processTasks(jsonData) {
    const section = await getOrCreateSection("Jobs1");
    if (!section) {
        alert("Failed to create or access the 'Jobs' section.");
        return;
    }

    for (const id in jsonData) {
        if (!isProcessing) break;

        const task = jsonData[id];
        const taskTitle = `${task.customerName || "Unnamed"} - ${task.project || `Task ${id}`}`;
        const taskHtml = convertToOneNoteHTML({ [id]: task });

        await sendTaskToOneNote(taskTitle, taskHtml, task.startTime, section.id);
    }

    alert(isProcessing ? "All tasks have been processed." : "Process was stopped.");
    isProcessing = false;
    document.getElementById("sendButton").textContent = "Populate OneNote";
}

function setupEventListeners() {
    document.getElementById("loginButton")?.addEventListener("click", loginToMicrosoft);
    document.getElementById("logoutButton")?.addEventListener("click", logoutFromMicrosoft);

    const sendButton = document.getElementById("sendButton");
    sendButton?.addEventListener("click", async () => {
        if (isProcessing) {
            isProcessing = false;
            sendButton.textContent = "Populate OneNote";
            return;
        }

        isProcessing = true;
        sendButton.textContent = "Stop";

        try {
            const jsonInput = document.getElementById("jsonInput").value;
            const jsonData = JSON.parse(jsonInput);
            await processTasks(jsonData);
        } catch (error) {
            alert("Invalid JSON input. Please check your data.");
            console.error("Error parsing JSON:", error);
            isProcessing = false;
            sendButton.textContent = "Populate OneNote";
        }
    });

    document.getElementById("convertButton")?.addEventListener("click", () => {
        try {
            const jsonInput = document.getElementById("jsonInput").value;
            const jsonData = JSON.parse(jsonInput);
            document.getElementById("output").innerHTML = convertToOneNoteHTML(jsonData);
        } catch (error) {
            alert("Invalid JSON input. Please check your data.");
            console.error("Error parsing JSON:", error);
        }
    });
}
async function fetchApiWithRetry(url, options = {}, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt++) {
        const response = await fetch(url, options);

        if (response.ok) {
            return await response.json();
        }

        if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After") || 5;
            console.warn(`Throttled. Retrying in ${retryAfter} seconds...`);
            await new Promise((resolve) => setTimeout(resolve, retryAfter * 5000));
        } else {
            console.error("API Error:", await response.text());
            break;
        }
    }

    console.error("Max retries reached.");
    return null;
}

async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

initializeAccessToken();
setupEventListeners();