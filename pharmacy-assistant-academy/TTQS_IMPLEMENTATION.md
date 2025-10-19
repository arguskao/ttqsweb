# TTQS品質管理系統實施文檔

## 概述

本文檔說明藥助Next學院的TTQS（Taiwan TrainQuali System）品質管理系統實施細節。系統遵循PDDRO體系（Plan-Design-Do-Review-Outcome）和四層評估機制。

## 系統架構

### 資料庫結構

#### 1. 訓練計劃管理 (Training Plans)
- **資料表**: `training_plans`
- **用途**: 管理PDDRO體系中的計劃階段
- **主要欄位**:
  - 計劃標題、描述、目標
  - 目標對象、訓練週數
  - 開始/結束日期
  - 狀態（草稿/進行中/已完成/已取消）

#### 2. 訓練執行記錄 (Training Executions)
- **資料表**: `training_executions`
- **用途**: 追蹤PDDRO體系中的執行階段
- **主要欄位**:
  - 關聯計劃ID、課程ID
  - 執行日期、講師ID
  - 出席人數、完成率
  - 執行狀態

#### 3. 四層評估系統

##### Level 1: 反應層評估 (Reaction Evaluations)
- **資料表**: `reaction_evaluations`
- **評估內容**: 學員滿意度調查
- **評分項目**:
  - 課程滿意度 (1-5分)
  - 講師滿意度 (1-5分)
  - 內容滿意度 (1-5分)
  - 設施滿意度 (1-5分)
  - 整體滿意度 (1-5分)

##### Level 2: 學習層評估 (Learning Evaluations)
- **資料表**: `learning_evaluations`
- **評估內容**: 測驗成績與學習成效
- **評估指標**:
  - 課前測驗成績
  - 課後測驗成績
  - 進步率
  - 通過狀態（目標：80分以上）

##### Level 3: 行為層評估 (Behavior Evaluations)
- **資料表**: `behavior_evaluations`
- **評估內容**: 工作中的應用能力
- **評分項目**:
  - 技能應用評分 (1-5分)
  - 工作品質評分 (1-5分)
  - 效率評分 (1-5分)
  - 整體行為評分 (1-5分)

##### Level 4: 成果層評估 (Result Evaluations)
- **資料表**: `result_evaluations`
- **評估內容**: 就業成效
- **評估指標**:
  - 就業狀態（已就業/未就業/求職中）
  - 就業日期
  - 職位匹配度（目標：80%以上）
  - 薪資水平
  - 雇主滿意度
  - 留任月數

#### 4. 改善行動 (Improvement Actions)
- **資料表**: `improvement_actions`
- **用途**: PDDRO體系中的成果改善階段
- **主要欄位**:
  - 問題描述
  - 根本原因分析
  - 行動計劃
  - 負責人、截止日期
  - 完成狀態、效果評分

#### 5. 數位化文件管理 (TTQS Documents)
- **資料表**: `ttqs_documents`
- **用途**: 管理TTQS相關文件
- **主要欄位**:
  - 文件類型、標題
  - 文件URL、檔案大小
  - 版本號、上傳者

## API端點

### 訓練計劃管理
```
POST   /api/v1/ttqs/plans              # 建立訓練計劃
GET    /api/v1/ttqs/plans              # 獲取訓練計劃列表
GET    /api/v1/ttqs/plans/:id          # 獲取單一訓練計劃
PUT    /api/v1/ttqs/plans/:id          # 更新訓練計劃
```

### 訓練執行追蹤
```
POST   /api/v1/ttqs/executions         # 建立執行記錄
GET    /api/v1/ttqs/executions         # 獲取執行記錄列表
PUT    /api/v1/ttqs/executions/:id     # 更新執行記錄
```

### 改善行動管理
```
POST   /api/v1/ttqs/improvements       # 建立改善行動
GET    /api/v1/ttqs/improvements       # 獲取改善行動列表
PUT    /api/v1/ttqs/improvements/:id   # 更新改善行動
```

### 四層評估
```
POST   /api/v1/evaluations/reaction    # 提交反應層評估
GET    /api/v1/evaluations/reaction    # 獲取反應層評估
POST   /api/v1/evaluations/learning    # 提交學習層評估
GET    /api/v1/evaluations/learning    # 獲取學習層評估
POST   /api/v1/evaluations/behavior    # 提交行為層評估
GET    /api/v1/evaluations/behavior    # 獲取行為層評估
POST   /api/v1/evaluations/result      # 提交成果層評估
GET    /api/v1/evaluations/result      # 獲取成果層評估
PUT    /api/v1/evaluations/result/:id  # 更新成果層評估
```

