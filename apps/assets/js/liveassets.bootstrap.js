const MODE_KEY = 'liveassetsMode';
const VALID_MODES = new Set(['live', 'local']);

function resolveMode() {
    const url = new URL(window.location.href);
    const queryMode = (url.searchParams.get('mode') || '').toLowerCase();

    if (VALID_MODES.has(queryMode)) {
        localStorage.setItem(MODE_KEY, queryMode);
        return queryMode;
    }

    const storedMode = (localStorage.getItem(MODE_KEY) || '').toLowerCase();
    if (VALID_MODES.has(storedMode)) {
        return storedMode;
    }

    return 'live';
}

function modulePathFor(mode) {
    return mode === 'local' ? './assets.local.js' : './assets.live.js';
}

async function runMode(mode) {
    const mod = await import(modulePathFor(mode));
    if (typeof mod.init !== 'function') {
        throw new Error(`Mode module '${mode}' is missing an init() export.`);
    }

    document.body.dataset.mode = mode;
    await mod.init();
}

(async function bootstrap() {
    const selectedMode = resolveMode();

    try {
        await runMode(selectedMode);
    } catch (error) {
        console.warn(`Failed to initialize liveassets in '${selectedMode}' mode:`, error);

        if (selectedMode !== 'local') {
            try {
                localStorage.setItem(MODE_KEY, 'local');
                await runMode('local');
                return;
            } catch (fallbackError) {
                console.error('Failed to initialize liveassets in local fallback mode:', fallbackError);
            }
        }

        throw error;
    }
})();
