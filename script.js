const MASTER_KEY = "GOODFUN_TOKEN_0427";
const rankMap = { SSSR: "極其幸運", SSR: "好事發生", SR: "頗為順利", R: "平淡是福", N: "日常依舊", SP: "因果未知" };
const defaultMsgs = ["順著光走，就不會迷路。", "孤芳自賞，也是一種浪漫。", "慢慢來，比較快。"];

function getToday() { return new Date().toDateString(); }

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');

    if (key === MASTER_KEY) {
        // 驗證成功，洗掉網址參數 (重整會因此重新鎖定)
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
            yi: ["散步", "喝茶", "看書"].sort(()=>.5-Math.random()).slice(0,2),
            ji: ["熬夜", "生氣", "焦慮"].sort(()=>.5-Math.random()).slice(0,2),
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
    const main = document.getElementById('main-calendar');
    main.style.display = 'flex';

    const now = new Date();
    document.getElementById('m-tag').innerText = (now.getMonth() + 1) + "月";
    document.getElementById('d-tag').innerText = now.getDate();
    document.getElementById('w-tag').innerText = "星期" + ["日","一","二","三","四","五","六"][now.getDay()];
    document.getElementById('rank-val').innerText = rankMap[data.rank];
    document.getElementById('yi-list').innerHTML = data.yi.map(i => `<li>${i}</li>`).join('');
    document.getElementById('ji-list').innerHTML = data.ji.map(i => `<li>${i}</li>`).join('');
    document.getElementById('maxim-text').innerText = `「 ${data.maxim} 」`;

    const sw = localStorage.getItem('my_wish');
    if (sw && localStorage.getItem('wish_date') === getToday()) showLockedWish(sw);
}

async function updateWeather() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const { latitude, longitude } = pos.coords;
            const gRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
            const gData = await gRes.json();
            document.getElementById('loc-val').innerText = gData.address.suburb || gData.address.city || "地區";
            
            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            const wData = await wRes.json();
            document.getElementById('temp-val').innerText = Math.round(wData.current_weather.temperature) + "°C";
        } catch(e) {}
    });
}

function setWish() {
    const val = document.getElementById('wish-input').value.trim();
    if(!val) return;
    localStorage.setItem('my_wish', val);
    localStorage.setItem('wish_date', getToday());
    showLockedWish(val);
}

function showLockedWish(text) {
    document.getElementById('wish-container').innerHTML = `<div style="border: 2px solid var(--red); padding: 12px; text-align: center; color: var(--red); font-weight: 900;">願望已封存：${text}</div>`;
}