### 數位化管理與分析
```
POST   /api/v1/ttqs/documents          # 上傳TTQS文件
GET    /api/v1/ttqs/documents          # 獲取文件列表
GET    /api/v1/ttqs/dashboard          # 獲取儀表板數據
GET    /api/v1/ttqs/trends             # 獲取趨勢分析
GET    /api/v1/ttqs/compliance         # 獲取合規狀態
GET    /api/v1/ttqs/reports/:plan_id   # 生成自動化報告
```

## 前端組件

### 管理介面

#### 1. TTQS儀表板 (`TTQSDashboardView.vue`)
- **路徑**: `/admin/ttqs/dashboard`
- **功能**:
  - PDDRO體系合規狀態顯示
  - 訓練計劃概覽統計
  - 四層評估結果展示
  - 改善行動追蹤
  - 快速導航到各管理功能

#### 2. 訓練計劃管理 (`TrainingPlansView.vue`)
- **路徑**: `/admin/ttqs/plans`
- **功能**:
  - 訓練計劃列表展示
  - 新增/編輯訓練計劃
  - 狀態篩選
  - 分頁瀏覽

#### 3. 評估表單組件 (`EvaluationForm.vue`)
- **用途**: 可重用的評估表單組件
- **支援**: 四層評估的所有表單
- **特色**:
  - 星級評分系統
  - 動態表單欄位
  - 即時計算（如進步率）
  - 表單驗證

## 品質指標

### 目標達成標準

1. **反應層（滿意度）**
   - 目標：平均滿意度 ≥ 4.0/5.0
   - 回應率 ≥ 80%

2. **學習層（測驗成績）**
   - 目標：平均成績 ≥ 80分
   - 通過率 ≥ 80%

3. **行為層（應用能力）**
   - 目標：平均行為評分 ≥ 4.0/5.0
   - 評估完成率 ≥ 70%

4. **成果層（就業成效）**
   - 目標：就業率 ≥ 80%
   - 職位匹配度 ≥ 80%

### 自動化建議系統

系統會根據評估結果自動生成改善建議：

- 滿意度低於4分 → 建議改善課程內容或教學方式
- 通過率低於80% → 建議加強課前準備或調整難度
- 行為評分低於4分 → 建議增加實務操作訓練
- 就業率低於80% → 建議加強就業媒合服務

## 資料分析功能

### 1. 儀表板統計
- 即時顯示各項關鍵指標
- 視覺化圖表展示
- 多維度數據分析

### 2. 趨勢分析
- 滿意度趨勢（按月）
- 學習成效趨勢
- 就業率趨勢
- 可自訂時間範圍（預設6個月）

### 3. 合規檢查
- PDDRO各階段完成度檢查
- 整體合規率計算
- 缺失項目提醒

### 4. 自動化報告
- 完整的訓練計劃報告
- 包含所有四層評估數據
- 自動生成改善建議
- 支援匯出功能

## 使用流程

### 管理員操作流程

1. **建立訓練計劃**
   - 進入訓練計劃管理頁面
   - 填寫計劃基本資訊
   - 設定訓練目標和對象

2. **記錄訓練執行**
   - 為計劃建立執行記錄
   - 關聯課程和講師
   - 記錄出席和完成情況

3. **收集評估數據**
   - Level 1: 學員填寫滿意度調查
   - Level 2: 記錄測驗成績
   - Level 3: 評估工作表現
   - Level 4: 追蹤就業成效

4. **分析與改善**
   - 查看儀表板統計
   - 分析趨勢數據
   - 建立改善行動
   - 追蹤改善效果

5. **生成報告**
   - 選擇訓練計劃
   - 生成完整報告
   - 檢視改善建議
   - 匯出報告文件

## 資料庫遷移

執行以下命令以建立TTQS相關資料表：

```bash
# 執行遷移腳本
npm run migrate

# 或使用特定遷移檔案
psql -d your_database -f src/database/migrations/008_create_ttqs_tables.sql
```

## 注意事項

1. **資料完整性**
   - 確保所有評估數據完整記錄
   - 定期備份TTQS相關資料

2. **隱私保護**
   - 評估數據僅限授權人員查看
   - 個人資料需符合隱私法規

3. **持續改善**
   - 定期檢視改善行動執行狀況
   - 根據數據分析調整訓練策略

4. **合規要求**
   - 確保PDDRO各階段完整執行
   - 保留完整的文件記錄

## 未來擴展

1. **進階分析**
   - 機器學習預測模型
   - 更多視覺化圖表
   - 自訂報表功能

2. **整合功能**
   - 與課程系統深度整合
   - 自動化評估提醒
   - 行動裝置支援

3. **外部整合**
   - 政府TTQS系統對接
   - 第三方評估工具整合
   - 資料匯出標準化

## 技術支援

如有問題或需要協助，請聯繫系統管理員或參考以下資源：

- TTQS官方網站: https://ttqs.wda.gov.tw/
- 系統文檔: `/docs`
- API文檔: `/api/v1/info`
