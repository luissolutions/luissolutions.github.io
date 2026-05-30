import {
    getDatabase,
    get,
    ref,
    set
} from '../../apps/assets/js/firebase-init.js';

export async function updateVisitCount(ipAddress) {
    const db  = getDatabase();
    const now  = new Date().toISOString();
    const page = window.location.pathname.replace(/^\//, '') || 'index';
    const sanitizedIP   = (ipAddress || 'unknown').replace(/\./g, '-');
    const sanitizedPage = page.replace(/[.#$\[\]\/]/g, '_') || 'index';

    try {
        // Total visit counter
        const countRef  = ref(db, 'public/log/visitCount');
        const countSnap = await get(countRef);
        const newCount  = (countSnap.exists() ? countSnap.val() : 0) + 1;
        await set(countRef, newCount);

        const el = document.getElementById('visit-counter');
        if (el) el.textContent = ` | Visits: ${newCount}`;

        // Aggregated per-IP record
        const ipRef  = ref(db, `public/log/ips/${sanitizedIP}`);
        const ipSnap = await get(ipRef);
        if (ipSnap.exists()) {
            const d = ipSnap.val();
            await set(ipRef, { ip: ipAddress, count: (d.count || 0) + 1, firstSeen: d.firstSeen || now, lastSeen: now, lastPage: page });
        } else {
            await set(ipRef, { ip: ipAddress, count: 1, firstSeen: now, lastSeen: now, lastPage: page });
        }

        // Aggregated per-page record
        const pageRef  = ref(db, `public/log/pages/${sanitizedPage}`);
        const pageSnap = await get(pageRef);
        if (pageSnap.exists()) {
            const d = pageSnap.val();
            await set(pageRef, { page, count: (d.count || 0) + 1 });
        } else {
            await set(pageRef, { page, count: 1 });
        }

        // Individual visit timeline (for detailed log view)
        const visitsRef  = ref(db, `public/log/visits/${sanitizedIP}`);
        const visitsSnap = await get(visitsRef);
        const entry = { time: now, url: window.location.href };
        if (visitsSnap.exists()) {
            const d = visitsSnap.val();
            const visits = Array.isArray(d.visits) ? d.visits : [];
            visits.push(entry);
            await set(visitsRef, { ip: ipAddress, visits });
        } else {
            await set(visitsRef, { ip: ipAddress, visits: [entry] });
        }

    } catch (err) {
        console.error('Visit log error:', err);
    }
}

export function getIP() {
    return fetch('https://api.ipify.org?format=json')
        .then(r => r.json())
        .then(d => d.ip)
        .catch(() => 'unknown');
}
