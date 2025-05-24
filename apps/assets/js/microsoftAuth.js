const clientId = "f5ef88e6-7af0-40af-ae6a-5a9d3342360e";
const tenantId = "f9cb31b8-4d87-4d78-89f4-636d4e6f6509";
const redirectUri = `${window.location.origin}${window.location.pathname}`;
let accessToken;

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
        if (!sessionStorage.getItem("loginNotified")) {
            alert("Successfully logged in!");
            sessionStorage.setItem("loginNotified", "true");
        }
        history.replaceState(null, null, window.location.pathname);
    } else {
        alert("Unable to retrieve access token. Check your Azure configuration.");
    }
}

function initializeAccessToken() {
    if (window.location.hash) {
        extractAccessTokenFromUrl();
    }

    if (!accessToken) {
        accessToken = storage.getAccessToken();
        if (accessToken) {
            console.log("Using stored access token.");
        } else {
            console.log("No access token found. Please log in.");
        }
    }
}

async function loginToMicrosoft() {
    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&scope=${encodeURIComponent("Files.ReadWrite.All User.Read")}&response_mode=fragment`;
    window.location.href = authUrl;
}

async function getUserInfo() {
    if (!accessToken) return null;

    const res = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!res.ok) {
        console.error("Failed to get user info", await res.text());
        return null;
    }

    return await res.json();
}

function logoutFromMicrosoft() {
    storage.clearAccessToken();
    accessToken = null;
    sessionStorage.removeItem("loginNotified");
    alert("Logged out successfully.");
}

function isLoggedIn() {
    return !!accessToken;
}

function setupAuthEventListeners() {
    document.getElementById("loginButton")?.addEventListener("click", loginToMicrosoft);
    document.getElementById("logoutButton")?.addEventListener("click", logoutFromMicrosoft);
}

initializeAccessToken();
setupAuthEventListeners();

export { accessToken, loginToMicrosoft, logoutFromMicrosoft, getUserInfo, isLoggedIn };