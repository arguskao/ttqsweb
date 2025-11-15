# 🚨 緊急安全修復指南

## 問題發現

在代碼審查中發現以下安全問題：

1. ❌ `.env` 文件被提交到 Git 倉庫
2. ❌ JWT_SECRET (`3939889`) 暴露在 Git 歷史中
3. ❌ 其他敏感配置可能也被洩露

## 🔥 立即行動

### 步驟 1: 更新 .gitignore

已完成 ✅ - `.gitignore` 已更新，現在會忽略所有 `.env` 文件

### 步驟 2: 從 Git 中移除敏感文件

```bash
# 從 Git 追蹤中移除（但保留本地文件）
git rm --cached .env
git rm --cached .env.development
git rm --cached .env.production
git rm --cached .env.staging

# 提交更改
git add .gitignore .env.example
git commit -m "security: 從 Git 中移除環境變量文件"
```

### 步驟 3: 生成新的 JWT Secret

```bash
# 生成新的強隨機 secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**示例輸出**：
```
04dc4ac51620dee127b7feca1fda4103b44f27fa3729ffa28cf295cc331c882d3a7b302bdf30c36bbddc80deb1790169b770b326768171f038a6563040854e52
```

### 步驟 4: 更新本地環境變量

編輯 `.env` 文件：

```bash
# .env
JWT_SECRET=04dc4ac51620dee127b7feca1fda4103b44f27fa3729ffa28cf295cc331c882d3a7b302bdf30c36bbddc80deb1790169b770b326768171f038a6563040854e52
DATABASE_URL=你的數據庫連接字符串
# ... 其他配置
```

對 `.env.development`、`.env.production`、`.env.staging` 做同樣的更新（使用不同的 secret）。

### 步驟 5: 更新 Cloudflare Pages 環境變量

1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 進入你的 Pages 項目
3. Settings → Environment variables
4. 更新 `JWT_SECRET` 為新生成的值
5. 點擊 Save

### 步驟 6: 清理 Git 歷史（可選但推薦）

⚠️ **警告**：這會重寫 Git 歷史，需要強制推送！

如果你的倉庫是私有的且只有你一個人使用，可以跳過此步驟。

如果是公開倉庫或多人協作，**必須清理歷史**：

```bash
# 使用 git-filter-repo（推薦）
# 安裝: pip install git-filter-repo

git filter-repo --path .env --invert-paths
git filter-repo --path .env.development --invert-paths
git filter-repo --path .env.production --invert-paths
git filter-repo --path .env.staging --invert-paths

# 強制推送（會重寫遠程歷史）
git push origin --force --all
```

**或使用 BFG Repo-Cleaner**：

```bash
# 下載 BFG: https://rtyley.github.io/bfg-repo-cleaner/

# 刪除包含敏感信息的文件
java -jar bfg.jar --delete-files .env
java -jar bfg.jar --delete-files .env.development
java -jar bfg.jar --delete-files .env.production
java -jar bfg.jar --delete-files .env.staging

# 清理
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 強制推送
git push origin --force --all
```

### 步驟 7: 通知團隊成員

如果是團隊項目，通知所有成員：

1. 舊的 JWT Secret 已失效
2. 需要從 `.env.example` 創建新的 `.env` 文件
3. 需要生成自己的 JWT Secret
4. 需要重新拉取代碼（如果清理了 Git 歷史）

### 步驟 8: 撤銷其他可能洩露的憑證

檢查 `.env` 文件中的其他敏感信息：

- [ ] 數據庫密碼 - 如果洩露，立即更改
- [ ] API 密鑰 - 如果洩露，立即撤銷並重新生成
- [ ] R2 訪問密鑰 - 如果洩露，立即撤銷
- [ ] 第三方服務密鑰 - 檢查並撤銷

## ✅ 驗證修復

### 1. 檢查 Git 狀態

```bash
# 確認 .env 文件不再被追蹤
git status

# 應該看到：
# Untracked files:
#   .env
#   .env.development
#   .env.production
#   .env.staging
```

### 2. 測試應用

```bash
# 啟動開發服務器
npm run dev

# 測試登入功能
# 確認 JWT token 正常工作
```

### 3. 檢查 Git 歷史（如果清理了）

```bash
# 搜索舊的 secret
git log --all --full-history --source --all -- .env

# 應該沒有結果
```

## 📋 安全檢查清單

完成以下所有項目：

- [ ] 更新 `.gitignore`
- [ ] 從 Git 中移除 `.env` 文件
- [ ] 生成新的 JWT Secret
- [ ] 更新本地 `.env` 文件
- [ ] 更新 Cloudflare Pages 環境變量
- [ ] 清理 Git 歷史（如果需要）
- [ ] 撤銷其他洩露的憑證
- [ ] 測試應用功能
- [ ] 通知團隊成員（如果適用）

## 🔒 未來預防措施

### 1. 使用 git-secrets

安裝 git-secrets 防止意外提交敏感信息：

```bash
# 安裝
brew install git-secrets  # macOS
# 或從 https://github.com/awslabs/git-secrets 安裝

# 配置
git secrets --install
git secrets --register-aws
git secrets --add 'JWT_SECRET.*'
git secrets --add 'DATABASE_URL.*'
git secrets --add 'API_KEY.*'
```

### 2. 使用 pre-commit hooks

創建 `.git/hooks/pre-commit`：

```bash
#!/bin/bash

# 檢查是否嘗試提交 .env 文件
if git diff --cached --name-only | grep -E "^\.env"; then
    echo "❌ 錯誤：嘗試提交 .env 文件！"
    echo "請從暫存區移除：git reset HEAD .env"
    exit 1
fi

# 檢查是否包含敏感信息
if git diff --cached | grep -E "(JWT_SECRET|DATABASE_URL|API_KEY|PASSWORD).*=.*[^example]"; then
    echo "⚠️  警告：可能包含敏感信息！"
    echo "請確認沒有提交真實的密鑰或密碼"
    read -p "確定要繼續嗎？(y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
```

### 3. 定期安全審查

每月檢查：

- [ ] `.gitignore` 是否正確配置
- [ ] 沒有敏感文件被追蹤
- [ ] 環境變量是否安全
- [ ] 依賴包是否有安全漏洞（`npm audit`）

## 📚 參考資源

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [git-secrets](https://github.com/awslabs/git-secrets)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

**創建日期**: 2024年12月19日  
**嚴重程度**: 🔴 高  
**狀態**: ⚠️ 需要立即處理
