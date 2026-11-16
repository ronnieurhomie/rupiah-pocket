# 驗證紀錄

日期：2026-11-16。版本：`rupiah-pocket-v2-20261116`。

## 已通過

- `node test-amount.mjs`：15 項金額解析／按鍵檢查。
- `node --check app.js`、`amount.js`、`sw.js`：語法正確。
- Chromium 與本機 macOS Safari：精確 iframe CSS viewport `390×844`、`393×852`、`320×568`；不需垂直捲動，三種結果同時可見，閱讀區與下半部鍵盤分開。
- 以上尺寸另外注入頂部 59px／底部 34px 安全區進行壓力測試，按鍵仍在可用區內。CSS 按鍵最小高度 44px；Chromium 頁面縮放量測有小於 0.01px 的浮點誤差。
- App 按鍵：175.5 → Rp175,500，小數點去重、退格、清除；150K／十五萬 → Rp150,000。
- 手機鍵盤切換會隱藏 App 鍵盤，完成後恢復唯讀輸入與 App 鍵盤。模擬 `320×280` 可視高度仍可見全部結果與輸入。
- 固定匯率資料驗證主來源公式：175,500 IDR → USD10.97／TWD351.00／MYR52.65。
- 主來源故障時使用備援並切換 attribution；兩來源皆失敗時使用最後成功匯率，顯示「已存資料／資料較舊」。
- Chromium 與 Safari 均完成：首次載入成功及 service worker 接管後，讓隔離測試來源的所有網路 GET 失敗，再銷毀／重建 App iframe；離線重開仍可使用已存匯率換算，顯示離線狀態。
- Chromium 與 Safari 均完成：已開啟的 v1 測試 shell 輸入 50，伺服器改提供 v2、更新 service worker 後，自動重新載入 v2、保留 50，舊版本快取移除。
- macOS Safari 動態 viewport 390×844 → 390×724 → 390×620 → 390×844 均不捲動；新鮮匯率收到前景／連線事件時 0 次請求，過期後前景事件更新 1 次，隨後連線事件不重複請求。
- manifest：standalone、相對 start_url／scope；圖示實際尺寸 192×192、512×512，Apple touch icon 180×180。

## 測試方法與限制

隔離測試使用相同 App 原始碼，僅將匯率 URL 改到本機固定資料，以及為 service worker 升級注入測試版本標記。離線測試實際關閉測試來源的網路回應，另模擬 `navigator.onLine=false` 檢查離線提示。這些測試注入均未發布到正式網站。

**沒有實體 iPhone 測試。** 已測試 macOS Safari；安全區、PWA 尺寸及系統鍵盤占用以桌面瀏覽器模擬。iOS Safari 工具列展開／收合、實際手勢條、安裝後 standalone 與實際原生鍵盤彈出仍需在 iPhone 確認，不能視為已實機通過。

## 部署

GitHub 儲存庫：`ronnieurhomie/rupiah-pocket`，已確認為 **private**。
Cloudflare Pages：`rupiah-pocket`，已設定 GitHub `main` 自動部署、`exit 0`、根目錄靜態輸出；無後端、付費 API 或自訂網域。
正式網址：https://rupiah-pocket.pages.dev 。已實際開啟、HTTP 200。首次 Git push 自動部署成功（commit `4bde3c8`，deployment `79a6fefa-0d37-431c-9f9b-99d88d11b405`）。

正式站 `index.html`、CSS、兩個 JS 模組、`sw.js`、manifest 及三個圖示全部 HTTP 200，與本機來源逐 byte 相同。manifest MIME 正確；`sw.js` 回應 `Cache-Control: no-cache`。主來源的 CORS 為 `*`，正式畫面取得 2026-11-16 的資料；175.5 顯示 Rp175,500、USD9.63／TWD317.06／MYR39.37。

程式資源與圖示合計約 28KB（未壓縮），靜態託管，無伺服器運算費或付費模型。
