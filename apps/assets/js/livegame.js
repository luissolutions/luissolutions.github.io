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
}) {

    let questions = [];
    let currentQuestionIndex = 0;
    let answeredQuestions = {};
    let currentCategory = null;

    const quizSection = document.getElementById('quizSection');

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

        }, { onlyOnce: true });

        select.onchange = (e) => {
            const topic = e.target.value;
            if (!topic) return;
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
                    <input type="radio" name="answer" value="${option}">
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

        const selected = document.querySelector('input[name="answer"]:checked');
        if (!selected) {
            alert("Select an answer.");
            return;
        }

        const userAnswer = selected.value;

        const correct = Array.isArray(q.correctAnswer)
            ? q.correctAnswer.includes(userAnswer)
            : userAnswer === q.correctAnswer;

        if (correct) {

            answeredQuestions[q.id] = {
                status: 'answered',
                description: q.description
            };

            rewardCorrect(q.description);
            alert("Correct!");

        } else {

            answeredQuestions[q.id] = {
                status: 'incorrect',
                description: q.description
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

        incorrect.forEach(([id]) => {

            const btn = document.createElement('button');
            btn.textContent = `Recover Question (Cost: 500 coins)`;

            btn.onclick = () => recoverQuestion(id);

            container.appendChild(btn);
        });
    }

    function recoverQuestion(id) {

        const COST = 500;

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