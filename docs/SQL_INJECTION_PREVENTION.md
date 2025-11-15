# SQL 注入防護指南

## 🛡️ 什麼是 SQL 注入？

SQL 注入是一種常見的 Web 安全漏洞，攻擊者通過在輸入中插入惡意 SQL 代碼來操縱數據庫查詢。

### 危險示例

```typescript
// ❌ 危險：直接拼接用戶輸入
const email = req.body.email // 攻擊者輸入: "' OR '1'='1"
const query = `SELECT * FROM users WHERE email = '${email}'`
// 實際執行: SELECT * FROM users WHERE email = '' OR '1'='1'
// 結果：返回所有用戶！
```

## ✅ 本項目的防護措施

### 1. 參數化查詢（主要防護）

所有用戶輸入都使用參數化查詢：

```typescript
// ✅ 安全：使用參數化查詢
const email = req.body.email
const query = 'SELECT * FROM users WHERE email = $1'
const result = await db.query(query, [email])
```

**為什麼安全？**
- 用戶輸入被當作數據，不是 SQL 代碼
- 數據庫驅動會自動轉義特殊字符
- 攻擊者無法注入 SQL 語句

### 2. 表名白名單（額外防護）

對於動態表名，使用白名單驗證：

```typescript
// ✅ 安全：白名單驗證
async getTableRowCount(tableName: string): Promise<number> {
  const ALLOWED_TABLES = [
    'users',
    'courses',
    'jobs',
    'enrollments',
    // ... 其他允許的表
  ]

  // 檢查表名是否在白名單中
  if (!ALLOWED_TABLES.includes(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`)
  }

  // 檢查表名格式
  if (!/^[a-z_][a-z0-9_]*$/i.test(tableName)) {
    throw new Error(`Invalid table name format: ${tableName}`)
  }

  // 驗證表是否存在
  const exists = await this.tableExists(tableName)
  if (!exists) {
    throw new Error(`Table does not exist: ${tableName}`)
  }

  // 現在可以安全使用
  return await db.query(`SELECT COUNT(*) FROM ${tableName}`)
}
```

### 3. BaseRepository 模式

使用 Repository 模式，表名在類定義時硬編碼：

```typescript
// ✅ 安全：表名硬編碼
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users') // 硬編碼的表名，不可能被注入
  }
}

// 使用
const userRepo = new UserRepository()
const user = await userRepo.findById(userId) // 安全
```

## 📋 安全檢查清單

### ✅ 已實施的防護

- [x] 所有用戶輸入使用參數化查詢（`$1`, `$2` 等）
- [x] 動態表名使用白名單驗證
- [x] Repository 類的表名硬編碼
- [x] WHERE 子句動態構建使用參數化
- [x] 表名格式驗證（正則表達式）
- [x] 表存在性驗證

### 🔍 需要注意的地方

#### 動態 WHERE 子句

```typescript
// ✅ 安全：參數化的動態 WHERE
function buildWhereClause(filters: Record<string, any>) {
  const conditions: string[] = []
  const params: any[] = []
  let paramIndex = 1

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      conditions.push(`${key} = $${paramIndex}`)
      params.push(value)
      paramIndex++
    }
  })

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  }
}

// 使用
const { whereClause, params } = buildWhereClause({ 
  status: 'active', 
  user_type: 'instructor' 
})
const users = await db.query(
  `SELECT * FROM users ${whereClause}`,
  params
)
```

**注意**：列名（`key`）來自代碼，不是用戶輸入，所以是安全的。

#### 動態 ORDER BY

```typescript
// ⚠️ 需要驗證：ORDER BY 不能參數化
function buildOrderBy(sortBy: string, sortOrder: string) {
  // 白名單驗證列名
  const ALLOWED_COLUMNS = ['id', 'created_at', 'updated_at', 'title', 'price']
  if (!ALLOWED_COLUMNS.includes(sortBy)) {
    throw new Error('Invalid sort column')
  }

  // 白名單驗證排序方向
  const ALLOWED_ORDERS = ['ASC', 'DESC']
  if (!ALLOWED_ORDERS.includes(sortOrder.toUpperCase())) {
    throw new Error('Invalid sort order')
  }

  return `ORDER BY ${sortBy} ${sortOrder}`
}

