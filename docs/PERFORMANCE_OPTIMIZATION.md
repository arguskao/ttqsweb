# 藥助Next學院 - 效能優化指南

## 概述

本文檔詳細說明了藥助Next學院網站的效能優化策略和實施方法，包括前端優化、SEO優化、PWA功能和監控分析。

## 效能優化策略

### 1. 代碼分割與懶加載

#### 路由級別代碼分割
```typescript
// 使用動態導入進行路由級別的代碼分割
{
  path: '/courses',
  component: () => import('../views/courses/CoursesView.vue')
}
```

#### 組件級別懶加載
```typescript
// 在組件中使用 defineAsyncComponent
import { defineAsyncComponent } from 'vue'

const AsyncComponent = defineAsyncComponent(() => 
  import('./components/HeavyComponent.vue')
)
```

#### Bundle 分析
- 使用 Vite 的 rollup 配置進行手動分塊
- 將第三方庫分離到獨立的 chunk
- 監控 bundle 大小並設置警告限制

### 2. 圖片優化

#### WebP 格式支援
- 自動檢測瀏覽器 WebP 支援
- 提供 WebP 和傳統格式的 fallback
- 使用 `OptimizedImage` 組件進行統一管理

#### 懶加載實施
```vue
<OptimizedImage
  src="/images/course-banner.jpg"
  alt="課程橫幅"
  :lazy="true"
  :webp="true"
/>
```

#### 響應式圖片
- 使用 `srcset` 和 `sizes` 屬性
- 根據設備像素密度提供不同尺寸
- 實施 Intersection Observer API

### 3. 資源預加載

#### 關鍵資源預加載
```html
<!-- 預加載關鍵字體 -->
<link rel="preload" href="/fonts/NotoSansTC.woff2" as="font" type="font/woff2" crossorigin>

<!-- 預連接外部域名 -->
<link rel="preconnect" href="https://api.pharmacy-academy.com">
<link rel="preconnect" href="https://fonts.googleapis.com">
```

#### DNS 預解析
```html
<link rel="dns-prefetch" href="//www.google-analytics.com">
<link rel="dns-prefetch" href="//cdnjs.cloudflare.com">
```

### 4. CSS 優化

#### 關鍵 CSS 內聯
- 將首屏關鍵 CSS 內聯到 HTML
- 非關鍵 CSS 異步加載
- 使用 `media` 屬性進行條件加載

#### CSS 壓縮與優化
- 移除未使用的 CSS
- 使用 CSS 變數減少重複
- 優化 CSS 選擇器性能

### 5. JavaScript 優化

#### Tree Shaking
- 使用 ES6 模組語法
- 避免導入整個庫，只導入需要的部分
- 配置 Vite 進行死代碼消除

#### 代碼壓縮
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  }
})
```

## SEO 優化

### 1. Meta 標籤管理

#### 動態 Meta 標籤
```typescript
// 使用 useSEO composable
const { updateSEO } = useSEO()

updateSEO({
  title: '課程列表 - 藥助Next學院',
  description: '瀏覽專業的藥局助理課程',
  keywords: '藥學課程,職能訓練,實務課程'
})
```

#### Open Graph 標籤
- 完整的 Facebook/LinkedIn 分享優化
- Twitter Card 支援
- 動態生成社群媒體預覽圖

### 2. 結構化資料

#### JSON-LD 實施
```json
{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "藥助Next學院",
  "description": "專業藥局助理轉職教育與就業媒合平台"
}
```

#### 課程結構化資料
```json
{
  "@type": "Course",
  "name": "藥局助理基礎課程",
  "description": "學習藥局基本操作和客戶服務技能",
  "provider": {
    "@type": "Organization",
    "name": "藥助Next學院"
  }
}
```

### 3. 網站地圖

#### 靜態網站地圖
- 包含所有主要頁面
- 設定適當的優先級和更新頻率
- 提交到 Google Search Console

#### 動態網站地圖生成
```typescript
// 使用 SitemapGenerator 類
const generator = new SitemapGenerator()
await generator.addDynamicUrls()
const sitemap = generator.generateXML()
```

### 4. 語義化 HTML

#### 正確的標籤結構
```html
<main>
  <article>
    <header>
      <h1>課程標題</h1>
    </header>
    <section>
      <h2>課程內容</h2>
    </section>
  </article>
