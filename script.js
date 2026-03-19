const MASTER_KEY = "GOODFUN_TOKEN_0427";
const rankMap = { SSSR: "極其幸運", SSR: "好事發生", SR: "頗為順利", R: "平淡是福", N: "日常依舊", SP: "因果未知" };
const defaultMsgs = ["順著光走，就不會迷路。", "今天的你，比昨天更帥氣。", "慢慢來，比較快。", "保持好奇，是生活的解藥。", "孤芳自賞，也是一種浪漫。"];

function getToday() { return new Date().toDateString(); }

window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const key = urlParams.get('key');

    // 檢查網址是否有 NFC 金鑰
    if (key === MASTER_KEY) {
        // 成功後立刻清除網址參數，確保「重整即鎖定」
        window.history.replaceState({}, document.title, window.location.pathname);
        initApp();
    } else {
        // 沒 Key 則顯示鎖定畫面
        document.getElementById('lock-screen').style.display = 'flex';
        document.getElementById('main-calendar').style.display = 'none';
    }
};

async function initApp() {
    const today = getToday();
    const saved = JSON.parse(localStorage.getItem('daily_data'));
    let data;
    
    // 檢查今日是否已生成數據
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

        // 抓取訊息邏輯
        try {
            const res = await fetch('messages.json');
            if (!res.ok) throw new Error();
            const msgs = await res.json();
            data.maxim = Array.isArray(msgs) ? msgs[Math.floor(Math.random() * msgs.length)] : defaultMsgs[0];
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
        const { latitude, longitude } = pos.coords;
        try {
            // 抓取行政區地名
            const gRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
            const gData = await gRes.json();
            const city = gData.address.suburb || gData.address.city || gData.address.town || "新竹地區";
            document.getElementById('loc-val').innerText = city;
            
            // 抓取即時氣溫
            const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            const wData = await wRes.json();
            document.getElementById('temp-val').innerText = Math.round(wData.current_weather.temperature) + "°C";
        } catch(e) {
            document.getElementById('loc-val').innerText = "連線失敗";
        }
    }, (err) => {
        document.getElementById('loc-val').innerText = "定位未開";
        document.getElementById('temp-val').innerText = "--°C";
    }, { timeout: 10000 });
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
    if(container) {
        container.innerHTML = `
            <div style="border: 2px solid var(--red); padding: 12px; text-align: center; color: var(--red); font-weight: 900; background: rgba(230,0,18,0.03);">
                願望已封存：${text}
            </div>`;
    }
}
