document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn');
    const numbersDisplay = document.getElementById('numbersDisplay');
    const historyList = document.getElementById('historyList');
    const starsContainer = document.getElementById('starsContainer');

    let history = [];

    // Initialize Stars
    function initStars() {
        const starCount = 100;
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            const size = Math.random() * 2 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.setProperty('--duration', `${Math.random() * 3 + 2}s`);
            starsContainer.appendChild(star);
        }
    }

    function getBallColorClass(num) {
        if (num <= 10) return 'ball-range-1';
        if (num <= 20) return 'ball-range-2';
        if (num <= 30) return 'ball-range-3';
        if (num <= 40) return 'ball-range-4';
        return 'ball-range-5';
    }

    function generateLottoNumbers() {
        const numbers = [];
        while (numbers.length < 6) {
            const r = Math.floor(Math.random() * 45) + 1;
            if (numbers.indexOf(r) === -1) numbers.push(r);
        }
        return numbers.sort((a, b) => a - b);
    }

    async function displayNumbers(numbers) {
        generateBtn.disabled = true;
        const balls = document.querySelectorAll('.lotto-ball');

        // Reset balls
        balls.forEach(ball => {
            ball.textContent = '?';
            ball.className = 'lotto-ball empty';
        });

        // Reveal sequence
        for (let i = 0; i < numbers.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 400));

            const ball = balls[i];
            const num = numbers[i];

            ball.textContent = num;
            ball.classList.remove('empty');
            ball.classList.add('active');
            ball.classList.add(getBallColorClass(num));

            // Subtle haptic feel (if supported) or just scale effect
            ball.style.transform = 'scale(1.2)';
            setTimeout(() => {
                ball.style.transform = 'scale(1)';
            }, 200);
        }

        addToHistory(numbers);
        generateBtn.disabled = false;
    }

    function addToHistory(numbers) {
        const historyItem = {
            id: Date.now(),
            numbers: [...numbers],
            time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            rawNumbers: numbers.join(', ')
        };

        history.unshift(historyItem);
        if (history.length > 5) history.pop();

        renderHistory();
    }

    function renderHistory() {
        if (history.length === 0) return;

        historyList.innerHTML = '';
        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';

            const numsHtml = item.numbers.map(n =>
                `<span class="history-ball ${getBallColorClass(n)}">${n}</span>`
            ).join('');

            div.innerHTML = `
                <div class="history-nums">${numsHtml}</div>
                <div class="history-actions">
                    <span class="history-time">${item.time}</span>
                    <button class="copy-btn" onclick="copyToClipboard('${item.rawNumbers}')">복사</button>
                </div>
            `;
            historyList.appendChild(div);
        });
    }

    generateBtn.addEventListener('click', () => {
        const newNumbers = generateLottoNumbers();
        displayNumbers(newNumbers);
    });

    window.copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('번호가 복사되었습니다: ' + text);
        });
    };

    initStars();
});