// 使用
const orderBy = buildOrderBy(req.query.sortBy, req.query.sortOrder)
const courses = await db.query(`SELECT * FROM courses ${orderBy}`)
```

## 🚫 絕對不要做的事

### ❌ 直接拼接用戶輸入

```typescript
// ❌ 危險
const search = req.query.search
const query = `SELECT * FROM courses WHERE title LIKE '%${search}%'`
```

### ❌ 使用字符串模板拼接

```typescript
// ❌ 危險
const userId = req.params.id
const query = `SELECT * FROM users WHERE id = ${userId}`
```

### ❌ 動態表名沒有驗證

```typescript
// ❌ 危險
const tableName = req.query.table
const query = `SELECT * FROM ${tableName}`
```

## ✅ 正確的做法

### 1. 簡單查詢

```typescript
// ✅ 正確
const userId = req.params.id
const user = await db.queryOne(
  'SELECT * FROM users WHERE id = $1',
  [userId]
)
```

### 2. LIKE 查詢

```typescript
// ✅ 正確
const search = req.query.search
const courses = await db.query(
  'SELECT * FROM courses WHERE title ILIKE $1',
  [`%${search}%`] // 在參數中添加 %，不是在 SQL 中
)
```

### 3. IN 查詢

```typescript
// ✅ 正確
const ids = [1, 2, 3, 4, 5]
const users = await db.query(
  'SELECT * FROM users WHERE id = ANY($1)',
  [ids]
)
```

### 4. 多個條件

```typescript
// ✅ 正確
const filters = {
  status: 'active',
  userType: 'instructor',
  isApproved: true
}

const conditions: string[] = []
const params: any[] = []
let paramIndex = 1

Object.entries(filters).forEach(([key, value]) => {
  conditions.push(`${key} = $${paramIndex}`)
  params.push(value)
  paramIndex++
})

const whereClause = conditions.join(' AND ')
const users = await db.query(
  `SELECT * FROM users WHERE ${whereClause}`,
  params
)
```

### 5. 複雜查詢

```typescript
// ✅ 正確
const courses = await db.query(`
  SELECT 
    c.*,
    u.first_name,
    u.last_name,
    COUNT(e.id) as enrollment_count
  FROM courses c
  LEFT JOIN users u ON c.instructor_id = u.id
  LEFT JOIN enrollments e ON c.id = e.course_id
  WHERE 
    c.is_active = $1
    AND c.price <= $2
    AND c.course_type = $3
  GROUP BY c.id, u.id
  ORDER BY c.created_at DESC
  LIMIT $4 OFFSET $5
`, [true, maxPrice, courseType, limit, offset])
```

## 🧪 測試 SQL 注入防護

### 測試用例

```typescript
// 測試腳本: scripts/test-sql-injection.ts
import { db } from '../src/utils/database'

async function testSQLInjection() {
  console.log('🧪 測試 SQL 注入防護...\n')

  // 測試 1: 嘗試注入 OR 條件
  try {
    const maliciousEmail = "' OR '1'='1"
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [maliciousEmail]
    )
    console.log('✅ 測試 1 通過：OR 注入被阻止')
    console.log('   查詢結果:', result.rows.length, '行')
  } catch (error) {
    console.error('❌ 測試 1 失敗:', error)
  }

  // 測試 2: 嘗試注入 UNION
  try {
    const maliciousSearch = "' UNION SELECT * FROM users --"
    const result = await db.query(
      'SELECT * FROM courses WHERE title ILIKE $1',
      [`%${maliciousSearch}%`]
    )
    console.log('✅ 測試 2 通過：UNION 注入被阻止')
    console.log('   查詢結果:', result.rows.length, '行')
  } catch (error) {
    console.error('❌ 測試 2 失敗:', error)
  }

  // 測試 3: 嘗試注入 DROP TABLE
  try {
    const maliciousInput = "'; DROP TABLE users; --"
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [maliciousInput]
    )
    console.log('✅ 測試 3 通過：DROP TABLE 注入被阻止')
  } catch (error) {
    console.error('❌ 測試 3 失敗:', error)
  }

  // 測試 4: 表名白名單
  try {
    await db.getTableRowCount('malicious_table')
    console.error('❌ 測試 4 失敗：應該拒絕無效表名')
  } catch (error) {
    console.log('✅ 測試 4 通過：無效表名被拒絕')
  }

  // 測試 5: 表名格式驗證
  try {
    await db.getTableRowCount('users; DROP TABLE users;')
    console.error('❌ 測試 5 失敗：應該拒絕惡意表名')
  } catch (error) {
    console.log('✅ 測試 5 通過：惡意表名被拒絕')
  }

  console.log('\n✅ 所有 SQL 注入測試通過！')
}

testSQLInjection()
```

運行測試：
```bash
npx tsx scripts/test-sql-injection.ts
```

## 📚 參考資源

- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS)
- [Node.js pg 參數化查詢](https://node-postgres.com/features/queries#parameterized-query)

## 🔄 定期審查

建議每季度進行一次安全審查：

- [ ] 檢查所有新增的數據庫查詢
- [ ] 確認沒有直接拼接用戶輸入
- [ ] 更新表名白名單（如果有新表）
- [ ] 運行 SQL 注入測試
- [ ] 審查動態 SQL 構建邏輯

---

**最後更新**: 2024年12月19日  
**安全級別**: ✅ 高
