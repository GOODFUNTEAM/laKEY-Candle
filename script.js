const KEY_PREFIX = "GF_";
const FALLBACK_TASKS = ["跟愛的人說愛他", "深呼吸三次", "整理書桌雜物"];
const FALLBACK_YI = ["散步", "喝茶", "看書", "整理", "早睡"];
const FALLBACK_JI = ["熬夜", "生氣", "焦慮", "滑手機", "亂買"];

// ===== 干支日 + 十二建除：宜忌不再是純隨機，而是依當天的曆法值決定 =====
const TIAN_GAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const DI_ZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const JIAN_CHU = ["建","除","滿","平","定","執","破","危","成","收","開","閉"];

const MONTH_BRANCH_CUTOFFS = [
    { m: 1, d: 5, zhi: 1 }, { m: 2, d: 4, zhi: 2 }, { m: 3, d: 5, zhi: 3 },
    { m: 4, d: 5, zhi: 4 }, { m: 5, d: 5, zhi: 5 }, { m: 6, d: 5, zhi: 6 },
    { m: 7, d: 7, zhi: 7 }, { m: 8, d: 7, zhi: 8 }, { m: 9, d: 7, zhi: 9 },
    { m: 10, d: 8, zhi: 10 }, { m: 11, d: 7, zhi: 11 }, { m: 12, d: 7, zhi: 0 },
];

function getDayGanZhi(date) {
    const epoch = new Date(Date.UTC(1900, 0, 31));
    const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const diffDays = Math.round((target - epoch) / 86400000);
    const idx = ((diffDays + 40) % 60 + 60) % 60;
    return { gan: TIAN_GAN[idx % 10], zhi: DI_ZHI[idx % 12], zhiIndex: idx % 12, cycleIndex: idx };
}
function getMonthBranchIndex(date) {
    const val = (date.getMonth() + 1) * 100 + date.getDate();
    let result = 0;
    for (const c of MONTH_BRANCH_CUTOFFS) { if (val >= c.m * 100 + c.d) result = c.zhi; }
    return result;
}
function getJianChu(date) {
    const monthZhiIdx = getMonthBranchIndex(date);
    const { zhiIndex } = getDayGanZhi(date);
    const offset = ((zhiIndex - monthZhiIdx) % 12 + 12) % 12;
    return JIAN_CHU[offset];
}

const JIANCHU_YI_POOL = {
    "建": ["寫日記","早睡","曬太陽","整理房間","寫感謝小卡","澆花"],
    "除": ["整理","收拾書桌","泡澡","深呼吸","整理相簿"],
    "滿": ["煮一頓飯","擁抱家人","喝一杯熱可可","微笑","打電話給朋友"],
    "平": ["散步","喝水","伸展","慢跑","騎腳踏車"],
    "定": ["寫日記","整理相簿","寫封信","冥想"],
    "執": ["整理房間","收拾書桌","澆花","遛狗"],
    "破": ["深呼吸","冥想","泡澡"],
    "危": ["深呼吸","微笑","喝水"],
    "成": ["擁抱家人","寫感謝小卡","微笑","喝一杯熱可可","打電話給朋友"],
    "收": ["整理相簿","收拾書桌","寫感謝小卡","澆花"],
    "開": ["散步","曬太陽","騎腳踏車","慢跑","聽音樂"],
    "閉": ["早睡","泡澡","冥想","看星星","喝茶"]
};
const JIANCHU_JI_POOL = {
    "建": ["拖延","熬夜","自責","壓抑情緒"],
    "除": ["亂買","暴飲暴食","久坐不動","忽略身體的訊號"],
    "滿": ["比較","自責","亂發脾氣"],
    "平": ["久坐不動","拖延","硬撐不休息"],
    "定": ["衝動發言","拿別人的標準要求自己","翻舊帳"],
    "執": ["硬撐不休息","忽略身體的訊號","暴躁回覆訊息"],
    "破": ["熬夜","生氣","焦慮","滑手機","亂買","衝動發言","暴躁回覆訊息"],
    "危": ["焦慮","冷戰","壓抑情緒","忽略身體的訊號"],
    "成": ["自責","跟自己過不去","過度自我懷疑"],
    "收": ["亂買","暴飲暴食","無止盡滑短影音"],
    "開": ["拖延","壓抑情緒","把小事放大成大事"],
    "閉": ["熬夜","報復性熬夜","暴躁回覆訊息","無止盡滑短影音"]
};

