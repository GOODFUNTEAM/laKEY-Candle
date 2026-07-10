const KEY_PREFIX = "GF_";
const tasks = ["跟愛的人說愛他", "畫下手邊物品", "深呼吸三次", "整理書桌雜物", "對鏡子微笑", "喝一杯溫水"];

function getToday() { return new Date().toDateString(); }

// 支援短數字 ID（GF_001）與長亂碼 ID（GF_x7K9pQ2mZ8vL）兩種格式，
// 用簡單字串雜湊產生數字種子，取代原本只能吃數字的 parseInt(id)
function hashId(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return h;
}

function profileKey(id) { return `GF_PROFILE_${id}`; }
function getProfile(id) {
    try { return JSON.parse(localStorage.getItem(profileKey(id))); } catch(e) { return null; }
}
function saveProfile(id, profile) {
    localStorage.setItem(profileKey(id), JSON.stringify(profile));
}

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');

    if (key && key.startsWith(KEY_PREFIX)) {
        const id = key.replace(KEY_PREFIX, "");
        window.current_id = id;
        const profile = getProfile(id);

        document.getElementById('lock-screen').style.display = 'none';

        if (!profile) {
            // 第一次感應：先請使用者設定暱稱與生日
            document.getElementById('main-calendar').style.display = 'none';
            document.getElementById('setup-screen').style.display = 'flex';
        } else {
            document.getElementById('setup-screen').style.display = 'none';
            document.getElementById('main-calendar').style.display = 'flex';
            initApp(id, profile);
        }

        const cleanURL = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({}, document.title, cleanURL);
    } else {
        document.getElementById('lock-screen').style.display = 'flex';
        document.getElementById('setup-screen').style.display = 'none';
        document.getElementById('main-calendar').style.display = 'none';
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            p => fetchWeatherData(p.coords.latitude, p.coords.longitude),
            e => fetchWeatherData(25.03, 121.56, "台北地區")
        );
    }
};

function completeSetup() {
    const id = window.current_id; if (!id) return;
    const nickname = document.getElementById('setup-nickname').value.trim();
    const birthday = document.getElementById('setup-birthday').value || null;
    saveProfile(id, { nickname, birthday });
    document.getElementById('setup-screen').style.display = 'none';

    // 開箱儀式感：只有「第一次真正建立 profile」才會觸發，之後（例如清快取重設）就不會再出現
    showWelcomeCeremony(nickname, () => {
        document.getElementById('main-calendar').style.display = 'flex';
        initApp(id, { nickname, birthday });
    });
}

function skipSetup() {
    const id = window.current_id; if (!id) return;
    saveProfile(id, { nickname: "", birthday: null });
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('main-calendar').style.display = 'flex';
    initApp(id, { nickname: "", birthday: null });
}

function showWelcomeCeremony(nickname, onDone) {
    const screen = document.getElementById('welcome-screen');
    const text = document.getElementById('welcome-text');
    text.innerText = nickname ? `${nickname}，你的專屬蠟燭已點亮` : "你的專屬蠟燭已點亮";
    screen.style.display = 'flex';
    // 動畫時長對應 CSS 的 fadeInOut (2.6s)，結束後才進入主畫面
    setTimeout(() => {
        screen.style.display = 'none';
        onDone();
    }, 2600);
}

function renderProfile(profile) {
    const tag = document.getElementById('nickname-tag');
    tag.innerText = profile && profile.nickname ? `${profile.nickname} 的專屬運勢` : "";

    const banner = document.getElementById('bday-banner');
    if (profile && profile.birthday) {
        const days = daysUntilBirthday(profile.birthday);
        if (days === 0) {
            banner.innerText = "🎂 今天就是你的重要日子！生日快樂";
            banner.style.display = 'block';
        } else if (days <= 7) {
            banner.innerText = `距離你的重要日子還有 ${days} 天`;
            banner.style.display = 'block';
        } else {
            banner.style.display = 'none';
        }
    } else {
        banner.style.display = 'none';
    }
}

function daysUntilBirthday(birthdayStr) {
    const b = new Date(birthdayStr);
    const now = new Date();
    let next = new Date(now.getFullYear(), b.getMonth(), b.getDate());
    next.setHours(0,0,0,0);
    const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (next < today0) next.setFullYear(next.getFullYear() + 1);
    return Math.round((next - today0) / 86400000);
}

