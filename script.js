// 1. 定義稀有度機率與視覺樣式
const raritySettings = [
    { rank: "SSSR", weight: 1,  class: "rank-sssr" }, // 1% 神級
    { rank: "SSR",  weight: 4,  class: "rank-ssr"  }, // 4% 極致
    { rank: "SP",   weight: 5,  class: "rank-sp"   }, // 5% 彩蛋/故障藝術
    { rank: "SR",   weight: 15, class: "rank-sr"   }, // 15% 優質
    { rank: "R",    weight: 45, class: "rank-r"    }, // 45% 平穩
    { rank: "N",    weight: 30, class: "rank-n"    }  // 30% 重整
];

const categories = ["戀愛 Love", "金錢 Wealth", "工作 Career", "旅行 Travel", "健康 Health", "整體 Overall"];

// 2. 抽籤主函數
async function startLuckyDraw() {
    try {
        // 讀取你的 messages.json
        const response = await fetch('messages.json');
        const poems = await response.json();
        
        // A. 隨機抽取 6 個運勢等級
        const scoreResults = categories.map(cat => {
            const rand = Math.random() * 100;
            let sum = 0;
            let finalRank = raritySettings[raritySettings.length - 1];

            for (const r of raritySettings) {
                sum += r.weight;
                if (rand <= sum) {
                    finalRank = r;
                    break;
                }
            }
            return { cat, ...finalRank };
        });

        // B. 從 JSON 隨機抽出一條核心籤詩
        const randomPoem = poems[Math.floor(Math.random() * poems.length)];
        const poemText = typeof randomPoem === 'string' ? randomPoem : (randomPoem.text || randomPoem.content);

        // C. 將結果渲染到網頁上
        displayResults(scoreResults, poemText);
        
    } catch (error) {
        console.error("讀取籤詩失敗:", error);
    }
}
