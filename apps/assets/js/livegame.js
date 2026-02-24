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

    let allQuestions = [];
    let questions = [];
    let currentQuestionIndex = 0;

    let answeredQuestions = {};
    let correctAnswersCount = 0;
    let wrongAnswersCount = 0;

    function progressPath() {
        return `${basePathGetter()}/quizData/progress`;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function loadQuizProgress() {
        onValue(ref(database, progressPath()), (snap) => {
            const data = snap.val();
            if (!data) return;

            answeredQuestions = data.answeredQuestions || {};
            correctAnswersCount = Number(data.correctAnswersCount || 0);
            wrongAnswersCount = Number(data.wrongAnswersCount || 0);
        }, { onlyOnce: true });
    }

    function saveQuizProgress() {
        return set(ref(database, progressPath()), {
            answeredQuestions,
            correctAnswersCount,
            wrongAnswersCount
        });
    }

    async function resetQuizProgress() {
        await remove(ref(database, progressPath()));
        answeredQuestions = {};
        correctAnswersCount = 0;
        wrongAnswersCount = 0;
        alert('Quiz progress reset.');
        displayQuestion();
    }

    function fetchQuestions() {
        const questionsRef = ref(database, 'share/questions');

        onValue(questionsRef, (snapshot) => {
            const data = snapshot.val();

            allQuestions = [];
            if (data) {
                for (const [description, questionGroup] of Object.entries(data)) {
                    for (const [id, value] of Object.entries(questionGroup || {})) {
                        if (!value) continue;
                        allQuestions.push({ id, description, ...value });
                    }
                }
            }

            questions = shuffleArray([...allQuestions]);
            currentQuestionIndex = 0;

            displayQuestion();
        }, { onlyOnce: true });
    }

    function displayQuestion() {
        const wrap = document.getElementById('quizSection');

        if (!questions.length) {
            wrap.innerHTML = `<p class="muted">No questions available.</p>`;
            return;
        }

        let safety = 0;
        while (safety < questions.length) {
            const q = questions[currentQuestionIndex];
            const status = answeredQuestions[q.id];
            if (!status) break;

            currentQuestionIndex++;
            if (currentQuestionIndex >= questions.length) currentQuestionIndex = 0;
            safety++;
        }

        const q = questions[currentQuestionIndex];

        wrap.innerHTML = `
            <p><strong>${q.description || ''}</strong></p>
            <p>${q.question || ''}</p>
            <div id="options"></div>
            <button id="submitAnswerBtn">Submit</button>
            <div>Progress: ✅ ${correctAnswersCount} | ❌ ${wrongAnswersCount}</div>
        `;

        const optionsContainer = document.getElementById('options');

        if (Array.isArray(q.options)) {
            q.options.forEach(option => {
                optionsContainer.innerHTML += `
                    <label>
                        <input type="radio" name="quizOption" value="${option}">
                        ${option}
                    </label>
                `;
            });
        }

        document
            .getElementById('submitAnswerBtn')
            .addEventListener('click', submitAnswer);
    }

    function submitAnswer() {
        const q = questions[currentQuestionIndex];
        const selected = document.querySelector('input[name="quizOption"]:checked');

        if (!selected) {
            alert("Choose an answer.");
            return;
        }

        const userAnswer = selected.value;
        const correctAnswer = q.correctAnswer;

        let isCorrect = false;

        if (Array.isArray(correctAnswer)) {
            isCorrect = correctAnswer.length === 1 && correctAnswer.includes(userAnswer);
        } else {
            isCorrect = userAnswer === String(correctAnswer ?? '');
        }

        if (isCorrect) {
            correctAnswersCount++;
            answeredQuestions[q.id] = 'answered';

            rewardCorrect();
            renderHUD();
            persistPlayer();

            alert("Correct!");
        } else {
            wrongAnswersCount++;
            answeredQuestions[q.id] = 'incorrect';

            punishWrong();
            renderHUD();
            persistPlayer();

            alert(`Incorrect. Correct answer: ${correctAnswer}`);
        }

        saveQuizProgress();
        nextQuestion();
    }

    function nextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex >= questions.length) {
            currentQuestionIndex = 0;
        }
        displayQuestion();
    }

    return {
        fetchQuestions,
        loadQuizProgress,
        resetQuizProgress
    };
}