async function initApp(id, profile) {
    renderProfile(profile);
    const today = getToday();
    const storageKey = `GF_LUCKY_DATA_${id}`;
    const saved = JSON.parse(localStorage.getItem(storageKey));
    let data;

    if (saved && saved.date === today) {
        data = saved;
    } else {
        const seed = hashId(id);
        const sr = () => {
            const x = Math.sin(seed + new Date().getDate()) * 10000;
            return x - Math.floor(x);
        };
        data = {
            date: today, id: id,
            theme: "今天，慢慢來也沒關係",
            yi: ["散步", "喝茶", "看書", "整理", "早睡"].sort(()=>.5-sr()).slice(0,2),
            ji: ["熬夜", "生氣", "焦慮", "滑手機", "亂買"].sort(()=>.5-sr()).slice(0,2),
            destiny: "命運在路上。",
            opp: tasks[Math.floor(sr() * tasks.length)],
            tornD: false, tornO: false
        };
        try {
            const r = await fetch('messages.json');
            if (r.ok) {
                const m = await r.json();
                if (m.themes && m.themes.length) data.theme = m.themes[Math.floor(sr() * m.themes.length)];
                if (m.destinies && m.destinies.length) data.destiny = m.destinies[Math.floor(sr() * m.destinies.length)];
            }
        } catch(e) {}
        localStorage.setItem(storageKey, JSON.stringify(data));
    }
    window.current_id = id;
    render(data);
    startCountdown();
    loadTodayWish(id, today);
}

function render(d) {
    const now = new Date();
    document.getElementById('m-tag').innerText = (now.getMonth()+1)+"月";
    document.getElementById('d-tag').innerText = now.getDate();
    document.getElementById('w-tag').innerText = "星期"+["日","一","二","三","四","五","六"][now.getDay()];
    document.getElementById('theme-text').innerText = d.theme;
    document.getElementById('yi-list').innerHTML = d.yi.map(i=>`<li>${i}</li>`).join('');
    document.getElementById('ji-list').innerHTML = d.ji.map(i=>`<li>${i}</li>`).join('');
    document.getElementById('text-destiny').innerText = d.destiny;
    document.getElementById('text-opportunity').innerText = d.opp;
    document.getElementById('edition-id').innerText = d.id;

    if(d.tornD) document.getElementById('card-destiny').classList.add('tear-active');
    if(d.tornO) document.getElementById('card-opportunity').classList.add('tear-active');
}

function tearPaper(type) {
    const id = window.current_id; if(!id) return;
    const storageKey = `GF_LUCKY_DATA_${id}`;
    const d = JSON.parse(localStorage.getItem(storageKey)); if(!d) return;

    if (window.navigator.vibrate) window.navigator.vibrate(50);

    if(type==='destiny' && !d.tornD) {
        document.getElementById('card-destiny').classList.add('tear-active');
        d.tornD = true;
    } else if(type==='opportunity' && !d.tornO) {
        document.getElementById('card-opportunity').classList.add('tear-active');
        d.tornO = true;
    }
    localStorage.setItem(storageKey, JSON.stringify(d));
}

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

function startCountdown() {
    function update() {
        const diff = new Date().setHours(23,59,59,999) - new Date();
        if(diff < 0) return;
        const h = Math.floor(diff/3600000).toString().padStart(2,'0');
        const m = Math.floor((diff%3600000)/60000).toString().padStart(2,'0');
        const s = Math.floor((diff%60000)/1000).toString().padStart(2,'0');
        document.getElementById('timer').innerText = `${h}:${m}:${s}`;
    }
    update(); setInterval(update, 1000);
}

// ===== 願望功能：每天可以許一個新的，存進 localStorage =====
function wishKey(id, today) { return `GF_WISH_${id}_${today}`; }

function loadTodayWish(id, today) {
    const saved = localStorage.getItem(wishKey(id, today));
    if (saved) {
        renderWishSaved(saved);
    }
}

function setWish() {
    const id = window.current_id; if (!id) return;
    const v = document.getElementById('wish-input').value.trim(); if(!v) return;
    localStorage.setItem(wishKey(id, getToday()), v);
    renderWishSaved(v);
}

