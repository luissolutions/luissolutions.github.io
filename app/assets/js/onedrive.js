// ============================
// OneDrive / Microsoft Graph Storage Layer
// ============================

import { accessToken } from "./radar-microsoftAuth.js";

// 🔧 CONFIG
const BASE_PATH = "RadarApp"; // root folder in OneDrive
const USE_SHARED_DRIVE = false; // set true if using SharePoint / shared drive
const DRIVE_ID = ""; // required if USE_SHARED_DRIVE = true

// ============================
// Internal Helpers
// ============================

function getBaseUrl(path) {
    if (USE_SHARED_DRIVE && DRIVE_ID) {
        return `https://graph.microsoft.com/v1.0/drives/${DRIVE_ID}/root:/${BASE_PATH}/${path}`;
    }

    return `https://graph.microsoft.com/v1.0/me/drive/root:/${BASE_PATH}/${path}`;
}

function ensureAuth() {
    if (!accessToken) {
        throw new Error("Not authenticated with Microsoft");
    }
}

async function graphFetch(url, options = {}) {
    ensureAuth();

    const res = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            ...(options.headers || {})
        }
    });

    if (!res.ok) {
        const text = await res.text();
        console.error("Graph API error:", text);
        throw new Error(text);
    }

    return res;
}

// ============================
// JSON DATABASE FUNCTIONS
// ============================

// Load JSON file
export async function loadJson(path) {
    try {
        const metaRes = await graphFetch(getBaseUrl(path));
        const meta = await metaRes.json();

        const fileRes = await fetch(meta["@microsoft.graph.downloadUrl"]);
        return await fileRes.json();

    } catch (err) {
        console.warn("loadJson failed (may not exist):", path);
        return null;
    }
}

// Save JSON file (overwrite)
export async function saveJson(path, data) {
    const url = getBaseUrl(path) + ":/content";

    await graphFetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data, null, 2)
    });
}

// Patch JSON (Firebase-style update)
export async function patchJson(path, updates) {
    const existing = (await loadJson(path)) || {};
    const merged = { ...existing, ...updates };
    await saveJson(path, merged);
}

// ============================
// FILE / IMAGE FUNCTIONS
// ============================

// Upload file (image, blob, etc.)
export async function uploadFile(path, blob, contentType = "application/octet-stream") {
    const url = getBaseUrl(path) + ":/content";

    const res = await graphFetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": contentType
        },
        body: blob
    });

    return await res.json();
}

// List files in folder
export async function listFiles(path) {
    try {
        const url = getBaseUrl(path) + ":/children";

        const res = await graphFetch(url);
        const data = await res.json();

        return data.value.map(item => ({
            name: item.name,
            path: item.parentReference?.path + "/" + item.name,
            url: item["@microsoft.graph.downloadUrl"],
            id: item.id
        }));

    } catch (err) {
        console.warn("listFiles failed:", path);
        return [];
    }
}

// Delete file
export async function deleteFile(path) {
    const url = getBaseUrl(path);

    await graphFetch(url, {
        method: "DELETE"
    });
}

// ============================
// DATABASE WRAPPER (LIKE FIREBASE)
// ============================

const DB_FILE = "data/db.json";

// Read entire DB
export async function readDB() {
    return (await loadJson(DB_FILE)) || {};
}

// Write entire DB
export async function writeDB(data) {
    await saveJson(DB_FILE, data);
}

// Patch DB (like Firebase update)
export async function updateDB(updates) {
    const db = await readDB();
    const newDB = { ...db, ...updates };
    await writeDB(newDB);
}

// ============================
// PROJECT HELPERS (Radar App)
// ============================

// Get all projects
export async function getProjects() {
    const db = await readDB();
    return db.tasks || {};
}

// Save project
export async function saveProject(id, data) {
    const db = await readDB();

    db.tasks = db.tasks || {};
    db.tasks[id] = {
        ...(db.tasks[id] || {}),
        ...data,
        updatedAt: Date.now()
    };

    await writeDB(db);
}

// Get single project
export async function getProject(id) {
    const db = await readDB();
    return db.tasks?.[id] || null;
}

// ============================
// IMAGE PATH HELPERS
// ============================

export function getImagePath(projectName, mode = "sensors") {
    const safe = projectName.replace(/\s+/g, "_");
    return `images/${safe}/${mode}`;
}

export async function uploadProjectImage(projectName, mode, filename, blob) {
    const path = `${getImagePath(projectName, mode)}/${filename}`;
    return await uploadFile(path, blob, "image/jpeg");
}

export async function listProjectImages(projectName, mode) {
    return await listFiles(getImagePath(projectName, mode));
}