# Augment AI 開發規範

## 通用原則
- **回應語言**: 總是用中文回答問題
- **TypeScript 優先**: 除非專案明確要求 JavaScript
- **避免 `any`**: 優先使用明確的類型定義
- **語義化命名**: 使用清晰的變數和函數命名

## 前端開發規範

### Vue 3 專案
- ✅ 使用 Composition API (`<script setup>`)
- ✅ 使用 `ref` 和 `reactive` 管理狀態
- ✅ 使用 `computed` 處理衍生狀態
- ✅ 組件命名使用 PascalCase (例: `AppHeader.vue`)
- ✅ Props 和 Emits 必須定義類型

### React 專案
- ✅ 使用 Hooks (useState, useEffect, useMemo 等)
- ✅ 使用函數組件,避免 Class 組件
- ✅ 組件命名使用 PascalCase

### CSS
- ✅ 優先使用現有 CSS 框架 (Tailwind, Bulma 等)
- ✅ 使用 scoped style 避免樣式污染
- ✅ 響應式設計優先 (mobile-first)
- ❌ 不要隨意優化或精簡 CSS 框架 (可能破壞樣式)

## 後端開發規範

### API 設計
- ✅ 使用 RESTful API 設計原則
- ✅ 使用 async/await 處理異步操作
- ✅ 所有 API 錯誤必須妥善處理
- ✅ 返回適當的 HTTP 狀態碼

### 資料庫
- ✅ 使用參數化查詢防止 SQL 注入
- ✅ 建立適當的索引優化查詢
- ✅ 使用 transaction 確保資料一致性

## 套件管理 (重要!)

### Node.js / JavaScript
```bash
# ✅ 正確做法
npm install <package>
npm uninstall <package>

# ❌ 錯誤做法
# 不要手動編輯 package.json
```

### Python
```bash
# ✅ 正確做法
pip install <package>
poetry add <package>

# ❌ 錯誤做法
# 不要手動編輯 requirements.txt
```

### Rust
```bash
# ✅ 正確做法
cargo add <package>
cargo remove <package>
```

## Git 提交規範

使用語義化提交訊息:
- `feat:` 新功能
- `fix:` 修復 bug
- `refactor:` 重構代碼
- `docs:` 文檔更新
- `style:` 代碼格式調整
- `test:` 測試相關
- `chore:` 其他雜項

範例:
```
feat: Add user authentication feature
fix: Fix login redirect issue
refactor: Optimize database queries
```

## 安全性

- ❌ 不要在代碼中硬編碼密碼、API 金鑰
- ✅ 使用環境變數 (.env 文件)
- ✅ 驗證所有用戶輸入
- ✅ 使用 HTTPS 傳輸敏感資料
- ✅ 實作適當的認證和授權機制

## 效能優化

- ✅ 使用 lazy loading 和 code splitting
- ✅ 優化圖片和資源載入
- ✅ 使用適當的緩存策略
- ✅ 避免不必要的重新渲染
- ✅ 使用 CDN 加速靜態資源

## 測試

- ✅ 修改代碼後必須測試
- ✅ 優先編寫單元測試
- ✅ 確保測試通過後再提交
- ✅ 測試覆蓋率至少 70%

## 代碼風格

- ✅ 使用一致的縮排 (2 或 4 空格)
- ✅ 使用 ESLint/Prettier 自動格式化
- ✅ 移除未使用的 import 和變數
- ✅ 添加適當的註解說明複雜邏輯
- ❌ 生產環境代碼不要包含 console.log

## 錯誤處理

- ✅ 使用 try-catch 包裹可能出錯的代碼
- ✅ 顯示友善的錯誤訊息給用戶
- ✅ 記錄錯誤日誌以便調試
- ✅ 不要忽略或吞掉錯誤

## 文檔

- ✅ 為複雜函數添加 JSDoc 註解
- ✅ 更新 README.md 說明專案設置
- ✅ 記錄 API 端點和參數
- ✅ 維護 CHANGELOG.md

## 禁止事項

- ❌ 不要手動編輯套件配置文件 (package.json, requirements.txt 等)
- ❌ 不要在沒有測試的情況下部署到生產環境
- ❌ 不要忽略錯誤處理
- ❌ 不要使用已棄用的 API 或套件
- ❌ 不要提交包含敏感資訊的代碼
- ❌ 不要創建不必要的文件或文檔 (除非用戶明確要求)

## 部署流程

1. 本地測試
2. 運行測試套件
3. 構建生產版本
4. 提交代碼到 Git
5. 部署到測試環境驗證
6. 部署到生產環境
7. 監控錯誤和效能指標

## AI 助手行為準則

- ✅ 總是用中文回答問題
- ✅ 在修改代碼前先理解現有架構
- ✅ 使用 codebase-retrieval 工具搜尋相關代碼
- ✅ 修改後運行測試確保功能正常
- ✅ 提供清晰的解釋和範例
- ❌ 不要創建不必要的文檔文件
- ❌ 不要做超出用戶要求的修改

