const KEY_PREFIX = "GF_";
const rankMap = { SSSR: "極其幸運", SSR: "好事發生", SR: "頗為順利", R: "平淡是福", N: "日常依舊", SP: "因果未知" };
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
    document.getElementById('main-calendar').style.display = 'flex';
    initApp(id, { nickname, birthday });
}

function skipSetup() {
    const id = window.current_id; if (!id) return;
    saveProfile(id, { nickname: "", birthday: null });
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('main-calendar').style.display = 'flex';
    initApp(id, { nickname: "", birthday: null });
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
            rank: Object.keys(rankMap)[Math.floor(sr() * 6)],
            yi: ["散步", "喝茶", "看書", "整理", "早睡"].sort(()=>.5-sr()).slice(0,2),
            ji: ["熬夜", "生氣", "焦慮", "滑手機", "亂買"].sort(()=>.5-sr()).slice(0,2),
            destiny: "命運在路上。",
            opp: tasks[Math.floor(sr() * tasks.length)],
            tornD: false, tornO: false
        };
        try {
            const r = await fetch('messages.json');
            if(r.ok) {
                const m = await r.json();
                data.destiny = m[Math.floor(sr() * m.length)];
            }
        } catch(e) {}
        localStorage.setItem(storageKey, JSON.stringify(data));
    }
    window.current_id = id;
    render(data);
    startCountdown();
}

function render(d) {
    const now = new Date();
    document.getElementById('m-tag').innerText = (now.getMonth()+1)+"月";
    document.getElementById('d-tag').innerText = now.getDate();
    document.getElementById('w-tag').innerText = "星期"+["日","一","二","三","四","五","六"][now.getDay()];
    document.getElementById('rank-val').innerText = rankMap[d.rank];
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

function setWish() {
    const v = document.getElementById('wish-input').value.trim(); if(!v) return;
    document.getElementById('wish-container').innerHTML = `<div style="border:2px solid var(--red);padding:8px;color:var(--red);font-weight:900;text-align:center;background:rgba(255,255,255,0.7);">願望已封存：${v}</div>`;
}
