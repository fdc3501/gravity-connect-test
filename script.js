document.addEventListener('DOMContentLoaded', () => {
    const updateBtn = document.getElementById('updateBtn');
    const locationSelect = document.getElementById('locationSelect');
    const currentTempEl = document.getElementById('currentTemp');
    const currentPrecipEl = document.getElementById('currentPrecip');
    const lastYearPrecipEl = document.getElementById('lastYearPrecip');
    const tempDiffEl = document.getElementById('tempDiff');
    const summaryText = document.getElementById('summaryText');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const ctx = document.getElementById('weatherChart').getContext('2d');

    let weatherChart;
    let cachedData = null;
    let currentTab = 'temp';

    const coords = {
        seoul: { lat: 37.5665, lon: 126.9780, name: '서울' },
        busan: { lat: 35.1796, lon: 129.0756, name: '부산' },
        incheon: { lat: 37.4563, lon: 126.7052, name: '인천' },
        daegu: { lat: 35.8714, lon: 128.6014, name: '대구' },
        jeju: { lat: 33.4890, lon: 126.4983, name: '제주' }
    };

    async function fetchWeatherData(location) {
        const { lat, lon } = coords[location];
        const today = new Date();

        const startDate2026 = new Date(today);
        startDate2026.setDate(today.getDate() - 10);
        const endDate2026 = new Date(today);
        endDate2026.setDate(today.getDate() + 14);

        const startDate2025 = new Date(startDate2026);
        startDate2025.setFullYear(2025);
        const endDate2025 = new Date(endDate2026);
        endDate2025.setFullYear(2025);

        const formatDate = (d) => d.toISOString().split('T')[0];

        try {
            updateBtn.disabled = true;
            updateBtn.textContent = '데이터 업데이트 중...';

            const forecastRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,precipitation_sum&past_days=10&forecast_days=14&timezone=auto`);
            const forecastData = await forecastRes.json();

            const archiveRes = await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${formatDate(startDate2025)}&end_date=${formatDate(endDate2025)}&daily=temperature_2m_max,precipitation_sum&timezone=auto`);
            const archiveData = await archiveRes.json();

            cachedData = {
                labels: forecastData.daily.time.map(t => t.split('-').slice(1).join('/')),
                thisYearTemp: forecastData.daily.temperature_2m_max,
                thisYearPrecip: forecastData.daily.precipitation_sum,
                lastYearTemp: archiveData.daily.temperature_2m_max,
                lastYearPrecip: archiveData.daily.precipitation_sum
            };

            return cachedData;
        } catch (error) {
            console.error('Weather Data Error:', error);
            alert('날씨 데이터를 가져오는데 실패했습니다.');
            return null;
        } finally {
            updateBtn.disabled = false;
            updateBtn.textContent = '데이터 분석하기';
        }
    }

    async function updateDashboard(location) {
        const data = await fetchWeatherData(location);
        if (!data) return;

        const todayIdx = 10;
        const curTemp = data.thisYearTemp[todayIdx];
        const curPrecip = data.thisYearPrecip[todayIdx];
        const lyTemp = data.lastYearTemp[todayIdx];
        const lyPrecip = data.lastYearPrecip[todayIdx];

        if (curTemp !== null && lyTemp !== null) {
            const diff = (curTemp - lyTemp).toFixed(1);
            currentTempEl.textContent = `${curTemp.toFixed(1)}°C`;
            currentPrecipEl.textContent = `${curPrecip.toFixed(1)}mm`;
            lastYearPrecipEl.textContent = `${lyPrecip.toFixed(1)}mm`;
            tempDiffEl.textContent = `${diff > 0 ? '+' : ''}${diff}°C`;
            tempDiffEl.style.color = diff > 0 ? '#ef4444' : '#3b82f6';
            renderSummary(location, diff, curPrecip, lyPrecip);
        }

        renderChart();
    }

    function renderChart() {
        if (!cachedData) return;
        if (weatherChart) {
            weatherChart.destroy();
        }

        const isTemp = currentTab === 'temp';
        const datasets = isTemp ? [
            {
                label: '올해 기온 (°C)',
                data: cachedData.thisYearTemp,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: '작년 기온 (°C)',
                data: cachedData.lastYearTemp,
                borderColor: '#94a3b8',
                borderDash: [5, 5],
                fill: false,
                tension: 0.4
            }
        ] : [
            {
                label: '올해 강수량 (mm)',
                data: cachedData.thisYearPrecip,
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: '#3b82f6',
                borderWidth: 1
            },
            {
                label: '작년 강수량 (mm)',
                data: cachedData.lastYearPrecip,
                backgroundColor: 'rgba(209, 213, 219, 0.4)',
                borderColor: '#94a3b8',
                borderWidth: 1
            }
        ];

        weatherChart = new Chart(ctx, {
            type: isTemp ? 'line' : 'bar',
            data: {
                labels: cachedData.labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                scales: {
                    y: {
                        beginAtZero: !isTemp,
                        title: { display: true, text: isTemp ? '기온 (°C)' : '강수량 (mm)' },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    function renderSummary(location, diff, curP, lyP) {
        const name = coords[location].name;
        summaryText.innerHTML = `
            <div class="history-item" style="flex-direction: column; align-items: flex-start; gap: 0.5rem;">
                <p><strong>${name} 지역</strong> 분석 완료</p>
                <p>오늘 기온은 작년 대비 <strong>${Math.abs(diff)}°C ${diff > 0 ? '상승' : '하강'}</strong>했습니다.</p>
                <p>강수 현황: 올해는 <strong>${curP.toFixed(1)}mm</strong>, 작년에는 <strong>${lyP.toFixed(1)}mm</strong>의 비/눈이 내렸습니다.</p>
            </div>
        `;
    }

    // Tab Switching Logic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            renderChart();
        });
    });

    updateBtn.addEventListener('click', () => updateDashboard(locationSelect.value));
    updateDashboard('seoul');
});
