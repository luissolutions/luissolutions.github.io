// assets/js/livegame.js

import {
    database,
    ref,
    onValue,
    set,
    remove
} from '../../../assets/js/firebase-init.js';

/* =========================================================
   SHARED INTERNAL STATE
========================================================= */

let DATABASE_BASE_PATH = 'public';
let gameState = null;         // reference to main state
let persistPlayer = null;     // callback from main
let renderHUD = null;         // callback from main

/* =========================================================
   INITIALIZER FOR INVENTORY + SHOP
========================================================= */

export function initInventorySystem({
    basePath,
    stateRef,
    persist,
    renderHud
}) {
    DATABASE_BASE_PATH = basePath;
    gameState = stateRef;
    persistPlayer = persist;
    renderHUD = renderHud;
}

/* =========================================================
   SHOP SYSTEM
========================================================= */

let shopItems = [];

function safeKey(str) {
    return String(str)
        .toLowerCase()
        .replace(/\./g, '')
        .replace(/[#$\/\[\]]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_-]/g, '');
}

export function loadShop() {
    const path = `${DATABASE_BASE_PATH}/ledgerTx`;

    onValue(ref(database, path), (snap) => {
        const raw = snap.val() || {};
        const list = [];

        Object.values(raw).forEach(year => {
            Object.values(year || {}).forEach(v => {
                if (!v) return;
                if (v.type !== 'expense') return;

                const tags = Array.isArray(v.tags) ? v.tags : [];
                const hasInv = tags.some(t => String(t).toLowerCase() === 'inv');
                if (!hasInv) return;

                list.push({
                    sku: v.sku || v.name,
                    name: v.name || v.sku || 'Item',
                    price: Math.abs(Number(v.amt || 0)),
                    img: v.img || '',
                    desc: v.desc || ''
                });
            });
        });

        const grouped = {};
        list.forEach(i => {
            const k = safeKey(i.sku);
            if (!grouped[k]) grouped[k] = i;
        });

        shopItems = Object.values(grouped);
        renderShop();
    });
}

function renderShop() {
    const panel = document.getElementById('shopPanel');
    if (!panel) return;

    panel.innerHTML = '';

    if (!shopItems.length) {
        panel.innerHTML = '<div class="hint">No inventory items found.</div>';
        return;
    }

    shopItems.forEach(item => {
        const btn = document.createElement('button');
        btn.textContent = `Buy ${item.name} (${item.price})`;

        btn.onclick = () => {
            const priceCoins = Math.round(item.price * 100);
            if (gameState.coins < priceCoins)
                return alert('Not enough coins.');

            gameState.coins -= priceCoins;

            const key = safeKey(item.sku);
            if (!gameState.inventory[key])
                gameState.inventory[key] = [];

            gameState.inventory[key].push({
                x: 0,
                y: 0,
                name: item.name,
                sku: item.sku,
                img: item.img,
                desc: item.desc
            });

            renderHUD();
            persistPlayer();
            renderInventory();
        };

        panel.appendChild(btn);
    });
}

/* =========================================================
   INVENTORY PANEL
========================================================= */

export function renderInventory() {
    const panel = document.getElementById('inventoryPanel');
    if (!panel) return;

    panel.innerHTML = '<h3>Inventory</h3>';

    const entries = Object.entries(gameState.inventory)
        .filter(([, v]) => Array.isArray(v));

    if (!entries.length) {
        panel.innerHTML += '<div class="hint">No items yet.</div>';
        return;
    }

    for (const [key, list] of entries) {
        const div = document.createElement('div');
        div.className = 'inventory-line';
        div.textContent = `${list[0]?.name || key} x ${list.length}`;
        panel.appendChild(div);
    }
}

/* =========================================================
   CANVAS ITEM ENGINE
========================================================= */

let canvasRef = null;
let ctxRef = null;
let drag = null;
let hover = null;
let clickCount = 0;
let lastClick = 0;

const itemImageCache = new Map();
const TILE = 32;

export function attachInventoryCanvas(canvas, ctx) {
    canvasRef = canvas;
    ctxRef = ctx;

    canvas.onmousedown = handleMouseDown;
    canvas.onmousemove = e => hover = tile(e);
    canvas.onmouseup = handleMouseUp;
}

function getCachedImage(url) {
    if (!url) return null;
    if (itemImageCache.has(url))
        return itemImageCache.get(url);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;

    itemImageCache.set(url, img);
    return img;
}

export function drawItems() {
    if (!ctxRef) return;

    for (const list of Object.values(gameState.inventory)) {
        if (!Array.isArray(list)) continue;

        list.forEach(obj => {

            if (drag && drag.obj === obj) return;

            if (obj.img) {
                const img = getCachedImage(obj.img);
                if (img && img.complete && img.naturalWidth > 0) {
                    ctxRef.drawImage(
                        img,
                        obj.x * TILE,
                        obj.y * TILE,
                        TILE,
                        TILE
                    );
                    return;
                }
            }

            ctxRef.fillStyle = '#999';
            ctxRef.fillRect(
                obj.x * TILE + 5,
                obj.y * TILE + 5,
                TILE - 10,
                TILE - 10
            );
        });
    }
}

function tile(e) {
    const rect = canvasRef.getBoundingClientRect();
    const scaleX = canvasRef.width / rect.width;
    const scaleY = canvasRef.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    return {
        x: Math.floor(canvasX / TILE),
        y: Math.floor(canvasY / TILE)
    };
}

function getItem(x, y) {
    for (const [key, list] of Object.entries(gameState.inventory)) {
        if (!Array.isArray(list)) continue;
        for (const obj of list) {
            if (obj.x === x && obj.y === y)
                return { key, obj };
        }
    }
    return null;
}

function handleMouseDown(e) {
    const now = Date.now();
    clickCount = (now - lastClick < 400)
        ? clickCount + 1
        : 1;
    lastClick = now;

    const { x, y } = tile(e);
    const item = getItem(x, y);
    if (!item) return;

    if (clickCount === 3) {
        const arr = gameState.inventory[item.key];
        const idx = arr.indexOf(item.obj);
        if (idx >= 0) arr.splice(idx, 1);

        renderInventory();
        persistPlayer();
        clickCount = 0;
        return;
    }

    drag = item;
}

function handleMouseUp() {
    if (!drag || !hover) return;

    drag.obj.x = hover.x;
    drag.obj.y = hover.y;

    persistPlayer();
    drag = null;
}

/* =========================================================
   QUIZ SYSTEM (UNCHANGED)
========================================================= */

let questions = [];
let currentIndex = 0;
let answeredQuestions = {};
let correctCount = 0;
let wrongCount = 0;

let onCorrect = () => { };
let onWrong = () => { };
let onFinish = () => { };

export function initQuizSystem({
    basePath,
    correctHandler,
    wrongHandler,
    finishHandler
}) {
    DATABASE_BASE_PATH = basePath;
    onCorrect = correctHandler;
    onWrong = wrongHandler;
    onFinish = finishHandler;

    loadQuizProgress();
}

export function openQuiz() {
    fetchQuestions();
}

export function resetQuizProgress() {
    remove(ref(database, progressPath()));
}

function progressPath() {
    return `${DATABASE_BASE_PATH}/quizData/progress`;
}

function loadQuizProgress() {
    onValue(ref(database, progressPath()), snap => {
        const data = snap.val();
        if (!data) return;

        answeredQuestions = data.answeredQuestions || {};
        correctCount = data.correctAnswersCount || 0;
        wrongCount = data.wrongAnswersCount || 0;
    }, { onlyOnce: true });
}

function fetchQuestions() {
    const questionsRef = ref(database, 'share/questions');

    onValue(questionsRef, snapshot => {
        const data = snapshot.val();
        questions = [];

        if (data) {
            for (const group of Object.values(data)) {
                for (const q of Object.values(group || {})) {
                    questions.push(q);
                }
            }
        }

        currentIndex = 0;
        displayQuestion();
    }, { onlyOnce: true });
}

function displayQuestion() {
    const wrap = document.getElementById('quizSection');
    if (!questions.length) {
        wrap.innerHTML = "No questions.";
        return;
    }

    const q = questions[currentIndex];

    wrap.innerHTML = `
        <p>${q.question}</p>
        ${q.options.map(o =>
        `<label><input type="radio" name="quizOption" value="${o}"> ${o}</label>`
    ).join('<br>')}
        <button id="submitAnswerBtn">Submit</button>
    `;

    document
        .getElementById('submitAnswerBtn')
        .onclick = submitAnswer;
}

function submitAnswer() {
    const selected = document.querySelector('input[name="quizOption"]:checked');
    if (!selected) return alert("Choose an answer.");

    const q = questions[currentIndex];
    const isCorrect = selected.value === q.correctAnswer;

    if (isCorrect) {
        correctCount++;
        onCorrect();
    } else {
        wrongCount++;
        onWrong();
    }

    currentIndex++;
    if (currentIndex >= questions.length) {
        onFinish();
        return;
    }

    displayQuestion();
}