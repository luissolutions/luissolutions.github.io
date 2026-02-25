export function createQuizModule({
    database,
    ref,
    onValue,
    set,
    remove,
    state,
    rewardCorrect,
    punishWrong,
    renderHUD,
    persistPlayer,
    basePathGetter
}) {

    let questions = [];
    let allQuestions = [];
    let currentQuestionIndex = 0;
    let answeredQuestions = {}; 
    let currentCategory = null;

    const quizSection = document.getElementById('quizSection');

    /* ================= PATHS ================= */

    function progressPath() {
        return `${basePathGetter()}/quizData/answeredQuestions`;
    }

    /* ================= LOAD PROGRESS ================= */

    function loadQuizProgress() {
        const path = progressPath();
        onValue(ref(database, path), snap => {
            answeredQuestions = snap.val() || {};
        });
    }

    function saveProgress() {
        return set(ref(database, progressPath()), answeredQuestions);
    }

    /* ================= CATEGORY INDEX ================= */

    function populateQuizIndex() {

        const container = document.getElementById('quizIndex');
        if (!container) return;

        container.innerHTML = "<strong>Select Topic:</strong><br>";

        const questionsRef = ref(database, 'share/questions');

        onValue(questionsRef, snapshot => {

            const data = snapshot.val();
            if (!data) {
                container.innerHTML += "<div>No topics available.</div>";
                return;
            }

            Object.keys(data).forEach(description => {

                const btn = document.createElement('button');
                btn.textContent = description;

                btn.onclick = () => {
                    loadCategory(description);
                };

                container.appendChild(btn);
            });

        }, { onlyOnce: true });
    }

    /* ================= LOAD CATEGORY ================= */

    function loadCategory(description) {

        currentCategory = description;

        const questionsRef = ref(database, `share/questions/${description}`);

        onValue(questionsRef, snapshot => {

            const data = snapshot.val();
            if (!data) return;

            questions = [];

            Object.entries(data).forEach(([id, value]) => {

                // Skip permanently answered
                if (answeredQuestions[id]?.status === 'answered') return;

                // Skip incorrect unless recovered
                if (answeredQuestions[id]?.status === 'incorrect') return;

                questions.push({
                    id,
                    description,
                    ...value
                });
            });

            currentQuestionIndex = 0;

            if (questions.length > 0) {
                renderQuestion();
            } else {
                quizSection.innerHTML = "<p>No available questions in this topic.</p>";
            }

            renderRecoveryShop();

        }, { onlyOnce: true });
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

        const submitBtn = document.createElement('button');
        submitBtn.textContent = "Submit Answer";
        submitBtn.onclick = submitAnswer;
        quizSection.appendChild(submitBtn);
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

            alert("Incorrect.");
        }

        saveProgress();
        renderHUD();
        persistPlayer();

        questions.splice(currentQuestionIndex, 1);

        if (questions.length > 0) {
            currentQuestionIndex = 0;
            renderQuestion();
        } else {
            quizSection.innerHTML = "<p>No more questions in this topic.</p>";
        }

        renderRecoveryShop();
    }

    /* ================= RECOVERY SHOP ================= */

    function renderRecoveryShop() {

        const container = document.getElementById('recoveryShop');
        if (!container) return;

        container.innerHTML = "<h3>Recover Incorrect Questions</h3>";

        const incorrect = Object.entries(answeredQuestions)
            .filter(([_, data]) => data.status === 'incorrect'
                && data.description === currentCategory);

        if (!incorrect.length) {
            container.innerHTML += "<div class='hint'>No incorrect questions.</div>";
            return;
        }

        incorrect.forEach(([id, data]) => {

            const btn = document.createElement('button');
            btn.textContent = `Recover ${id} (Cost: 500 coins)`;

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
        populateQuizIndex
    };
}