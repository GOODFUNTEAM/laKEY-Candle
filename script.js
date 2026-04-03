const KEY_PREFIX = "GF_";
const rankMap = { SSSR: "極其幸運", SSR: "好事發生", SR: "頗為順利", R: "平淡是福", N: "日常依舊", SP: "因果未知" };
const tasks = ["跟愛的人說愛他", "畫下手邊物品", "深呼吸三次", "整理書桌雜物", "聽一首喜歡的歌", "對鏡子微笑", "喝一杯溫水"];

function getToday() { return new Date().toDateString(); }

window.onload = () => {
    // 1. 彈出定位請求
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            p => fetchWeatherData(p.coords.latitude, p.coords.longitude),
            e => fetchWeatherData(24.8, 120.9, "新竹地區")
        );
    }

    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');

    if (key && key.startsWith(KEY_PREFIX)) {
        const id = key.replace(KEY_PREFIX, "");
        localStorage.setItem('lucky_candle_id', id);
        // 2. 自動抹除網址 Key
        const cleanURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({}, document.title, cleanURL);
        initApp(id);
    } else {
        const savedID = localStorage.getItem('lucky_candle_id');
        if (savedID) initApp(savedID);
        else document.getElementById('lock-screen').style.display = 'flex';
    }
};

async function fetchWeatherData(lat, lon, fallback = null) {
    try {
        if (!fallback) {
            const g = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`);
            const gd = await g.json();
            document.getElementById('loc-val').innerText = gd.address.suburb || gd.address.city || "目前位置";
        } else { document.getElementById('loc-val').innerText = fallback; }

        const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`);
        const wd = await w.json();
        
        document.getElementById('temp-val').innerText = Math.round(wd.current_weather.temperature) + "°C";
        document.getElementById('range-val').innerText = `${Math.round(wd.daily.temperature_2m_max[0])}°/${Math.round(wd.daily.temperature_2m_min[0])}°`;
        document.getElementById('rain-val').innerText = (wd.daily.precipitation_probability_max[0] || 0) + "%";
        document.getElementById('sky-val').innerText = {0:"晴朗",1:"多雲",2:"陰天",3:"陰天",61:"雨天"}[wd.current_weather.weathercode] || "多雲";
    } catch(e) { document.getElementById('loc-val').innerText = "連線中"; }
}

async function initApp(id) {
    const today = getToday();
    const storageKey = `daily_data_${id}`;
    const saved = JSON.parse(localStorage.getItem(storageKey));
    let data = (saved && saved.date === today) ? saved : null;

    if (!data) {
        const seed = parseInt(id) || 0;
        const sr = () => { const x = Math.sin(seed + Math.random()) * 10000; return x - Math.floor(x); };
        data = {
            date: today, id: id,
            rank: Object.keys(rankMap)[Math.floor(sr() * 6)],
            yi: ["散步", "喝茶", "看書", "整理", "早睡"].sort(()=>.5-sr()).slice(0,2),
            ji: ["熬夜", "生氣", "焦慮", "滑手機", "亂買"].sort(()=>.5-sr()).slice(0,2),
            destiny: "保持好奇，是生活的解藥。",
            opp: tasks[Math.floor(sr() * tasks.length)],
            tornD: false, tornO: false
        };
        try {
            const r = await fetch('messages.json');
            const m = await r.json();
            data.destiny = m[Math.floor(sr() * m.length)];
        } catch(e) {}
        localStorage.setItem(storageKey, JSON.stringify(data));
    }
    render(data);
    startCountdown();
}

function render(d) {
    document.getElementById('lock-screen').style.display = 'none';
    document.getElementById('main-calendar').style.display = 'flex';
    const now = new Date();
    document.getElementById('m-tag').innerText = (now.getMonth()+1)+"月";
    document.getElementById('d-tag').innerText = now.getDate();
    document.getElementById('w-tag').innerText = "星期"+["日","一","二","三","四","五","六"][now.getDay()];
    document.getElementById('rank-val').innerText = rankMap[d.rank];
    document.getElementById('yi-list').innerHTML = d.yi.map(i=>`<li>${i}</li>`).join('');
    document.getElementById('ji-list').innerHTML = d.ji.map(i=>`<li>${i}</li>`).join('');
    document.getElementById('text-destiny').innerText = d.destiny;
    document.getElementById('text-opportunity').innerText = d.opp;
    if(d.tornD) document.getElementById('card-destiny').classList.add('tear-active');
    if(d.tornO) document.getElementById('card-opportunity').classList.add('tear-active');
    document.querySelector('.footer').innerText = `GOODFUN TEAM // EDITION #${d.id}`;
}

function tearPaper(type) {
    const id = localStorage.getItem('lucky_candle_id');
    const key = `daily_data_${id}`;
    const d = JSON.parse(localStorage.getItem(key));
    if(!d) return;
    if(type==='destiny') { document.getElementById('card-destiny').classList.add('tear-active'); d.tornD=true; }
    else { document.getElementById('card-opportunity').classList.add('tear-active'); d.tornO=true; }
    localStorage.setItem(key, JSON.stringify(d));
}

function startCountdown() {
    setInterval(() => {
        const diff = new Date().setHours(23,59,59,999) - new Date();
        const h = Math.floor(diff/3600000).toString().padStart(2,'0');
        const m = Math.floor((diff%3600000)/60000).toString().padStart(2,'0');
        const s = Math.floor((diff%60000)/1000).toString().padStart(2,'0');
        document.getElementById('timer').innerText = `${h}:${m}:${s}`;
    }, 1000);
}

function setWish() {
    const v = document.getElementById('wish-input').value.trim();
    if(!v) return;
    document.getElementById('wish-container').innerHTML = `<div style="border:2px solid var(--red);padding:8px;color:var(--red);font-weight:900;text-align:center;">願望已封存：${v}</div>`;
}