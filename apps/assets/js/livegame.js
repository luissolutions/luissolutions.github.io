export function createQuizModule({
        database,
    ref,
    onValue,
    set,
    remove,
    state,
    update,
    rewardCorrect,
    punishWrong,
    renderHUD,
    persistPlayer,
    basePathGetter
}) 

{
    let questions = [];
    let currentQuestionIndex = 0;
    let answeredQuestions = {};
    let currentCategory = null;

    const quizSection = document.getElementById('quizSection');
    const LAST_TOPIC_KEY = "knowledgeRpg_lastTopic";

    /* ================= PATHS ================= */

    function progressPath() {
        return `${basePathGetter()}/gameData/progress`;
    }

    /* ================= LOAD PROGRESS ================= */

    function loadQuizProgress() {
        onValue(ref(database, progressPath()), snap => {
            answeredQuestions = snap.val() || {};
        });
    }

    function saveProgress() {
        return set(ref(database, progressPath()), answeredQuestions);
    }

    /* ================= RESET ================= */

    function resetQuizProgress() {

        if (!confirm("Reset ALL quiz progress?")) return;

        answeredQuestions = {};

        set(ref(database, progressPath()), {})
            .then(() => {
                alert("Quiz progress reset.");

                if (currentCategory) {
                    loadCategory(currentCategory);
                }

                renderRecoveryShop();
            });
    }

    /* ================= DROPDOWN ================= */

    function populateQuizIndex() {

        const select = document.getElementById('quizTopicSelect');
        if (!select) return;

        select.innerHTML = `<option value="">-- Choose Topic --</option>`;

        onValue(ref(database, 'share/questions'), snapshot => {

            const data = snapshot.val();
            if (!data) return;

            Object.keys(data).forEach(description => {

                const option = document.createElement('option');
                option.value = description;
                option.textContent = description;

                select.appendChild(option);
            });

            const savedTopic = localStorage.getItem(LAST_TOPIC_KEY);

            if (savedTopic && data[savedTopic]) {
                select.value = savedTopic;
                loadCategory(savedTopic);
            }

        }, { onlyOnce: true });

        select.onchange = (e) => {
            const topic = e.target.value;
            if (!topic) return;

            localStorage.setItem(LAST_TOPIC_KEY, topic);
            loadCategory(topic);
        };

        /* Wire reset button */
        const resetBtn = document.getElementById('resetProgressBtn');
        if (resetBtn) {
            resetBtn.onclick = resetQuizProgress;
        }
    }

    /* ================= LOAD CATEGORY ================= */

    function loadCategory(description) {

        currentCategory = description;

        onValue(ref(database, `share/questions/${description}`), snapshot => {

            const data = snapshot.val();
            if (!data) return;

            questions = [];
            const allTopicQuestions = [];

            Object.entries(data).forEach(([id, value]) => {

                const full = { id, description, ...value };
                allTopicQuestions.push(full);

                if (answeredQuestions[id]?.status === 'answered') return;
                if (answeredQuestions[id]?.status === 'incorrect') return;

                questions.push(full);
            });

            currentQuestionIndex = 0;

            renderTopicStats(allTopicQuestions);

            if (questions.length > 0) {
                renderQuestion();
            } else {
                quizSection.innerHTML = "<p>No available questions in this topic.</p>";
            }

            renderRecoveryShop();

        }, { onlyOnce: true });
    }

    /* ================= STATS ================= */

    function renderTopicStats(allTopicQuestions) {

        const statsEl = document.getElementById('quizStats');
        if (!statsEl) return;

        const total = allTopicQuestions.length;

        const correct = allTopicQuestions.filter(q =>
            answeredQuestions[q.id]?.status === 'answered'
        ).length;

        const incorrect = allTopicQuestions.filter(q =>
            answeredQuestions[q.id]?.status === 'incorrect'
        ).length;

        const remaining = total - correct - incorrect;

        const percent = total > 0
            ? Math.round((correct / total) * 100)
            : 0;

        statsEl.innerHTML = `
            Remaining: ${remaining} |
            Incorrect: ${incorrect} |
            Completed: ${percent}%
        `;
    }

    /* ================= RENDER QUESTION ================= */

    function renderQuestion() {

        const q = questions[currentQuestionIndex];
        if (!q) {
            quizSection.innerHTML = "<p>No more questions.</p>";
            return;
        }

        quizSection.innerHTML = `
        <p><strong>${q.description}</strong></p>
        <p>${q.question}</p>
    `;

        if (q.options) {
            q.options.forEach(option => {

                const label = document.createElement('label');
                label.innerHTML = `
                <input type="checkbox" name="answer" value="${option}">
                ${option}
            `;
                quizSection.appendChild(label);
                quizSection.appendChild(document.createElement('br'));
            });
        }

        const btn = document.createElement('button');
        btn.textContent = "Submit Answer";
        btn.onclick = submitAnswer;
        quizSection.appendChild(btn);
    }

    /* ================= SUBMIT ================= */

    function submitAnswer() {

        const q = questions[currentQuestionIndex];
        if (!q) return;

        const selected = [...document.querySelectorAll('input[name="answer"]:checked')]
            .map(el => el.value);

        if (!selected.length) {
            alert("Select at least one answer.");
            return;
        }

        const correctAnswers = Array.isArray(q.correctAnswer)
            ? q.correctAnswer
            : [q.correctAnswer];

        const isCorrect =
            selected.length === correctAnswers.length &&
            selected.every(val => correctAnswers.includes(val));

        if (isCorrect) {

            answeredQuestions[q.id] = {
                status: 'answered',
                description: q.description,
                question: q.question
            };

            rewardCorrect(q.description);
            alert("Correct!");

        } else {

            answeredQuestions[q.id] = {
                status: 'incorrect',
                description: q.description,
                question: q.question
            };

            punishWrong(q.description);
            alert("Incorrect!");
        }

        saveProgress();
        renderHUD();
        persistPlayer();

        loadCategory(currentCategory);
    }

    /* ================= RECOVERY SHOP ================= */

    function renderRecoveryShop() {

        const container = document.getElementById('recoveryShop');
        if (!container || !currentCategory) return;

        container.innerHTML = "<h3>Recover Incorrect Questions</h3>";

        const incorrect = Object.entries(answeredQuestions)
            .filter(([_, data]) =>
                data.status === 'incorrect' &&
                data.description === currentCategory
            );

        if (!incorrect.length) {
            container.innerHTML += "<div class='hint'>No incorrect questions.</div>";
            return;
        }

        incorrect.forEach(([id, data]) => {

            const wrapper = document.createElement('div');
            wrapper.className = 'panel';
            wrapper.style.marginBottom = '8px';

            const title = document.createElement('div');
            title.innerHTML = `<strong>${data.question || id}</strong>`;

            const btn = document.createElement('button');
            btn.textContent = `Recover (Cost: 50 coins)`;
            btn.onclick = () => recoverQuestion(id);

            wrapper.appendChild(title);
            wrapper.appendChild(btn);

            container.appendChild(wrapper);
        });
    }

    function recoverQuestion(id) {

        const COST = 5000;

        if (state.coins < COST) {
            alert("Not enough coins.");
            return;
        }

        state.coins -= COST;

        delete answeredQuestions[id];

        saveProgress();
        renderHUD();
        persistPlayer();

        loadCategory(currentCategory);
    }

    /* ================= PUBLIC API ================= */

    return {
        loadQuizProgress,
        populateQuizIndex,
        resetQuizProgress
    };
}