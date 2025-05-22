const clientId = "f5ef88e6-7af0-40af-ae6a-5a9d3342360e";
const tenantId = "f9cb31b8-4d87-4d78-89f4-636d4e6f6509";
const redirectUri = `${window.location.origin}${window.location.pathname}`;

const msalConfig = {
    auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);
let account = null;
let accessToken = null;

const loginRequest = {
    scopes: ["Files.ReadWrite.All", "User.Read"]
};

async function loginToMicrosoft() {
    try {
        const loginResponse = await msalInstance.loginPopup(loginRequest);
        account = loginResponse.account;

        const tokenResponse = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account
        });

        accessToken = tokenResponse.accessToken;
        localStorage.setItem("accessToken", accessToken);

        if (!sessionStorage.getItem("loginNotified")) {
            alert("Successfully logged in!");
            sessionStorage.setItem("loginNotified", "true");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("Login failed. Check console for details.");
    }
}

async function getUserInfo() {
    if (!accessToken) return null;

    const res = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
        console.error("Failed to get user info", await res.text());
        return null;
    }

    return await res.json();
}

function logoutFromMicrosoft() {
    msalInstance.logoutPopup();
    accessToken = null;
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("loginNotified");
    alert("Logged out successfully.");
}

function isLoggedIn() {
    return !!localStorage.getItem("accessToken");
}

function setupAuthEventListeners() {
    document.getElementById("loginButton")?.addEventListener("click", loginToMicrosoft);
    document.getElementById("logoutButton")?.addEventListener("click", logoutFromMicrosoft);
}

setupAuthEventListeners();

export { accessToken, loginToMicrosoft, logoutFromMicrosoft, getUserInfo, isLoggedIn };