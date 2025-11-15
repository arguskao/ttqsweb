# JWT Secret 配置指南

## 🔐 為什麼需要 JWT Secret？

JWT Secret 是用來簽名和驗證 JWT Token 的密鑰。它確保：
1. Token 不能被偽造
2. Token 內容不能被篡改
3. 只有你的服務器能驗證 Token 的真實性

## ⚠️ 安全原則

### ❌ 絕對不要做的事
```typescript
// ❌ 不要硬編碼在代碼中
const secret = '3939889'

// ❌ 不要提交到 Git
JWT_SECRET=my-secret-key

// ❌ 不要使用簡單的字符串
JWT_SECRET=password123
```

### ✅ 正確的做法
```typescript
// ✅ 從環境變量讀取
const secret = process.env.JWT_SECRET || env.JWT_SECRET

// ✅ 如果沒有配置就報錯
if (!secret) {
  throw new Error('JWT_SECRET not configured')
}
```

## 🔧 配置步驟

### 1. 生成強隨機 Secret

使用以下任一方法生成強隨機字符串：

#### 方法 A: 使用 Node.js
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 方法 B: 使用 OpenSSL
```bash
openssl rand -hex 64
```

#### 方法 C: 使用在線工具
訪問: https://generate-secret.vercel.app/64

**示例輸出**:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2
```

### 2. 配置環境變量

#### 本地開發環境

創建 `.env` 文件（不要提交到 Git）：

```bash
# .env
JWT_SECRET=你生成的強隨機字符串
```

確保 `.gitignore` 包含：
```
.env
.env.local
.env.*.local
```

#### Cloudflare Pages 生產環境

1. 登入 Cloudflare Dashboard
2. 進入你的 Pages 項目
3. 點擊 **Settings** → **Environment variables**
4. 添加變量：
   - **Variable name**: `JWT_SECRET`
   - **Value**: 你生成的強隨機字符串
   - **Environment**: Production (和 Preview 如果需要)
5. 點擊 **Save**

#### Cloudflare Workers 環境

如果使用 `wrangler.toml`：

```toml
# wrangler.toml
# 不要在這裡寫 secret！

[env.production]
# 使用 wrangler secret 命令設置
```

使用命令行設置 secret：
```bash
wrangler secret put JWT_SECRET
# 然後輸入你的 secret
```

### 3. 驗證配置

#### 本地驗證
```bash
# 啟動開發服務器
npm run dev

# 檢查日誌，應該看到：
# [verifyToken] Token verified successfully
# 而不是：
# [verifyToken] JWT_SECRET not configured
```

#### 生產環境驗證

1. 部署到 Cloudflare Pages
2. 嘗試登入
3. 檢查 Cloudflare Dashboard 的 Logs
4. 確認沒有 "JWT_SECRET not configured" 錯誤

## 🔄 更新 Secret

如果需要更換 JWT Secret（例如懷疑洩露）：

### 注意事項
⚠️ **更換 Secret 會使所有現有 Token 失效**，所有用戶需要重新登入！

### 步驟

1. **生成新的 Secret**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **更新環境變量**
   - 本地: 更新 `.env` 文件
   - Cloudflare: 在 Dashboard 更新環境變量

3. **重新部署**
   ```bash
   git commit -m "Update JWT secret configuration"
   git push
   ```

4. **通知用戶**
   - 發送通知告知用戶需要重新登入
   - 或在前端顯示 "請重新登入" 提示

## 🧪 測試

### 測試 Secret 是否正確配置

創建測試腳本 `scripts/test-jwt-secret.ts`:

```typescript
import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET

if (!secret) {
  console.error('❌ JWT_SECRET not configured')
  process.exit(1)
}

console.log('✅ JWT_SECRET is configured')
console.log('Secret length:', secret.length, 'characters')

// 測試簽名和驗證
const testPayload = {
  userId: 1,
  email: 'test@example.com',
  userType: 'admin'
}

try {
  const token = jwt.sign(testPayload, secret, { expiresIn: '1h' })
  console.log('✅ Token signed successfully')
  
  const decoded = jwt.verify(token, secret)
  console.log('✅ Token verified successfully')
  console.log('Decoded payload:', decoded)
} catch (error) {
  console.error('❌ JWT test failed:', error)
  process.exit(1)
}

console.log('\n✅ All JWT tests passed!')
```

運行測試：
```bash
npx tsx scripts/test-jwt-secret.ts
```

## 📋 檢查清單

在部署到生產環境前，確認：

- [ ] 已生成強隨機 JWT Secret（至少 64 字符）
- [ ] 已在 Cloudflare Dashboard 配置環境變量
- [ ] `.env` 文件已添加到 `.gitignore`
- [ ] 代碼中沒有硬編碼的 secret
- [ ] 已測試登入功能正常
- [ ] 已測試 Token 驗證正常

## 🆘 常見問題

### Q: 忘記了 JWT Secret 怎麼辦？
A: 生成新的 Secret 並更新環境變量。所有用戶需要重新登入。

### Q: 可以使用相同的 Secret 在多個環境嗎？
A: 不建議。開發、預覽、生產環境應該使用不同的 Secret。

### Q: JWT Secret 需要多長？
A: 建議至少 32 字符，推薦 64 字符或更長。

### Q: 需要定期更換 JWT Secret 嗎？
A: 不是必須的，但如果懷疑洩露或作為安全最佳實踐，可以定期更換。

### Q: 如何在不影響用戶的情況下更換 Secret？
A: 可以實施雙 Secret 機制：
```typescript
const secrets = [
  process.env.JWT_SECRET_NEW,  // 新 secret，用於簽名
  process.env.JWT_SECRET_OLD   // 舊 secret，僅用於驗證
]

// 簽名時使用新 secret
const token = jwt.sign(payload, secrets[0])

// 驗證時嘗試兩個 secret
function verifyToken(token: string) {
  for (const secret of secrets) {
    try {
      return jwt.verify(token, secret)
    } catch (error) {
      continue
    }
  }
  throw new Error('Invalid token')
}
```

過渡期後（例如 7 天），移除舊 secret。

## 🔗 相關文檔

- [JWT 官方文檔](https://jwt.io/)
- [Cloudflare Pages 環境變量](https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables)
- [OWASP JWT 安全最佳實踐](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
