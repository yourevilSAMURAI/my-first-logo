// ==========================================================================
// 1. ПЕРЕМЕННЫЕ И СОСТОЯНИЕ
// ==========================================================================
let maxNumber = 100;
let maxAttempts = 10;
let secretNumber;
let attempts = 0;
let timerInterval;
let seconds = 0;
let gameStarted = false;
let currentRecordFilter = 100;

const inputField = document.getElementById('guess-input');
const resultMsg = document.getElementById('result-message');
const checkBtn = document.getElementById('check-btn');
const restartBtn = document.getElementById('restart-btn');
const gameHint = document.getElementById('game-hint');
const attemptsCounter = document.getElementById('attempts-counter');
const timerDisplay = document.getElementById('timer-display');

const audio = document.getElementById('bg-audio');
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const recordDiscs = document.querySelectorAll('.record-disc');
const volumeSlider = document.getElementById('volume-slider');

// ==========================================================================
// 2. ИНИЦИАЛИЗАЦИЯ ИГРЫ
// ==========================================================================
function initGame() {
    secretNumber = Math.floor(Math.random() * maxNumber) + 1;
    attempts = 0;
    gameStarted = false;
    
    stopTimer();
    timerDisplay.textContent = 'Время: 00:00';
    gameHint.textContent = `Загадано число от 1 до ${maxNumber}.`;
    attemptsCounter.textContent = `Осталось попыток: ${maxAttempts}`;
    
    inputField.setAttribute('max', maxNumber);
    inputField.value = '';
    resultMsg.textContent = '';
    resultMsg.className = '';
    
    checkBtn.disabled = false;
    inputField.disabled = false;
    restartBtn.style.display = 'none';
    inputField.focus();
}

// ==========================================================================
// 3. ОСНОВНАЯ ИГРОВАЯ ЛОГИКА
// ==========================================================================
function checkGuess() {
    const userGuess = parseInt(inputField.value);
    if (isNaN(userGuess) || userGuess < 1 || userGuess > maxNumber) {
        resultMsg.innerHTML = `<div class="result-content">ОШИБКА: Введите число от 1 до ${maxNumber}</div>`;
        resultMsg.className = "msg-high";
        return;
    }

    if (!gameStarted) {
        gameStarted = true;
        startTimer();
    }

    attempts++;
    attemptsCounter.textContent = `Осталось попыток: ${maxAttempts - attempts}`;

    if (attempts >= maxAttempts && userGuess !== secretNumber) {
        stopTimer();
        resultMsg.innerHTML = `<div class="result-content">ИГРА ОКОНЧЕНА!<br>Было загадано: ${secretNumber}</div>`;
        resultMsg.className = "msg-lose";
        checkBtn.disabled = true;
        inputField.disabled = true;
        restartBtn.style.display = 'inline-block';
        return;
    }

    if (userGuess === secretNumber) {
        stopTimer();
        saveRecord(attempts, seconds, maxNumber);
        let word = "попыток";
        if (attempts % 10 === 1 && attempts % 100 !== 11) { word = "попытку"; }
        else if ([2, 3, 4].includes(attempts % 10) && ![12, 13, 14].includes(attempts % 100)) { word = "попытки"; }
        
        let mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        let secs = (seconds % 60).toString().padStart(2, '0');

        resultMsg.innerHTML = `<div class="result-content">УСПЕХ!<br>Вы угадали за ${attempts} ${word}!<br>Время: ${mins}:${secs}</div>`;
        resultMsg.className = "msg-win";
        checkBtn.disabled = true;
        inputField.disabled = true;
        restartBtn.style.display = 'inline-block';
    } else if (userGuess > secretNumber) {
        resultMsg.innerHTML = `<div class="result-content">МЕНЬШЕ <span class="neon-arrow down"><<</span></div>`;
        resultMsg.className = "msg-low";
    } else {
        resultMsg.innerHTML = `<div class="result-content">БОЛЬШЕ <span class="neon-arrow up">>></span></div>`;
        resultMsg.className = "msg-high";
    }
    inputField.focus();
}

// ==========================================================================
// 4. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (Таймер, сложность)
// ==========================================================================
function startTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    timerDisplay.textContent = 'Время: 00:00';
    timerInterval = setInterval(() => {
        seconds++;
        let mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        let secs = (seconds % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `Время: ${mins}:${secs}`;
    }, 1000);
}

function stopTimer() { clearInterval(timerInterval); }

function stepValue(amount) {
    if (inputField.disabled) return;
    let currentValue = parseInt(inputField.value) || 0;
    let newValue = currentValue + amount;
    if (newValue < 1) newValue = 1;
    if (newValue > maxNumber) newValue = maxNumber;
    inputField.value = newValue;
    inputField.focus();
}

