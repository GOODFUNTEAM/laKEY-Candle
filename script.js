const MASTER_KEY = "GOODFUN_TOKEN_0427";
const rankMap = { SSSR: "極其幸運", SSR: "好事發生", SR: "頗為順利", R: "平淡是福", N: "日常依舊", SP: "因果未知" };
// 預設金句池（當 messages.json 抓不到時使用）
const defaultMsgs = ["順著光走，就不會迷路。", "今天的你，比昨天更帥氣。", "慢慢來，比較快。", "保持好奇，是生活的解藥。", "孤芳自賞，也是一種浪漫。"];

function getToday() { return new Date().toDateString(); }

window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const key = urlParams.get('key');

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
    let data;
    
    if (saved && saved.date === today) {
        data = saved;
    } else {
        data = {
            date: today,
            rank: Object.keys(rankMap)[Math.floor(Math.random() * 6)],
            yi: ["散步", "喝茶", "聽音樂", "早睡", "整理", "看書"].sort(()=>.5-Math.random()).slice(0,2),
            ji: ["熬夜", "焦慮", "亂買", "滑手機", "生氣", "悲觀"].sort(()=>.5-Math.random()).slice(0,2),
            maxim: "..."
        };

        // 嘗試抓取外部 JSON，失敗則用預設金句
        try {
            const res = await fetch('messages.json');
            if (!res.ok) throw new Error();
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
    document.getElementById('maxim-text').innerText = `「 ${data.maxim} 」`;
    
    const sw = localStorage.getItem('my_wish');
    if (sw && localStorage.getItem('wish_date') === getToday()) showLockedWish(sw);
}

async function updateWeather() {
    if (!navigator.geolocation) {
        document.getElementById('loc-val').innerText = "不支援定位";
        return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const { latitude, longitude } = pos.coords;
            // 抓地名
            const gRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
            const gData = await gRes.json();
            document.getElementById('loc-val').innerText = gData.address.suburb || gData.address.city || "地區未知";
            
            // 抓氣溫
            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            const wData = await wRes.json();
            document.getElementById('temp-val').innerText = Math.round(wData.current_weather.temperature) + "°C";
        } catch(e) {
            document.getElementById('loc-val').innerText = "連線失敗";
            document.getElementById('temp-val').innerText = "--°C";
        }
    }, (err) => {
        document.getElementById('loc-val').innerText = "未開定位";
        document.getElementById('temp-val').innerText = "Offline";
    }, { timeout: 10000 }); // 10秒超時
}
