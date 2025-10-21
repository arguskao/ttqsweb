# 藥助Next學院 (Pharmacy Assistant Academy)

專業藥局助理轉職教育與就業媒合平台

## 專案概述

藥助Next學院是一個現代化的線上教育平台，專門為想要轉職進入藥局工作的人員提供專業訓練課程和就業媒合服務。

### 核心特色

- **職能導向**: 針對藥局實際工作需求設計課程
- **實務結合**: 強調實務操作與理論結合
- **就業媒合**: 提供完整的就業媒合服務

## 技術架構

### 前端技術
- **框架**: Vue 3 (Composition API)
- **構建工具**: Vite
- **CSS框架**: Bulma
- **語言**: TypeScript
- **路由**: Vue Router 4
- **HTTP客戶端**: Axios

### 開發工具
- **代碼規範**: ESLint + Prettier
- **類型檢查**: TypeScript
- **包管理**: npm

## 開發環境設置

### 前置需求
- Node.js 20.19.0+ 或 22.12.0+
- npm

### 安裝步驟

1. 克隆專案
```bash
git clone <repository-url>
cd pharmacy-assistant-academy
```

2. 安裝依賴
```bash
npm install
```

3. 設置環境變數
```bash
cp .env.example .env
# 編輯 .env 文件，設置必要的環境變數
```

4. 啟動開發伺服器
```bash
npm run dev
```

## 可用腳本

- `npm run dev` - 啟動開發伺服器
- `npm run build` - 構建生產版本
- `npm run preview` - 預覽生產版本
- `npm run type-check` - TypeScript 類型檢查
- `npm run lint` - 代碼檢查和自動修復
- `npm run format` - 代碼格式化

## 專案結構

```
src/
├── components/           # 可重用組件
│   ├── common/          # 通用組件
│   ├── forms/           # 表單組件
│   ├── layout/          # 佈局組件
│   └── ui/              # UI組件
├── views/               # 頁面組件
│   ├── auth/            # 認證相關頁面
│   ├── courses/         # 課程相關頁面
│   ├── jobs/            # 就業媒合頁面
│   ├── profile/         # 用戶資料頁面
│   └── admin/           # 管理後台頁面
├── stores/              # 狀態管理
├── services/            # API服務
├── utils/               # 工具函數
├── types/               # TypeScript 類型定義
├── assets/              # 靜態資源
└── styles/              # 樣式文件
```

## 功能模組

### 已實現
- [x] 專案初始化與基礎設定
- [x] Vue 3 + TypeScript + Vite 配置
- [x] Bulma CSS 框架整合
- [x] 基礎路由配置
- [x] 響應式佈局組件
- [x] 用戶認證頁面（登入/註冊）

### 待實現
- [ ] 資料庫設計與 API 基礎架構
- [ ] 用戶認證系統
- [ ] 課程管理系統
- [ ] 就業媒合平台
- [ ] 講師管理系統
- [ ] 文件下載系統
- [ ] TTQS品質管理系統
- [ ] 數據分析與報告系統

## 部署

本專案設計為部署到 Cloudflare Pages，支援：
- 自動構建和部署
- CDN 加速
- 自訂域名
- SSL 憑證

## 貢獻指南

1. Fork 專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 文件

## 聯絡方式

如有任何問題或建議，請聯絡：
- Email: info@pharmacy-academy.com
- 電話: (02) 1234-5678