function pickYiJiByCalendar(date, fullYiList, fullJiList, sr) {
    const jc = getJianChu(date);
    const yiCandidates = (JIANCHU_YI_POOL[jc] || FALLBACK_YI).filter(x => !fullYiList || fullYiList.includes(x));
    const jiCandidates = (JIANCHU_JI_POOL[jc] || FALLBACK_JI).filter(x => !fullJiList || fullJiList.includes(x));
    const yiPool = yiCandidates.length ? yiCandidates : (fullYiList && fullYiList.length ? fullYiList : FALLBACK_YI);
    const jiPool = jiCandidates.length ? jiCandidates : (fullJiList && fullJiList.length ? fullJiList : FALLBACK_JI);
    const yi = [...yiPool].sort(()=>.5-sr()).slice(0, Math.min(2, yiPool.length));
    const ji = [...jiPool].sort(()=>.5-sr()).slice(0, Math.min(2, jiPool.length));
    return { yi, ji, jianChu: jc };
}

function getToday() { return new Date().toDateString(); }

function hashId(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0; }
    return h;
}

function profileKey(id) { return `GF_PROFILE_${id}`; }
function getProfile(id) { try { return JSON.parse(localStorage.getItem(profileKey(id))); } catch(e) { return null; } }
function saveProfile(id, profile) { localStorage.setItem(profileKey(id), JSON.stringify(profile)); }

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');

    if (key && key.startsWith(KEY_PREFIX)) {
        const id = key.replace(KEY_PREFIX, "");
        window.current_id = id;
        const profile = getProfile(id);
        document.getElementById('lock-screen').style.display = 'none';

        if (!profile) {
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
            e => fetchWeatherData(25.03, 121.56, null, "台北地區")
        );
    }
};

function completeSetup() {
    const id = window.current_id; if (!id) return;
    const nickname = document.getElementById('setup-nickname').value.trim();
    const birthday = document.getElementById('setup-birthday').value || null;
    saveProfile(id, { nickname, birthday });
    document.getElementById('setup-screen').style.display = 'none';
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
    setTimeout(() => { screen.style.display = 'none'; onDone(); }, 2600);
}

