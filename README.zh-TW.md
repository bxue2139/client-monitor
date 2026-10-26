# client-monitor

[English](README.md)

Paseo 插件：即時顯示有多少客戶端連到 Paseo daemon，以及是哪些。

Paseo 可以透過 relay.paseo.sh 從網頁版（app.paseo.sh）、桌面 App 和手機連到 daemon，但不會告訴你現在有誰連著。這個插件會：在側邊欄顯示數量、列出每個客戶端的狀態和 App 版本，並在 daemon 從沒見過的裝置連進來時提醒你。

## 功能

- **側邊欄「外部連線」**附數字：在線的外部客戶端數，重連中的會以 `+N` 顯示。點開是完整頁面。
- **完整頁面**：所選主機的所有客戶端，包括外部、本機、最近離線，以及最近的連線/斷線事件和 daemon 自己的 session 統計。
- **主機選單**：插件裝在兩台以上主機時，Paseo 會在完整頁面頂端顯示主機選單。側邊欄和底部的數字會跟著切到你選的主機。
- **底部「外部連線」**：同樣的數字，點開是小視窗，內容相同，並有按鈕開啟完整頁面。
- **新裝置提示**：daemon 日誌中從沒出現過的 clientId 連線時，會跳出警告提示，寫明是哪台主機、哪個裝置。開啟 App 時已知的客戶端不會觸發。
- **複製 clientId**：點一下該列即可。

### 狀態說明

| 狀態 | 意思 |
|---|---|
| 在線 | 客戶端與 daemon 有連線中的 session。 |
| 重連中 | 連線斷了，daemon 會保留 session 約 90 秒等它回來。 |
| 離線 | session 已結束，或 daemon worker 重啟過。 |

客戶端種類：

- **外部**：網頁版、其他電腦上的桌面 App、iOS 和 Android App，全部經由 relay.paseo.sh 連線。
- **本機**：daemon 所在電腦上的 App 和 `paseo` CLI。
- **插件程序**也會連到 daemon，會算進 daemon 的連線總數，但不會列出。

## 需求

- Paseo daemon 0.13.0 以上。
- 要安裝的每台主機都已在 Settings → Plugins 開啟 **Enable plugins**。
- 插件只用 Node 標準函式庫，路徑處理不分作業系統。已在 Windows 上測試。

## 安裝

**要監看哪台主機，就在那台主機上安裝。** 插件讀的是它所在那台 daemon 的日誌，沒裝的主機無法監看，也不會出現在主機選單裡。

1. 把 `client-monitor-<版本>.zip` 解壓到要長期保留的位置，例如 `~/paseo-plugins/`。插件直接從該資料夾執行，安裝後不能搬移或刪除。
2. 用解壓出來的 `client-monitor` 資料夾的絕對路徑安裝。不需要 `npm install`，Paseo 執行時會提供插件 SDK、React、React Native、TanStack Query 和 Zod。

   ```sh
   paseo plugin install /絕對路徑/client-monitor
   ```

   Windows 路徑有空格要加引號：

   ```powershell
   paseo plugin install "C:\Users\你的帳號\paseo-plugins\client-monitor"
   ```

   也可以在 Settings → Plugins → Plugin source 貼上同一個路徑，按 **Install plugin**。

3. 確認在運行：

   ```sh
   paseo plugin ls
   paseo plugin logs client-monitor
   ```

   日誌最後應該有一行像 `[client-monitor] following /home/you/.paseo/daemon.log from byte 123456`。

Paseo 的 `npm:` 來源只接受 npm 官方套件庫上的套件，本機的 `.tgz` 無法安裝，請用資料夾安裝。

### 更新

先移除舊版，再安裝新的資料夾：

```sh
paseo plugin remove client-monitor
paseo plugin install /絕對路徑/新的/client-monitor
```

### 移除

```sh
paseo plugin remove client-monitor
```

也可以在 Paseo 的側邊欄設定中分別隱藏側邊欄那一列或底部那一列。新裝置提示由底部那一列負責，隱藏底部那一列就不會跳提示。

## 運作方式

Paseo 的插件 SDK 沒有讀取客戶端連線的 API，所以插件讀取 daemon 本來就會寫的日誌。

- **伺服器端**（daemon 的子程序）：啟動時先讀 `daemon.log.txt` 列出的最近 3 個輪替日誌，再讀 `daemon.log`，重建目前狀態；之後每秒檢查 `daemon.log` 有沒有新內容。daemon 輪替日誌時，會先讀完被改名的舊檔再接著讀新檔，不會漏掉事件。
- **讀取的事件**：
  - `Client connected via hello` → 在線。
  - `Client disconnected; waiting for reconnect` → 重連中。
  - `ws_runtime_metrics`（每 30 秒一次）→ daemon 的統計。統計顯示沒有 session 在等重連時，重連中的客戶端改為離線。
- 客戶端的狀態以它最新的連線為準，所以已被取代的舊連線晚到的斷線訊息會被忽略。若沒有統計資料，重連中超過 3 分鐘也會改為離線。
- **客戶端**（每個 Paseo App）：每 2 秒向主機上的插件取一次資料，各主機分開。

日誌位置是 `$PASEO_HOME/daemon.log`，沒設定 `PASEO_HOME` 時為 `~/.paseo/daemon.log`。

## 隱私

插件只讀取本機 daemon 的日誌，並只提供給連到同一台 daemon 的 Paseo 客戶端。不會傳送任何資料到其他地方，也不會寫入任何檔案。

## 限制

- **沒有裝置名稱或 IP。** 對 relay 客戶端，daemon 只記錄 clientId 和 App 版本。同一個 App 重連時 clientId 不變，所以不認得的 ID 通常代表新的瀏覽器或裝置，或清除過 App 資料的裝置。
- **總數最多延遲 30 秒**，因為 daemon 每 30 秒寫一次統計。個別的連線/斷線 1 到 2 秒內就會顯示。
- **依賴 Paseo 的日誌格式。** 若未來的 Paseo 版本改了這些日誌訊息，數字可能停止更新，需要更新插件。
- daemon 把總數叫做 `externalSessionKeys`，但實際上包含所有非插件的客戶端 session，含本機和重連中的。插件依實際意思標示。
- 事件清單保留最近 50 筆外部和本機客戶端的連線/斷線。

## 開發

```sh
npm install        # 只用於型別定義和測試工具
npm test           # 日誌追蹤器的單元測試（Node 22.6 以上可直接執行 TypeScript）
npm run typecheck
paseo plugin reload client-monitor
```

| 路徑 | 用途 |
|---|---|
| `index.server.ts` | 啟動日誌追蹤並提供 `connections.snapshot` RPC。 |
| `server/log-follower.ts` | 讀取輪替日誌、跟隨 `daemon.log`、處理輪替。 |
| `server/tracker.ts` | 把日誌行轉成客戶端狀態和事件。沒有引用 Node 模組，可直接做單元測試。 |
| `server/tracker.test.ts` | 追蹤器的測試，不會打包進安裝包。 |
| `shared/connections.ts` | 伺服器端和客戶端共用的 RPC 格式。 |
| `index.client.tsx` | 註冊完整頁面、側邊欄那一列和底部那一列。 |
| `client/screen.tsx` | 完整頁面。 |
| `client/sidebar.tsx` | 側邊欄那一列、底部那一列、小視窗和新裝置提示。 |
| `client/view.tsx` | 客戶端清單和事件，完整頁面和小視窗共用。 |

打包安裝包：執行 `npm pack`，把解出的 `package` 資料夾改名為 `client-monitor` 後壓縮成 zip。