function renderWishSaved(v) {
    document.getElementById('wish-container').innerHTML =
        `<div style="border:2px solid var(--red);padding:8px;color:var(--red);font-weight:900;text-align:center;background:rgba(255,255,255,0.7);font-family:'Zhi Mang Xing',cursive;">今日願望已封存：${v}</div>`;
}

// ===== 吹蠟燭互動（選用）：點擊吹熄 或 開麥克風真的吹，兩者觸發同一個結果 =====
let micStream = null;
let micActive = false;

function blowCandle(mode) {
    document.getElementById('candle-visual').innerText = '🕯️💨';
    document.getElementById('candle-result').innerText = '願望已被聽見';
    if (window.navigator.vibrate) window.navigator.vibrate([30,40,30]);
    setTimeout(() => {
        document.getElementById('candle-visual').innerHTML = '🕯️ <span id="candle-label">點一下吹熄蠟燭</span>';
    }, 2200);
}

async function toggleMicBlow() {
    const btn = document.getElementById('candle-mic-toggle');
    if (micActive) {
        stopMicBlow();
        return;
    }
    try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micActive = true;
        btn.classList.add('active');
        btn.innerText = '🎙️ 監聽中...對著手機吹一口氣';
        listenForBlow(micStream);
    } catch (e) {
        document.getElementById('candle-result').innerText = '沒有取得麥克風權限，改用點擊吹熄也可以喔';
    }
}

function stopMicBlow() {
    if (micStream) micStream.getTracks().forEach(t => t.stop());
    micStream = null; micActive = false;
    const btn = document.getElementById('candle-mic-toggle');
    btn.classList.remove('active');
    btn.innerText = '🎙️ 開麥克風真的吹';
}

function listenForBlow(stream) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    function check() {
        if (!micActive) { ctx.close(); return; }
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a,b)=>a+b,0) / data.length;
        if (avg > 55) { // 吹氣音量閾值，環境安靜時較容易觸發
            blowCandle('mic');
            stopMicBlow();
            ctx.close();
            return;
        }
        requestAnimationFrame(check);
    }
    check();
}

// ===== 分享圖卡：用 Canvas 另外畫一張乾淨版面，不直接截圖現有畫面 =====
function shareCard() {
    const id = window.current_id; if (!id) return;
    const storageKey = `GF_LUCKY_DATA_${id}`;
    const d = JSON.parse(localStorage.getItem(storageKey)); if (!d) return;
    const profile = getProfile(id) || {};

    const canvas = document.getElementById('share-canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // 背景
    ctx.fillStyle = '#D42A1D';
    ctx.fillRect(0, 0, W, H);
    // 卡片
    ctx.fillStyle = '#F2EEE3';
    ctx.fillRect(40, 60, W-80, H-180);
    ctx.strokeStyle = '#181818';
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 60, W-80, H-180);

    const now = new Date();
    const dateStr = `${now.getMonth()+1}月${now.getDate()}日 星期${["日","一","二","三","四","五","六"][now.getDay()]}`;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#181818';
    ctx.font = '32px sans-serif';
    ctx.fillText(dateStr, W/2, 150);

    if (profile.nickname) {
        ctx.fillStyle = '#1C4EA0';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText(`${profile.nickname} 的今日運勢`, W/2, 200);
    }

    ctx.fillStyle = '#D42A1D';
    ctx.font = 'bold 40px sans-serif';
    wrapText(ctx, d.theme, W/2, 320, W-160, 50);

    ctx.fillStyle = '#181818';
    ctx.font = '26px sans-serif';
    wrapText(ctx, d.destiny, W/2, 480, W-160, 38);

    ctx.fillStyle = '#181818';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`GOODFUN TEAM // EDITION #${d.id}`, W/2, H-100);

    canvas.toBlob(async (blob) => {
        const file = new File([blob], 'lucky-candle.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ files: [file], title: 'Lucky Candle 今日運勢' });
                return;
            } catch(e) { /* 使用者取消分享，不用特別處理 */ }
        }
        // 不支援 Web Share API 的裝置：開新分頁，讓使用者長按存圖
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const chars = text.split('');
    let line = '', lines = [];
    for (const c of chars) {
        const test = line + c;
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = c;
        } else {
            line = test;
        }
    }
    if (line) lines.push(line);
    const startY = y - (lines.length - 1) * lineHeight / 2;
    lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}
