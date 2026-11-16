# 印尼盾快算

適合 iPhone 旅行使用的純前端 PWA：IDR 同時換算 USD／TWD／MYR，不需帳號、API key、後端、npm build 或付費服務。

正式網址：https://rupiah-pocket.pages.dev

## 使用

- 預設單位為千印尼盾：`50` → Rp50,000；`175.5` → Rp175,500。
- 明確單位不再乘千：`150K`、`十五萬` → Rp150,000。
- 開啟即可使用 App 數字鍵盤，支援小數點、退格、清除；右上鍵盤按鈕可切換手機鍵盤，按「完成」回復。
- Safari 必須由使用者點擊才能開啟系統鍵盤；程式不使用 autofocus。
- 有網路時取得最新可用每日參考匯率；開啟、回到前景、恢復連線時依新鮮度更新，正常情況一小時內不重複請求，並尊重來源下次更新時間。
- 匯率保存在 localStorage。首次成功載入並完成離線快取後，離線重開仍可換算。狀態列顯示來源日期、離線／已存資料、超過 48 小時的舊資料。每日參考值不含銀行或換匯手續費。

Safari 開啟正式網址 → 分享 → 加入主畫面 → 加入。請從新網址新增；舊 Lovable 圖示仍指向舊主機。

## Cloudflare Pages 部署

使用 **GitHub 免費私有儲存庫** 保存程式碼，由 **Cloudflare Pages Git integration** 自動部署公開靜態網站。保持儲存庫私有，無需 GitHub Pages、付費方案或自訂網域。

Cloudflare Workers & Pages → Create → Pages → Connect to Git，透過官方 GitHub 授權只選取此儲存庫。

- Production branch：`main`
- Framework preset：`None`
- Build command：`exit 0`（無編譯步驟）
- Build output directory：`.`（儲存庫根目錄）
- Root directory：保留預設

首次 Save and Deploy 後使用 Cloudflare 回傳的 `https://<project>.pages.dev` 正式網址；之後推送 `main` 會自動部署。程式檔是公開網頁資源，儲存庫私有不會隱藏瀏覽器收到的 HTML／CSS／JS。沒有後端、分析追蹤或付費 API。

官方設定參考：[Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)、[Static HTML](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/)。

## 離線與更新

`sw.js` 以版本快取整組 App shell。導航與模組均讀取同一安裝版本，避免新 HTML 混用舊 JS。修改任何快取資源時，必須同步更新 `VERSION`。安裝完成後立即啟用新版；已開啟的頁面在 controller 切換時重新載入，保留當下輸入金額。重新開啟與回到前景也會檢查更新。`_headers` 讓 service worker 每次重新驗證，不會被長效 HTTP 快取卡住。

## 本機驗證

```sh
node test-amount.mjs
node --check app.js
node --check amount.js
node --check sw.js
python3 -m http.server 4173
```

開啟 http://localhost:4173 。測試結果及實機限制另見 `VERIFICATION.md`。閱讀區與下半部鍵盤分開定位，CSS 支援 safe-area、svh／dvh；原生鍵盤模式使用 visualViewport 的可視高度。

## 匯率來源

主來源：[ExchangeRate-API Open Access](https://open.er-api.com/v6/latest/USD)，畫面保留要求的 [Rates By Exchange Rate API](https://www.exchangerate-api.com) attribution。

每 1 IDR：USD = 1 / rates.IDR；TWD = rates.TWD / rates.IDR；MYR = rates.MYR / rates.IDR。

備援：[fawazahmed0 currency-api](https://github.com/fawazahmed0/exchange-api)，資料端點 https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/idr.json 。主來源失敗或資料無效時使用備援；兩者均失敗時保留最後成功資料，初次使用則顯示內建參考值及舊資料狀態。