function renderProfile(profile) {
    const nickTag = document.getElementById('tag-nickname');
    if (profile && profile.nickname) {
        nickTag.innerText = `${profile.nickname} 的專屬運勢`;
        nickTag.style.display = 'block';
    } else {
        nickTag.style.display = 'none';
    }

    const bdayTag = document.getElementById('tag-bday');
    if (profile && profile.birthday) {
        const days = daysUntilBirthday(profile.birthday);
        if (days === 0) {
            bdayTag.innerText = "🎂 今天生日快樂";
            bdayTag.style.display = 'block';
        } else if (days <= 7) {
            bdayTag.innerText = `生日倒數 ${days} 天`;
            bdayTag.style.display = 'block';
        } else {
            bdayTag.style.display = 'none';
        }
    } else {
        bdayTag.style.display = 'none';
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
            omikuji: "吉", omikujiNumber: null, omikujiDetail: null,
            yi: FALLBACK_YI.slice(0,2), ji: FALLBACK_JI.slice(0,2),
            destiny: "命運在路上。", opp: FALLBACK_TASKS[0],
            chosen: null, candleBlown: false
        };
        try {
            const r = await fetch('messages.json');
            if (r.ok) {
                const m = await r.json();
                if (m.destinies && m.destinies.length) data.destiny = m.destinies[Math.floor(sr() * m.destinies.length)];
                if (m.tasks && m.tasks.length) data.opp = m.tasks[Math.floor(sr() * m.tasks.length)];
                const picked = pickYiJiByCalendar(new Date(), m.yi, m.ji, sr);
                data.yi = picked.yi; data.ji = picked.ji; data.jianChu = picked.jianChu;
            }
        } catch(e) {}
        try {
            const or = await fetch('omikuji100.json');
            if (or.ok) {
                const slips = await or.json();
                if (slips && slips.length) {
                    const slip = slips[Math.floor(sr() * slips.length)];
                    data.omikuji = slip.tier; data.omikujiNumber = slip.number;
                    data.omikujiDetail = { poem: slip.poem, explain: slip.explain, fortunes: slip.fortunes };
                }
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
    document.getElementById('giant-date').innerText = now.getDate();
    document.getElementById('tag-month').innerText = (now.getMonth()+1) + "月";
    document.getElementById('tag-week').innerText = "星期" + ["日","一","二","三","四","五","六"][now.getDay()];
    document.getElementById('tag-yiji').innerText = `宜 ${d.yi.join('、')} ｜ 忌 ${d.ji.join('、')}`;
    document.getElementById('edition-id').innerText = d.id;

    document.getElementById('theme-text').innerText = d.omikujiNumber ? `第${d.omikujiNumber}番 ・ ${d.omikuji}` : `籤 ・ ${d.omikuji}`;
    document.getElementById('theme-banner').classList.toggle('is-bad', d.omikuji === '凶' || d.omikuji === '大凶');
    renderOmikujiDetail(d.omikujiDetail);

    document.getElementById('text-destiny').innerText = d.destiny;
    document.getElementById('text-opportunity').innerText = d.opp;
    applyFateState(d.chosen);

    if (d.candleBlown) {
        document.getElementById('candle-stage').style.display = 'none';
        document.getElementById('omikuji-result').style.display = 'block';
    }
}

function renderOmikujiDetail(detail) {
    const poemEl = document.getElementById('om-poem');
    const explainEl = document.getElementById('om-explain');
    const fortunesEl = document.getElementById('om-fortunes');
    if (!detail) {
        poemEl.innerText = '';
        explainEl.innerText = '籤詩內容載入失敗，明天再抽一次看看。';
        fortunesEl.innerHTML = '';
        return;
    }
    poemEl.innerHTML = detail.poem.map(l => `<div>${l}</div>`).join('');
    explainEl.innerText = `【解說】${detail.explain}`;
    fortunesEl.innerHTML = Object.entries(detail.fortunes).map(([k,v]) => `<div><b>${k}</b>：${v}</div>`).join('');
}

function toggleOmikujiDetail() {
    document.getElementById('omikuji-detail').classList.toggle('open');
}

// ===== 命運／機會：自選一張撕開，另一張當天鎖住；撕開後的結果佔滿整欄 =====
function applyFateState(chosen) {
    const wrap = document.getElementById('destiny-wrap');
    wrap.classList.remove('chosen-destiny', 'chosen-opportunity');
    document.getElementById('card-destiny').classList.remove('torn', 'locked');
    document.getElementById('card-opportunity').classList.remove('torn', 'locked');
    if (chosen === 'destiny') {
        wrap.classList.add('chosen-destiny');
        document.getElementById('card-destiny').classList.add('torn');
    } else if (chosen === 'opportunity') {
        wrap.classList.add('chosen-opportunity');
        document.getElementById('card-opportunity').classList.add('torn');
    }
}

function chooseFate(type) {
    const id = window.current_id; if (!id) return;
    const storageKey = `GF_LUCKY_DATA_${id}`;
    const d = JSON.parse(localStorage.getItem(storageKey)); if (!d) return;
    if (d.chosen) return; // 今天已經選過了，不能反悔
    d.chosen = type;
    localStorage.setItem(storageKey, JSON.stringify(d));
    if (window.navigator.vibrate) window.navigator.vibrate(50);
    applyFateState(type);
}

// ===== 地理定位：台灣顯示368區精細地圖，海外顯示世界地圖，文字一律顯示完整地名 =====
window.locationState = null; // { isTaiwan, name, x, y, mapSrc }

async function fetchWeatherData(lat, lon, fallback = null, fallbackName = null) {
    try {
        let placeName = fallbackName || "定位中";
        let countryCode = 'tw';
        if (!fallbackName) {
            const g = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`);
            const gd = await g.json();
            placeName = gd.address.suburb || gd.address.town || gd.address.city || gd.address.county || "目前位置";
            countryCode = (gd.address.country_code || 'tw').toUpperCase();
            await resolveMapLocation(countryCode, placeName, gd.address);
        } else {
            await resolveMapLocation('TW', placeName, {});
        }
        document.getElementById('map-loc-text').innerText = placeName;

        const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`);
        const wd = await w.json();
        const temp = Math.round(wd.current_weather.temperature);
        const sky = {0:"晴朗",1:"多雲",2:"陰天",3:"陰天",61:"雨天"}[wd.current_weather.weathercode] || "多雲";
        const rain = (wd.daily.precipitation_probability_max[0] || 0);
        document.getElementById('tag-weather').innerText = `${temp}°C ・ ${sky} ・ 降雨${rain}%`;
    } catch(e) {
        document.getElementById('map-loc-text').innerText = "連線中";
    }
}

async function resolveMapLocation(countryCodeUpper, placeName, address) {
    if (countryCodeUpper === 'TW') {
        try {
            const coordsRes = await fetch('taiwan-town-coords.json');
            const coords = await coordsRes.json();
            const county = address.county || address.city || "";
            let key = Object.keys(coords).find(k => k.includes(placeName) && (!county || k.includes(county)));
            if (!key) key = Object.keys(coords).find(k => k.includes(placeName));
            const entry = key ? coords[key] : null;
            window.locationState = { isTaiwan: true, name: placeName, x: entry ? entry.x : 240, y: entry ? entry.y : 400, mapSrc: 'taiwan-map.svg' };
        } catch(e) {
            window.locationState = { isTaiwan: true, name: placeName, x: 240, y: 400, mapSrc: 'taiwan-map.svg' };
        }
    } else {
        try {
            const [codeMapRes, worldCoordsRes] = await Promise.all([fetch('countrycode-map.json'), fetch('world-country-coords.json')]);
            const codeMap = await codeMapRes.json();
            const worldCoords = await worldCoordsRes.json();
            const countryName = codeMap[countryCodeUpper];
            const entry = countryName ? worldCoords[countryName] : null;
            window.locationState = { isTaiwan: false, name: placeName, x: entry ? entry.x : 300, y: entry ? entry.y : 170, mapSrc: 'world-map.svg' };
        } catch(e) {
            window.locationState = { isTaiwan: false, name: placeName, x: 300, y: 170, mapSrc: 'world-map.svg' };
        }
    }
    renderMapThumb();
}

function renderMapThumb() {
    const ls = window.locationState; if (!ls) return;
    const wrap = document.getElementById('map-thumb-wrap');
    const pin = document.getElementById('map-thumb-pin');
    // 縮圖用等比例定位（依 SVG viewBox 換算成百分比），視覺上是縮小版
    const vb = ls.isTaiwan ? { w: 600, h: 900 } : { w: 600, h: 340 };
    pin.style.left = (ls.x / vb.w * 100) + '%';
    pin.style.top = (ls.y / vb.h * 100) + '%';
    wrap.style.background = '#EDEBE3';
}

async function openMapModal() {
    const ls = window.locationState; if (!ls) return;
    const modal = document.getElementById('map-modal');
    const svgWrap = document.getElementById('map-modal-svg-wrap');
    document.getElementById('map-modal-title').innerText = `你在這裡・${ls.name}`;
    try {
        const res = await fetch(ls.mapSrc);
        let svgText = await res.text();
        const pinSvg = `<circle class="user-pin" cx="${ls.x}" cy="${ls.y}" r="6"/><circle class="user-pin" cx="${ls.x}" cy="${ls.y}" r="12" fill="none" stroke="#E8622C" stroke-width="2" opacity="0.6"/>`;
        svgText = svgText.replace('</svg>', pinSvg + '</svg>');
        svgWrap.innerHTML = svgText;
    } catch(e) {
        svgWrap.innerHTML = '<div style="text-align:center;padding:20px;">地圖載入失敗</div>';
    }
    modal.classList.add('open');
}

function closeMapModal(e) {
    if (e && e.target.id !== 'map-modal' && e.target.id !== 'map-modal-close') return;
    document.getElementById('map-modal').classList.remove('open');
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
    if (saved) renderWishSaved(saved);
}
function setWish() {
    const id = window.current_id; if (!id) return;
    const v = document.getElementById('wish-input').value.trim(); if(!v) return;
    localStorage.setItem(wishKey(id, getToday()), v);
    renderWishSaved(v);
}
function renderWishSaved(v) {
    document.getElementById('wish-container').innerHTML =
        `<div style="border:2px solid var(--blue);padding:8px;color:var(--blue);font-weight:900;text-align:center;background:rgba(255,255,255,0.7);font-family:'Zhi Mang Xing',cursive;">今日願望已封存：${v}</div>`;
}

// ===== 蠟燭 + 抽籤合併儀式：先吹蠟燭，才看到今日抽籤結果 =====
let micStream = null;
let micActive = false;

function blowCandle(mode) {
    if (window.navigator.vibrate) window.navigator.vibrate([30,40,30]);
    document.getElementById('candle-stage').style.display = 'none';
    document.getElementById('omikuji-result').style.display = 'block';

    const id = window.current_id;
    if (id) {
        const storageKey = `GF_LUCKY_DATA_${id}`;
        const d = JSON.parse(localStorage.getItem(storageKey));
        if (d) { d.candleBlown = true; localStorage.setItem(storageKey, JSON.stringify(d)); }
    }
}

async function toggleMicBlow() {
    const btn = document.getElementById('candle-mic-toggle');
    if (micActive) { stopMicBlow(); return; }
    try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micActive = true;
        btn.classList.add('active');
        btn.innerText = '🎙️ 監聽中...對著手機吹一口氣';
        listenForBlow(micStream);
    } catch (e) {
        alert('沒有取得麥克風權限，改用點擊吹熄也可以喔');
    }
}
function stopMicBlow() {
    if (micStream) micStream.getTracks().forEach(t => t.stop());
    micStream = null; micActive = false;
    const btn = document.getElementById('candle-mic-toggle');
    if (btn) { btn.classList.remove('active'); btn.innerText = '🎙️ 開麥克風真的吹'; }
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
        if (avg > 55) { blowCandle('mic'); stopMicBlow(); ctx.close(); return; }
        requestAnimationFrame(check);
    }
    check();
}

