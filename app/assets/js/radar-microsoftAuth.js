// ============================
// Microsoft Auth (Radar App)
// ============================

// 🔧 CONFIG — replace these
const clientId = "f5ef88e6-7af0-40af-ae6a-5a9d3342360e";
const tenantId = "f9cb31b8-4d87-4d78-89f4-636d4e6f6509";

// Auto redirect back to same page
const redirectUri = window.location.origin + window.location.pathname;

// Access token (runtime)
let accessToken = null;

// ============================
// Local Storage Helpers
// ============================
const storage = {
    set: (token) => localStorage.setItem("accessToken", token),
    get: () => localStorage.getItem("accessToken"),
    clear: () => localStorage.removeItem("accessToken")
};

// ============================
// Extract Token From URL
// ============================
function extractTokenFromUrl() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const token = params.get("access_token");

    if (token) {
        accessToken = token;
        storage.set(token);

        console.log("✅ Microsoft login successful");

        // Clean URL
        history.replaceState(null, null, window.location.pathname);
    }
}

// ============================
// Initialize Auth
// ============================
function initMicrosoftAuth() {

    // 1. Try URL token first
    if (window.location.hash) {
        extractTokenFromUrl();
    }

    // 2. Fallback to stored token
    if (!accessToken) {
        accessToken = storage.get();
    }

    // 3. Update UI
    updateAuthUI();

    // 4. Bind buttons
    bindAuthButtons();
}

// ============================
// Login
// ============================
function loginToMicrosoft() {
    const scope = [
        "Files.ReadWrite.All",
        "User.Read"
    ].join(" ");

    const authUrl =
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize` +
        `?client_id=${clientId}` +
        `&response_type=token` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(scope)}` +
        `&response_mode=fragment`;

    window.location.href = authUrl;
}

// ============================
// Logout
// ============================
function logoutFromMicrosoft() {
    storage.clear();
    accessToken = null;

    console.log("🔒 Logged out");

    // Reload app
    window.location.reload();
}

// ============================
// Get User Info
// ============================
async function getUserInfo() {
    if (!accessToken) return null;

    try {
        const res = await fetch("https://graph.microsoft.com/v1.0/me", {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        if (!res.ok) {
            console.error("❌ Failed to fetch user", await res.text());
            return null;
        }

        return await res.json();

    } catch (err) {
        console.error("❌ Error fetching user:", err);
        return null;
    }
}

// ============================
// Token Expiry Check
// ============================
function isTokenExpired(token) {
    if (!token) return true;

    try {
        const [, payload] = token.split(".");
        const decoded = JSON.parse(atob(payload));
        const exp = decoded.exp;

        return (Date.now() / 1000) > exp;

    } catch {
        return true;
    }
}

// ============================
// Login State
// ============================
function isLoggedIn() {
    return !!accessToken && !isTokenExpired(accessToken);
}

// ============================
// UI Updates
// ============================
async function updateAuthUI() {
    const loginBtn = document.getElementById("loginButton");
    const logoutBtn = document.getElementById("logoutButton");
    const status = document.getElementById("loginStatus");

    if (!status) return;

    if (!accessToken || isTokenExpired(accessToken)) {
        status.textContent = "Not logged in";

        if (loginBtn) loginBtn.style.display = "inline-block";
        if (logoutBtn) logoutBtn.style.display = "none";

        return;
    }

    const user = await getUserInfo();

    if (!user) {
        status.textContent = "Session expired";

        if (loginBtn) loginBtn.style.display = "inline-block";
        if (logoutBtn) logoutBtn.style.display = "none";

        return;
    }

    status.textContent = `Logged in as: ${user.displayName || user.userPrincipalName}`;

    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
}

// ============================
// Bind Buttons
// ============================
function bindAuthButtons() {
    document.getElementById("loginButton")?.addEventListener("click", loginToMicrosoft);
    document.getElementById("logoutButton")?.addEventListener("click", logoutFromMicrosoft);
}

// ============================
// Exports
// ============================
export {
    accessToken,
    initMicrosoftAuth,
    loginToMicrosoft,
    logoutFromMicrosoft,
    getUserInfo,
    isLoggedIn,
    isTokenExpired
};