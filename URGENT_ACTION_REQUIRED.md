# 🚨 緊急行動清單

## ⚠️ 你的數據庫密碼已洩露！

在代碼審查中發現 `wrangler.toml` 文件被提交到 Git，包含：
- 🔴 **數據庫連接字符串（含密碼）**
- 🔴 **JWT Secret**

**任何能訪問你的 Git 倉庫的人都能完全控制你的數據庫！**

---

## 🔥 立即執行（按順序）

### 1. 更改數據庫密碼（最優先！）

⏰ **預計時間**: 5 分鐘

1. 登入 [Neon Console](https://console.neon.tech/)
2. 選擇項目：`pharmacy-assistant-academy`
3. 點擊 **Settings** → **Reset password**
4. 複製新密碼
5. 保存到安全的地方（密碼管理器）

### 2. 生成新的 JWT Secret

⏰ **預計時間**: 1 分鐘

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

複製輸出的隨機字符串。

### 3. 創建本地配置文件

⏰ **預計時間**: 3 分鐘

#### 創建 `.env` 文件

```bash
cp .env.example .env
```

編輯 `.env`，填入：
```bash
JWT_SECRET=你在步驟2生成的secret
DATABASE_URL=postgresql://neondb_owner:新密碼@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

#### 創建 `wrangler.toml` 文件

```bash
cp wrangler.toml.example wrangler.toml
```

編輯 `wrangler.toml`，填入：
```toml
name = "pharmacy-assistant-academy"
pages_build_output_dir = "dist"
compatibility_date = "2024-10-19"
compatibility_flags = ["nodejs_compat"]

[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ttqs"

[vars]
ENVIRONMENT = "production"
DATABASE_URL = "postgresql://neondb_owner:新密碼@ep-jolly-frost-a1muxrt0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET = "你在步驟2生成的secret"

[env.production]
name = "pharmacy-assistant-academy"
```

⚠️ **重要**：這個文件不會被提交到 Git（已在 .gitignore 中）

### 4. 更新 Cloudflare Pages 環境變量

⏰ **預計時間**: 5 分鐘

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 進入你的 Pages 項目
3. **Settings** → **Environment variables**
4. 更新以下變量：
   - `DATABASE_URL`: 新的數據庫連接字符串
   - `JWT_SECRET`: 新的 JWT secret
5. 點擊 **Save**
6. 重新部署應用

### 5. 測試本地開發

⏰ **預計時間**: 2 分鐘

```bash
npm run dev
```

訪問 http://localhost:5173，測試：
- [ ] 登入功能
- [ ] 查看課程
- [ ] 其他基本功能

### 6. 推送代碼

⏰ **預計時間**: 1 分鐘

```bash
git push origin main
```

這會推送已經移除敏感信息的代碼。

---

## ✅ 完成檢查清單

- [ ] 已更改 Neon 數據庫密碼
- [ ] 已生成新的 JWT Secret
- [ ] 已創建本地 `.env` 文件
- [ ] 已創建本地 `wrangler.toml` 文件
- [ ] 已更新 Cloudflare Pages 環境變量
- [ ] 已測試本地開發環境
- [ ] 已推送代碼到 Git
- [ ] 已重新部署 Cloudflare Pages
- [ ] 已測試生產環境

---

## 📋 後續步驟（可選但推薦）

### 清理 Git 歷史

如果你的倉庫是公開的，或者有其他人有訪問權限，**強烈建議**清理 Git 歷史：

```bash
# 使用 git-filter-repo
pip install git-filter-repo

git filter-repo --path .env --invert-paths
git filter-repo --path .env.development --invert-paths
git filter-repo --path .env.production --invert-paths
git filter-repo --path .env.staging --invert-paths
git filter-repo --path wrangler.toml --invert-paths

# 強制推送
git push origin --force --all
```

⚠️ **警告**：這會重寫 Git 歷史！

### 啟用安全監控

1. 安裝 git-secrets：
   ```bash
   brew install git-secrets  # macOS
   git secrets --install
   git secrets --add 'JWT_SECRET.*'
   git secrets --add 'DATABASE_URL.*'
   ```

2. 啟用 GitHub Secret Scanning（如果使用 GitHub）

---

## 🆘 需要幫助？

參考詳細文檔：
- `docs/SECURITY_FIX_URGENT.md` - 完整修復指南
- `docs/JWT_SECRET_SETUP.md` - JWT Secret 配置
- `docs/SQL_INJECTION_PREVENTION.md` - SQL 安全

---

## ⏰ 預計總時間

**約 20 分鐘**完成所有必要步驟

---

**創建時間**: 2024年12月19日  
**嚴重程度**: 🔴 緊急  
**狀態**: ⚠️ 需要立即處理
