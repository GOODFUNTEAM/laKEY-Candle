const KEY_PREFIX = "GF_";
const rankMap = { SSSR: "極其幸運", SSR: "好事發生", SR: "頗為順利", R: "平淡是福", N: "日常依舊", SP: "因果未知" };

// 🆕 機會任務庫 (限量 100 版專屬)
const opportunity_tasks = [
    "跟一個你愛的人說你愛他。",
    "畫下手邊的一個物品，無論畫得怎樣。",
    "閉上眼睛深呼吸三次。",
    "整理書桌上離你最近的一個雜物。",
    "聽一首你最喜歡的歌。",
    "傳個貼圖給久未聯絡的朋友。",
    "對鏡子裡的自己微笑。",
    "在心中感謝一件今天發生的好事。",
    "多喝一杯水。",
    "站起來伸個懶腰，維持 10 秒。"
];

function getToday() { return new Date().toDateString(); }

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('key');

    if (key && key.startsWith(KEY_PREFIX)) {
        const id = key.replace(KEY_PREFIX, "");
        localStorage.setItem('lucky_candle_id', id);
        window.history.replaceState({}, document.title, window.location.pathname);
        initApp(id);
    } else {
        const savedID = localStorage.getItem('lucky_candle_id');
        if (savedID) {
            initApp(savedID);
        } else {
            document.getElementById('lock-screen').style.display = 'flex';
            document.getElementById('main-calendar').style.display = 'none';
        }
    }
};

async function initApp(productID) {
    const today = getToday();
    const storageKey = `daily_data_${productID}`;
    const saved = JSON.parse(localStorage.getItem(storageKey));
    let data = (saved && saved.date === today) ? saved : null;

    if (!data) {
        // 使用限量編號作為隨機種子的一部分，讓每個編號的運勢軌跡不同
        const seedNum = parseInt(productID) || 0;
        const seededRandom = () => {
            const x = Math.sin(seedNum + Math.random()) * 10000;
            return x - Math.floor(x);
        };

        data = {
            date: today,
            id: productID,
            rank: Object.keys(rankMap)[Math.floor(seededRandom() * 6)],
            yi: ["散步", "喝茶", "看書", "整理", "早睡", "攝影", "冥想", "聽歌"].sort(()=>.5-seededRandom()).slice(0,2),
            ji: ["熬夜", "生氣", "焦慮", "滑手機", "亂買", "悲觀", "遲到", "猶豫"].sort(()=>.5-seededRandom()).slice(0,2),
            destiny: "...", // 命運金句
            opportunity: "", // 🆕 機會任務
            isTorn: false     // 🆕 紀錄今天是否撕紙
        };
        
        try {
            const res = await fetch('messages.json');
            const msgs = await res.json();
            data.destiny = msgs[Math.floor(seededRandom() * msgs.length)];
        } catch(e) { 
            data.destiny = "保持好奇，是生活的解藥。"; 
        }

        // 🆕 抽今日任務
        data.opportunity = opportunity_tasks[Math.floor(seededRandom() * opportunity_tasks.length)];

        localStorage.setItem(storageKey, JSON.stringify(data));
    }
    render(data);
    updateWeather();
    startCountdown();
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
    
    // 🆕 填入命運與機會文字
    document.getElementById('text-destiny').innerText = data.destiny;
    document.getElementById('text-opportunity').innerText = data.opportunity;

    // 🆕 如果今天已經撕過紙，直接顯示，不顯示動態
    if (data.isTorn) {
        document.getElementById('card-destiny').classList.add('tear-active');
        document.getElementById('card-opportunity').classList.add('tear-active');
    }

    const footer = document.querySelector('.footer');
    footer.innerText = `GOODFUN TEAM // LUCKY CANDLE EDITION #${data.id}`;
}

// 🆕 撕紙動態控制
function tearPaper(type) {
    // 取得當前的限量 ID
    const productID = localStorage.getItem('lucky_candle_id');
    const storageKey = `daily_data_${productID}`;
    const data = JSON.parse(localStorage.getItem(storageKey));

    if (!data || data.isTorn) return; // 如果沒資料或撕過了，就不動作

    // 啟動 CSS 動態 (同時撕開命運與機會)
    document.getElementById('card-destiny').classList.add('tear-active');
    document.getElementById('card-opportunity').classList.add('tear-active');

    // 更新 LocalStorage 狀態，記住今天已經撕過
    data.isTorn = true;
    localStorage.setItem(storageKey, JSON.stringify(data));
}

// ... 剩餘的 startCountdown, updateWeather, setWish 函式保持不變 (參考 V9.2) ...