function setDifficulty(limit, btnElement) {
    maxNumber = limit;
    if (limit === 100) maxAttempts = 10;
    else if (limit === 1000) maxAttempts = 20;
    else if (limit === 100000) maxAttempts = 30;
    
    const buttons = document.querySelectorAll('.diff-list-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    initGame();
}

// ==========================================================================
// 5. УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ (Экраны, панели)
// ==========================================================================
function openLogo() {
    document.getElementById('gameView').style.display = 'none';
    document.getElementById('logoView').style.display = 'block';
}

function closeLogo() {
    document.getElementById('logoView').style.display = 'none';
    document.getElementById('gameView').style.display = 'block';
}

function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    const isOpen = panel.classList.contains('show');
    
    document.getElementById('diff-panel').classList.remove('show');
    document.getElementById('records-panel').classList.remove('show');
    document.getElementById('toggle-diff-btn').classList.remove('active');
    document.getElementById('toggle-rec-btn').classList.remove('active');

    if (!isOpen) {
        panel.classList.add('show');
        if (panelId === 'diff-panel') {
            document.getElementById('toggle-diff-btn').classList.add('active');
        } else {
            document.getElementById('toggle-rec-btn').classList.add('active');
            renderRecords();
        }
    }
}

// ==========================================================================
// 6. РАБОТА С РЕКОРДАМИ (localStorage)
// ==========================================================================
function filterRecords(difficulty, btnElement) {
    currentRecordFilter = difficulty;
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    renderRecords();
}

function saveRecord(attempts, timeInSeconds, difficulty) {
    let allRecords = JSON.parse(localStorage.getItem('allGameRecords')) || { "100": [], "1000": [], "100000": [] };
    let diffRecords = allRecords[difficulty] || [];
    diffRecords.push({ attempts: attempts, time: timeInSeconds });
    
    diffRecords.sort((a, b) => {
        if (a.attempts !== b.attempts) return a.attempts - b.attempts;
        return a.time - b.time;
    });
    
    allRecords[difficulty] = diffRecords.slice(0, 10);
    localStorage.setItem('allGameRecords', JSON.stringify(allRecords));
}

function renderRecords() {
    const list = document.getElementById('records-list');
    list.innerHTML = '';
    let allRecords = JSON.parse(localStorage.getItem('allGameRecords')) || {};
    let records = allRecords[currentRecordFilter] || [];

    if (records.length === 0) {
        list.innerHTML = '<li style="color: #555; border: none; text-align: center;">Нет записей</li>';
        return;
    }

    records.forEach((rec, index) => {
        let mins = Math.floor(rec.time / 60).toString().padStart(2, '0');
        let secs = (rec.time % 60).toString().padStart(2, '0');
        let li = document.createElement('li');
        li.innerHTML = `<span>#${index + 1}</span> ${rec.attempts} поп. | ${mins}:${secs}`;
        list.appendChild(li);
    });
}

// ==========================================================================
// 7. МУЗЫКАЛЬНЫЙ ПЛЕЕР
// ==========================================================================
function togglePlayer() { 
    document.getElementById('player-expanded').classList.toggle('show'); 
}

function togglePlay() {
    if (audio.paused) {
        audio.play();
        playBtn.style.display = 'none';
        pauseBtn.style.display = 'flex';
        recordDiscs.forEach(disc => disc.style.animationPlayState = 'running');
    } else {
        audio.pause();
        playBtn.style.display = 'flex';
        pauseBtn.style.display = 'none';
        recordDiscs.forEach(disc => disc.style.animationPlayState = 'paused');
    }
}

function toggleVolume() { volumeSlider.classList.toggle('show'); }
function changeVolume(val) { audio.volume = val; }

// ==========================================================================
// 8. АТМОСФЕРНАЯ ПЫЛЬ
// ==========================================================================
function createAmbientDust() {
    const body = document.body;
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'particle';
        star.style.top = `${Math.random() * 100}%`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 6}s`;
        const size = Math.random() * 3 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        body.appendChild(star);
    }
}

// ==========================================================================
// 9. СЛУШАТЕЛИ СОБЫТИЙ (Инициализация)
// ==========================================================================
document.getElementById('openLogoBtn').addEventListener('click', openLogo);
document.getElementById('logoCloseBtn').addEventListener('click', closeLogo);

inputField.addEventListener('keypress', function (event) {
    if (event.key === 'Enter' && !inputField.disabled) {
        checkGuess();
    }
});

// Запуск при загрузке страницы
window.onload = function() {
    initGame();
    createAmbientDust();
};