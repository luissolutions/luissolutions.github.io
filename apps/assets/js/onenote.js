const clientId = "f5ef88e6-7af0-40af-ae6a-5a9d3342360e";
const tenantId = "f9cb31b8-4d87-4d78-89f4-636d4e6f6509";
const redirectUri = `${window.location.origin}${window.location.pathname}`;
let accessToken;

const storeAccessToken = (token) => localStorage.setItem("accessToken", token);
const getStoredAccessToken = () => localStorage.getItem("accessToken");
const clearStoredAccessToken = () => localStorage.removeItem("accessToken");

function extractAccessTokenFromUrl() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get("access_token");

    if (token) {
        accessToken = token;
        storeAccessToken(token);
        console.log("Access Token:", accessToken);
        alert("Successfully logged in!");
        history.replaceState(null, null, window.location.pathname);
    } else {
        alert("Unable to retrieve access token. Check your Azure configuration.");
    }
}

function initializeAccessToken() {
    accessToken = getStoredAccessToken();
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

async function doesPageExist(taskTitle, sectionId) {
    if (!accessToken) {
        alert("Please log in to Microsoft first.");
        return false;
    }

    const apiUrl = `https://graph.microsoft.com/v1.0/me/onenote/sections/${sectionId}/pages`;

    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data.value.some((page) => page.title === taskTitle);
        } else {
            console.error("Error checking pages:", await response.text());
            return false;
        }
    } catch (error) {
        console.error("Error:", error);
        return false;
    }
}

async function getOrCreateSection(sectionName) {
    if (!accessToken) {
        alert("Please log in to Microsoft first.");
        return null;
    }

    const notebooksApiUrl = "https://graph.microsoft.com/v1.0/me/onenote/notebooks";
    try {
        const notebooksResponse = await fetch(notebooksApiUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });

        if (!notebooksResponse.ok) {
            console.error("Error retrieving notebooks:", await notebooksResponse.text());
            return null;
        }

        const notebooksData = await notebooksResponse.json();
        const defaultNotebook = notebooksData.value.find((notebook) => notebook.isDefault);

        if (!defaultNotebook) {
            alert("No default notebook found.");
            return null;
        }

        const sectionsApiUrl = `https://graph.microsoft.com/v1.0/me/onenote/notebooks/${defaultNotebook.id}/sections`;

        const sectionsResponse = await fetch(sectionsApiUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`
            }
        });

        if (!sectionsResponse.ok) {
            console.error("Error retrieving sections:", await sectionsResponse.text());
            return null;
        }

        const sectionsData = await sectionsResponse.json();
        let section = sectionsData.value.find((sec) => sec.displayName === sectionName);

        if (!section) {
            console.log(`Section "${sectionName}" does not exist. Creating it...`);
            const createSectionResponse = await fetch(sectionsApiUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ displayName: sectionName })
            });

            if (!createSectionResponse.ok) {
                console.error("Error creating section:", await createSectionResponse.text());
                return null;
            }

            section = await createSectionResponse.json();
            console.log(`Section "${sectionName}" created successfully.`);
        }

        return section;
    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}

async function sendTaskToOneNote(taskTitle, taskHtml, taskStartTime, sectionId) {
    if (!accessToken) {
        alert("Please log in to Microsoft first.");
        return;
    }

    const pageExists = await doesPageExist(taskTitle, sectionId);
    if (pageExists) {
        console.log(`Page "${taskTitle}" already exists in section "${sectionId}". Skipping.`);
        return;
    }

    const apiUrl = `https://graph.microsoft.com/v1.0/me/onenote/sections/${sectionId}/pages`;
    const creationDate = new Date(taskStartTime || Date.now()).toISOString();

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/xhtml+xml"
            },
            body: `
                <html xmlns="http://www.w3.org/1999/xhtml">
                    <head>
                        <title>${taskTitle}</title>
                        <meta name="created" content="${creationDate}" />
                    </head>
                    ${taskHtml}
                </html>
            `
        });

        if (response.ok) {
            console.log(`Page for project "${taskTitle}" created successfully.`);
        } else {
            const error = await response.text();
            console.error(`Error creating page for project "${taskTitle}":`, error);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

const sendButton = document.getElementById("sendButton");
if (sendButton) {
    sendButton.addEventListener("click", async () => {
        const jsonInput = document.getElementById("jsonInput").value;
        try {
            const jsonData = JSON.parse(jsonInput);

            const section = await getOrCreateSection("Jobs");
            if (!section) {
                alert("Failed to create the 'Jobs' section.");
                return;
            }

            for (const id in jsonData) {
                const task = jsonData[id];
                const taskTitle = `${task.customerName || "Unnamed"} - ${task.project || `Task ${id}`}`;
                const taskHtml = `
                    <p><b>Name:</b> ${task.customerName || "N/A"}</p>
                    <p><b>Project:</b> ${task.project || "N/A"}</p>
                    <p><b>Address:</b> ${task.customerAddress || "N/A"}</p>
                    <p><b>Notes:</b> ${task.notes || "No notes provided"}</p>
                    <p><b>Start Time:</b> ${task.startTime || "N/A"}</p>
                    <p><b>End Time:</b> ${task.endTime || "N/A"}</p>
                    <p><b>Location:</b> Latitude: ${task.location?.latitude || "N/A"}, Longitude: ${task.location?.longitude || "N/A"}</p>
                `;
                console.log(`Checking for duplicate page: "${taskTitle}"`);
                await sendTaskToOneNote(taskTitle, taskHtml, task.startTime, section.id);
            }
            alert("All tasks have been processed.");
        } catch (error) {
            alert("Invalid JSON input. Please check your data.");
            console.error("Error parsing JSON:", error);
        }
    });
}

const convertButton = document.getElementById("convertButton");
if (convertButton) {
    convertButton.addEventListener("click", () => {
        const jsonInput = document.getElementById("jsonInput").value;
        try {
            const jsonData = JSON.parse(jsonInput);
            document.getElementById("output").innerHTML = convertToOneNoteHTML(jsonData);
        } catch (error) {
            alert("Invalid JSON input. Please check your data.");
            console.error("Error parsing JSON:", error);
        }
    });
}

const loginButton = document.getElementById("loginButton");
if (loginButton) {
    loginButton.addEventListener("click", loginToMicrosoft);
}

const logoutButton = document.getElementById("logoutButton");
if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        clearStoredAccessToken();
        alert("Logged out. Please log in again.");
        window.location.reload();
    });
}

initializeAccessToken();
