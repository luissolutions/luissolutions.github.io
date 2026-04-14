import { database, ref, onValue, push, query, limitToLast, remove } from './firebase-init.js';

        let watchBasePath = (onChange) => {
            onChange('public', null);
            return () => { };
        };

        let atPath = (basePath, suffix) => {
            const base = String(basePath || 'public').replace(/\/+$/, '');
            const tail = String(suffix || '').replace(/^\/+/, '');
            return tail ? `${base}/${tail}` : base;
        };

        const basePathHelpersReady = import('./basePath.js')
            .then((mod) => {
                if (typeof mod.watchBasePath === 'function') watchBasePath = mod.watchBasePath;
                if (typeof mod.atPath === 'function') atPath = mod.atPath;
            })
            .catch(() => {
                console.warn('basePath helper missing; using local fallback in livechat.');
            });

        const messagesList = document.getElementById('messages-list');
        const messageForm = document.getElementById('message-form');
        const messageInput = document.getElementById('message-input');
        const usernameInput = document.getElementById('username-input');
        const clearButton = document.getElementById('clear-button');

        let DATABASE_BASE_PATH = 'public';
        let stopMessagesListener = null;

        function messagesPath() {
            return atPath(DATABASE_BASE_PATH, 'messages');
        }

        function sendMessage(username, text) {
            const messagesRef = ref(database, messagesPath());
            push(messagesRef, { username, text });
        }

        function displayMessages(snapshot) {
            const messages = snapshot.val();
            messagesList.innerHTML = '';
            if (messages) {
                Object.values(messages).forEach(msg => {
                    const msgElement = document.createElement('li');
                    const strong = document.createElement('strong');
                    strong.textContent = String(msg?.username || 'Anonymous');
                    msgElement.appendChild(strong);
                    msgElement.appendChild(document.createTextNode(`: ${String(msg?.text || '')}`));
                    messagesList.appendChild(msgElement);
                });
            }
        }

        function listenForMessages() {
            if (typeof stopMessagesListener === 'function') {
                stopMessagesListener();
                stopMessagesListener = null;
            }

            const messagesRef = ref(database, messagesPath());
            const lastMessagesQuery = query(messagesRef, limitToLast(10));
            stopMessagesListener = onValue(lastMessagesQuery, displayMessages);
        }

        function clearMessages() {
            const messagesRef = ref(database, messagesPath());
            remove(messagesRef).then(() => {
                messagesList.innerHTML = '';
            }).catch(error => {
                console.error("Error clearing messages:", error);
            });
        }

        messageForm.addEventListener('submit', event => {
            event.preventDefault();
            const username = usernameInput.value.trim() || 'Anonymous';
            const text = messageInput.value.trim();

            if (text) {
                sendMessage(username, text);
                messageInput.value = '';
            }
        });

        clearButton.addEventListener('click', () => {
            clearMessages();
        });

        document.addEventListener("DOMContentLoaded", () => {
            basePathHelpersReady.finally(() => {
                watchBasePath((basePath) => {
                    DATABASE_BASE_PATH = basePath;
                    listenForMessages();
                });
            });
        });