// ===== 分享圖卡 =====
function shareCard() {
    const id = window.current_id; if (!id) return;
    const storageKey = `GF_LUCKY_DATA_${id}`;
    const d = JSON.parse(localStorage.getItem(storageKey)); if (!d) return;
    const profile = getProfile(id) || {};

    const canvas = document.getElementById('share-canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    ctx.fillStyle = '#EDEBE3'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#FAF8F2'; ctx.fillRect(30, 50, W-60, H-160);
    ctx.strokeStyle = '#1A1A1A'; ctx.lineWidth = 6; ctx.strokeRect(30, 50, W-60, H-160);

    const now = new Date();
    const dateStr = `${now.getMonth()+1}月${now.getDate()}日 星期${["日","一","二","三","四","五","六"][now.getDay()]}`;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#1A1A1A'; ctx.font = '30px sans-serif';
    ctx.fillText(dateStr, W/2, 140);

    if (profile.nickname) {
        ctx.fillStyle = '#E8622C'; ctx.font = 'bold 24px sans-serif';
        ctx.fillText(`${profile.nickname} 的今日運勢`, W/2, 185);
    }

    ctx.fillStyle = '#1C5FD4'; ctx.font = 'bold 46px sans-serif';
    ctx.fillText(d.omikujiNumber ? `第${d.omikujiNumber}番 ・ ${d.omikuji}` : d.omikuji, W/2, 270);

    ctx.fillStyle = '#1A1A1A'; ctx.font = '24px sans-serif';
    wrapText(ctx, d.destiny, W/2, 420, W-160, 36);

    ctx.fillStyle = '#1A1A1A'; ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`GOODFUN TEAM // EDITION #${d.id}`, W/2, H-100);

    canvas.toBlob(async (blob) => {
        const file = new File([blob], 'lucky-candle.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try { await navigator.share({ files: [file], title: 'Lucky Candle 今日運勢' }); return; } catch(e) {}
        }
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    });
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const chars = text.split('');
    let line = '', lines = [];
    for (const c of chars) {
        const test = line + c;
        if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = c; }
        else { line = test; }
    }
    if (line) lines.push(line);
    const startY = y - (lines.length - 1) * lineHeight / 2;
    lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}