</main>
```

#### 無障礙優化
- 適當的 ARIA 標籤
- 鍵盤導航支援
- 螢幕閱讀器友好

## PWA 功能

### 1. Service Worker

#### 快取策略
```javascript
// 靜態資源快取
const STATIC_FILES = [
  '/',
  '/assets/main.css',
  '/favicon.ico'
]

// 動態內容快取
self.addEventListener('fetch', (event) => {
  // Cache First 策略用於靜態資源
  // Network First 策略用於 API 請求
})
```

#### 離線支援
- 關鍵頁面離線可用
- 離線狀態提示
- 背景同步功能

### 2. Web App Manifest

#### 完整的 PWA 配置
```json
{
  "name": "藥助Next學院",
  "short_name": "藥助學院",
  "display": "standalone",
  "start_url": "/",
  "theme_color": "#00d1b2"
}
```

#### 安裝提示
- 自訂安裝橫幅
- 安裝引導流程
- 跨平台支援

### 3. 推播通知

#### 通知策略
- 課程開始提醒
- 新職缺通知
- 重要公告推送

## 監控與分析

### 1. Web Vitals 監控

#### 核心指標追蹤
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

#### 實時監控
```typescript
import { getCLS, getFID, getLCP } from 'web-vitals'

getCLS((metric) => {
  // 發送到 Google Analytics
  gtag('event', 'CLS', {
    value: Math.round(metric.value * 1000),
    event_category: 'Web Vitals'
  })
})
```

### 2. Google Analytics 整合

#### 事件追蹤
```typescript
// 課程註冊追蹤
analytics.trackCourseEnrollment(courseId, courseName)

// 求職申請追蹤
analytics.trackJobApplication(jobId, jobTitle)

// 文件下載追蹤
analytics.trackDocumentDownload(docId, docName)
```

#### 自訂維度
- 用戶類型（求職者/雇主）
- 課程類別
- 地理位置

### 3. 效能預算

#### 設定限制
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000, // 1MB
  }
})
```

#### 監控指標
- Bundle 大小 < 1MB
- 首次載入時間 < 3s
- Time to Interactive < 5s

## 最佳實踐

### 1. 開發階段

#### 效能檢查清單
- [ ] 使用 Lighthouse 進行定期檢查
- [ ] 監控 bundle 大小變化
- [ ] 檢查圖片優化
- [ ] 驗證 SEO 標籤

#### 工具使用
```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# Bundle 分析
npm run build -- --analyze

# 效能測試
npm run test:performance
```

### 2. 部署階段

#### 自動化檢查
- CI/CD 中整合 Lighthouse
- 效能回歸測試
- SEO 驗證

#### 監控設定
- Real User Monitoring (RUM)
- 錯誤追蹤
- 效能警報

### 3. 維護階段

#### 定期優化
- 每月效能審查
- 依賴套件更新
- 快取策略調整

#### 持續改進
- A/B 測試新優化
- 用戶回饋分析
- 競品效能比較

## 效能指標目標

### Core Web Vitals
- **LCP**: < 2.5 秒 (目標: < 2.0 秒)
- **FID**: < 100 毫秒 (目標: < 50 毫秒)
- **CLS**: < 0.1 (目標: < 0.05)

### 其他指標
- **TTFB**: < 600 毫秒
- **Speed Index**: < 3.0 秒
- **Total Blocking Time**: < 200 毫秒

### SEO 指標
- **Mobile-Friendly**: 100%
- **Page Speed Insights**: > 90 分
- **Accessibility**: > 95 分

## 故障排除

### 常見效能問題

#### 1. 大型 Bundle
**問題**: JavaScript bundle 過大
**解決方案**:
- 實施代碼分割
- 移除未使用的依賴
- 使用動態導入

#### 2. 圖片載入慢
**問題**: 圖片檔案過大或格式不當
**解決方案**:
- 使用 WebP 格式
- 實施懶加載
- 優化圖片尺寸

#### 3. CSS 阻塞渲染
**問題**: CSS 檔案阻塞首屏渲染
**解決方案**:
- 內聯關鍵 CSS
- 異步載入非關鍵 CSS
- 使用 media 查詢

### 監控工具

#### 開發工具
- Chrome DevTools Performance
- Lighthouse
- WebPageTest

#### 生產監控
- Google Analytics
- Cloudflare Analytics
- New Relic (可選)

## 更新記錄

- 2024-10-19: 初始效能優化實施
- 2024-10-19: PWA 功能完成
- 2024-10-19: SEO 優化完成
- 2024-10-19: 監控系統建立