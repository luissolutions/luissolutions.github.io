// assets/js/livelearn.js

export function createLiveLearn({
    database,
    ref,
    onValue,
    set,
    remove,
    basePathGetter,

    onCorrect = () => {},
    onWrong = () => {},
    onQuizComplete = () => {}
}) {

    let questions = [];
    let currentQuestionIndex = 0;

    let answeredQuestions = {};
    let correctAnswersCount = 0;
    let wrongAnswersCount = 0;

    function progressPath() {
        return `${basePathGetter()}/quizData`;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function fetchQuestions(callback) {
        const questionsRef = ref(database, 'share/questions');

        onValue(questionsRef, (snapshot) => {
            const data = snapshot.val();
            questions = [];

            if (data) {
                for (const [description, group] of Object.entries(data)) {
                    for (const [id, value] of Object.entries(group)) {
                        questions.push({ id, description, ...value });
                    }
                }
            }

            questions = shuffleArray(questions);
            currentQuestionIndex = 0;

            if (callback) callback(getCurrentQuestion());
        }, { onlyOnce: true });
    }

    function getCurrentQuestion() {
        return questions[currentQuestionIndex] || null;
    }

    function checkAnswer(userAnswer) {
        const q = getCurrentQuestion();
        if (!q) return false;

        if (Array.isArray(q.correctAnswer)) {
            return (
                q.correctAnswer.length === userAnswer.length &&
                q.correctAnswer.every(a => userAnswer.includes(a))
            );
        }

        return String(userAnswer).trim() === String(q.correctAnswer).trim();
    }

    function submitAnswer(userAnswer, callback) {

        const q = getCurrentQuestion();
        if (!q) return;

        const isCorrect = checkAnswer(userAnswer);

        if (isCorrect) {
            correctAnswersCount++;
            answeredQuestions[q.id] = 'answered';
            onCorrect(q);
        } else {
            wrongAnswersCount++;
            answeredQuestions[q.id] = 'incorrect';
            onWrong(q);
        }

        saveProgress();

        if (callback) callback(isCorrect, q);

        nextQuestion();
    }

    function nextQuestion() {
        currentQuestionIndex++;

        if (currentQuestionIndex >= questions.length) {
            onQuizComplete();
        }
    }

    function saveProgress() {
        return set(ref(database, `${progressPath()}/progress`), {
            answeredQuestions,
            correctAnswersCount,
            wrongAnswersCount
        });
    }

    function loadProgress(callback) {
        onValue(ref(database, `${progressPath()}/progress`), (snap) => {
            const data = snap.val();
            if (!data) return;

            answeredQuestions = data.answeredQuestions || {};
            correctAnswersCount = data.correctAnswersCount || 0;
            wrongAnswersCount = data.wrongAnswersCount || 0;

            if (callback) callback();
        }, { onlyOnce: true });
    }

    function resetProgress(callback) {
        remove(ref(database, `${progressPath()}/progress`)).then(() => {
            answeredQuestions = {};
            correctAnswersCount = 0;
            wrongAnswersCount = 0;
            currentQuestionIndex = 0;
            if (callback) callback();
        });
    }

    function getStats() {
        return {
            correct: correctAnswersCount,
            wrong: wrongAnswersCount,
            total: correctAnswersCount + wrongAnswersCount
        };
    }

    return {
        fetchQuestions,
        getCurrentQuestion,
        submitAnswer,
        nextQuestion,
        loadProgress,
        resetProgress,
        getStats
    };
}