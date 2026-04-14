import { getDatabase, ref, set, push, onValue, remove } from './firebase-init.js';

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
                console.warn('basePath helper missing; using local fallback in livetext.');
            });

        const database = getDatabase();
        let DATABASE_BASE_PATH = 'public';
        let textsRef = ref(database, atPath(DATABASE_BASE_PATH, 'texts'));

        const textPath = (selectedKey = '') => atPath(DATABASE_BASE_PATH, selectedKey ? `texts/${selectedKey}` : 'texts');

        const textInput = document.getElementById('textInput');
        const saveTextButton = document.getElementById('saveTextButton');
        const savedTexts = document.getElementById('savedTexts');
        const startPauseButton = document.getElementById('startPauseButton');
        const resetButton = document.getElementById('resetButton');
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        const wordGroup = document.getElementById('wordGroup');
        const display = document.getElementById('display');
        const fullText = document.getElementById('fullText');
        const deleteTextButton = document.getElementById('deleteTextButton');
        const clearTextButton = document.getElementById('clearTextButton');

        let words = [];
        let currentIndex = 0;
        let timer = null;
        const isPlaying = { status: false };

        function togglePlayPause() {
            if (isPlaying.status) {
                pausePlayback();
            } else {
                startPlayback();
            }
        }

        function saveSettings() {
            const settings = {
                speed: speedSlider.value,
                wordGroup: wordGroup.value,
            };
            localStorage.setItem('textPlaybackSettings', JSON.stringify(settings));
        }

        function loadSettings() {
            const savedSettings = JSON.parse(localStorage.getItem('textPlaybackSettings') || '{}');
            if (savedSettings.speed) {
                speedSlider.value = savedSettings.speed;
                speedValue.textContent = `${savedSettings.speed}ms`;
            }
            if (savedSettings.wordGroup) {
                wordGroup.value = savedSettings.wordGroup;
            }
            if (savedSettings.selectedText) {
                savedTexts.value = savedSettings.selectedText;
                const selectedKey = savedSettings.selectedText;
                if (selectedKey) {
                    const selectedTextRef = ref(database, textPath(selectedKey));
                    onValue(selectedTextRef, (snapshot) => {
                        if (snapshot.exists()) {
                            textInput.value = snapshot.val().text;
                        }
                    }, { onlyOnce: true });
                }
            }
            if (savedSettings.textInput) {
                textInput.value = savedSettings.textInput;
            }
        }

        function fetchSavedTexts() {
            onValue(textsRef, (snapshot) => {
                savedTexts.innerHTML = '<option value="">Select a saved text</option>';
                const data = snapshot.val();
                if (data) {
                    for (const key in data) {
                        const option = document.createElement('option');
                        option.value = key;
                        option.textContent = data[key].text.substring(0, 30) + '...';
                        savedTexts.appendChild(option);
                    }
                }
                const savedSettings = JSON.parse(localStorage.getItem('textPlaybackSettings') || '{}');
                if (savedSettings?.selectedText) {
                    savedTexts.value = savedSettings.selectedText;
                }
            });
        }

        function startPlayback() {
            if (!textInput.value.trim()) {
                return;
            }

            if (!words.length) {
                words = textInput.value.split(/\s+/);
                fullText.textContent = textInput.value;
                currentIndex = 0;
            }

            if (timer === null) {
                playWords();
            }

            isPlaying.status = true;
            startPauseButton.textContent = "Pause";
        }

        function pausePlayback() {
            clearInterval(timer);
            timer = null;
            isPlaying.status = false;
            startPauseButton.textContent = "Start";
        }

        function resetPlayback() {
            clearInterval(timer);
            timer = null;
            currentIndex = 0;
            display.textContent = 'Text will appear here';
            isPlaying.status = false;
            startPauseButton.textContent = "Start";
            saveSettings();
        }

        function playWords() {
            const interval = parseInt(speedSlider.value, 10);
            const groupSize = parseInt(wordGroup.value, 10);

            timer = setInterval(() => {
                if (currentIndex + groupSize > words.length) {
                    const group = words.slice(currentIndex).join(' ');
                    display.textContent = group;
                    highlightWords(currentIndex, words.length - currentIndex);
                    clearInterval(timer);
                    timer = null;
                    isPlaying.status = false;
                    startPauseButton.textContent = "Start";
                    return;
                }

                const group = words.slice(currentIndex, currentIndex + groupSize).join(' ');
                display.textContent = group;

                highlightWords(currentIndex, groupSize);

                currentIndex += groupSize;
            }, interval);
        }

        function highlightWords(startIndex, groupSize) {
            const highlightedWords = words.map((word, index) => {
                if (index >= startIndex && index < startIndex + groupSize) {
                    return `<span class="highlight">${word}</span>`;
                }
                return word;
            });

            fullText.innerHTML = highlightedWords.join(' ');
        }

        function updateSpeedDisplay() {
            const milliseconds = parseInt(speedSlider.value, 10);
            const wordsPerSecond = (1000 / milliseconds).toFixed(2);
            speedValue.textContent = `${wordsPerSecond} words/sec`;
        }

        saveTextButton.addEventListener('click', () => {
            const text = textInput.value.trim();
            if (text) {
                const newTextRef = push(textsRef);
                set(newTextRef, { text }).then(() => {
                    alert('Text saved successfully.');
                    textInput.value = '';
                    saveSettings();
                });
            }
        });

        savedTexts.addEventListener('change', () => {
            const selectedKey = savedTexts.value;
            if (selectedKey) {
                const selectedTextRef = ref(database, textPath(selectedKey));
                onValue(selectedTextRef, (snapshot) => {
                    if (snapshot.exists()) {
                        textInput.value = snapshot.val().text;

                        words = [];
                        currentIndex = 0;
                        display.textContent = 'Text will appear here';
                        fullText.innerHTML = textInput.value;

                        saveSettings();
                    }
                }, { onlyOnce: true });
            }

            deleteTextButton.disabled = !savedTexts.value;
        });

        savedTexts.addEventListener('change', () => {
            deleteTextButton.disabled = !savedTexts.value;
        });

        deleteTextButton.addEventListener('click', () => {
            const selectedKey = savedTexts.value;
            if (selectedKey) {
                const selectedTextRef = ref(database, textPath(selectedKey));
                remove(selectedTextRef).then(() => {
                    alert('Text deleted successfully.');
                    fetchSavedTexts();
                    savedTexts.value = '';
                }).catch(error => {
                    console.error('Error deleting text: ', error);
                });
            }
        });

        wordGroup.addEventListener('change', () => {
            saveSettings();
            if (isPlaying.status) {
                clearInterval(timer);
                playWords();
            }
        });

        speedSlider.addEventListener('input', () => {
            const milliseconds = parseInt(speedSlider.value, 10);
            const wordsPerSecond = (1000 / milliseconds).toFixed(2);
            speedValue.textContent = `${wordsPerSecond} words/sec`;

            saveSettings();
            if (isPlaying.status) {
                clearInterval(timer);
                playWords();
            }
        });

        document.addEventListener('DOMContentLoaded', () => {
            basePathHelpersReady.finally(() => {
                watchBasePath((basePath) => {
                    DATABASE_BASE_PATH = basePath;
                    textsRef = ref(database, textPath());
                    fetchSavedTexts();
                });
            });

            loadSettings();
            updateSpeedDisplay();
        });

        startPauseButton.addEventListener('click', () => {
            togglePlayPause();
            saveSettings();
        });

        clearTextButton.addEventListener('click', () => {
            textInput.value = '';
            words = [];
            currentIndex = 0;
            display.textContent = 'Text will appear here';
            fullText.innerHTML = '';
            saveSettings();
        });

        resetButton.addEventListener('click', resetPlayback);
