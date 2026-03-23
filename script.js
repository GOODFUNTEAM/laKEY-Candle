const MASTER_KEY = "GOODFUN_TOKEN_0427";
const rankMap = { SSSR: "極其幸運", SSR: "好事發生", SR: "頗為順利", R: "平淡是福", N: "日常依舊", SP: "因果未知" };
const defaultMsgs = ["願原力與你同在。\nMay the Force be with you.", "保持好奇，是生活的解藥。", "慢慢來，比較快。"];

function getToday() { return new Date().toDateString(); }

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');

    if (key === MASTER_KEY) {
        window.history.replaceState({}, document.title, window.location.pathname);
        initApp();
    } else {
        document.getElementById('lock-screen').style.display = 'flex';
        document.getElementById('main-calendar').style.display = 'none';
    }
};

async function initApp() {
    const today = getToday();
    const saved = JSON.parse(localStorage.getItem('daily_data'));
    let data = (saved && saved.date === today) ? saved : null;

    if (!data) {
        data = {
            date: today,
            rank: Object.keys(rankMap)[Math.floor(Math.random() * 6)],
            yi: ["散步", "喝茶", "看書", "整理", "早睡", "攝影"].sort(()=>.5-Math.random()).slice(0,2),
            ji: ["熬夜", "生氣", "焦慮", "滑手機", "亂買", "悲觀"].sort(()=>.5-Math.random()).slice(0,2),
            maxim: "..."
        };
        try {
            const res = await fetch('messages.json');
            const msgs = await res.json();
            data.maxim = msgs[Math.floor(Math.random() * msgs.length)];
        } catch(e) { 
            data.maxim = defaultMsgs[Math.floor(Math.random() * defaultMsgs.length)]; 
        }
        localStorage.setItem('daily_data', JSON.stringify(data));
    }
    render(data);
    updateWeather();
}

function render(data) {
    document.getElementById('lock-screen').style.display = 'none';
    document.getElementById('main-calendar').style.display = 'flex';

    const now = new Date();
    document.getElementById('m-tag').innerText = (now.getMonth() + 1) + "月";
    document.getElementById('d-tag').innerText = now.getDate();
    document.getElementById('w-tag').innerText = "星期" + ["日","一","二","三","四","五","六"][now.getDay()];
    document.getElementById('rank-val').innerText = rankMap[data.rank];
    document.getElementById('yi-list').innerHTML = data.yi.map(i => `<li>${i}</li>`).join('');
    document.getElementById('ji-list').innerHTML = data.ji.map(i => `<li>${i}</li>`).join('');
    document.getElementById('maxim-text').innerText = data.maxim;

    // 啟動倒數計時
    startCountdown();

    const sw = localStorage.getItem('my_wish');
    if (sw && localStorage.getItem('wish_date') === getToday()) showLockedWish(sw);
}

function startCountdown() {
    const timerEl = document.getElementById('timer');
    function update() {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(23, 59, 59, 999);
        const diff = midnight - now;
        if (diff <= 0) { timerEl.innerText = "00:00:00"; return; }
        const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        timerEl.innerText = `${h}:${m}:${s}`;
    }
    setInterval(update, 1000);
    update();
}

async function updateWeather() {
    const defLat = 24.8047; const defLon = 120.9714;
    if (!navigator.geolocation) { fetchWeatherData(defLat, defLon, "新竹地區"); return; }
    navigator.geolocation.getCurrentPosition(
        p => fetchWeatherData(p.coords.latitude, p.coords.longitude),
        e => fetchWeatherData(defLat, defLon, "新竹地區"),
        { timeout: 5000 }
    );
}

async function fetchWeatherData(lat, lon, fallbackName = null) {
    try {
        if (!fallbackName) {
            const gRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`);
            const gData = await gRes.json();
            document.getElementById('loc-val').innerText = gData.address.suburb || gData.address.city || "新竹地區";
        } else {
            document.getElementById('loc-val').innerText = fallbackName;
        }
        const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const wData = await wRes.json();
        document.getElementById('temp-val').innerText = Math.round(wData.current_weather.temperature) + "°C";
    } catch(e) { document.getElementById('loc-val').innerText = "連線中"; }
}

function setWish() {
    const val = document.getElementById('wish-input').value.trim();
    if(!val) return;
    localStorage.setItem('my_wish', val);
    localStorage.setItem('wish_date', getToday());
    showLockedWish(val);
}

function showLockedWish(text) {
    const container = document.getElementById('wish-container');
    if(container) container.innerHTML = `<div style="border: 2px solid var(--red); padding: 12px; text-align: center; color: var(--red); font-weight: 900; background: rgba(230,0,18,0.05);">願望已封存：${text}</div>`;
}
