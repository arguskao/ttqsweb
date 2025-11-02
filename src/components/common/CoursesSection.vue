<template>
  <section class="annual-commitment-section">
    <div class="container">
      <h2 class="section-title">年度承諾</h2>
      <div class="commitments-grid">
        <!-- 專業培育承諾 -->
        <div class="commitment-card">
          <div class="commitment-header">
            <span class="commitment-icon">🎓</span>
            <h3 class="commitment-title">專業培育承諾</h3>
          </div>
          <ul class="commitment-list">
            <li>
              提供符合產業需求的課程設計，內容涵蓋藥品管理、顧客服務、職場倫理及藥局作業流程。
            </li>
            <li>
              所有授課講師均具備相關專業背景與實務經驗，確保教學品質與職能接軌。
            </li>
            <li>
              定期檢視課程內容，配合法規更新與藥事政策調整，維持教學之時效性與正確性。
            </li>
          </ul>
        </div>

        <!-- 就業媒合承諾 -->
        <div class="commitment-card">
          <div class="commitment-header">
            <span class="commitment-icon">💼</span>
            <h3 class="commitment-title">就業媒合承諾</h3>
          </div>
          <ul class="commitment-list">
            <li>
              透過與藥局、連鎖藥妝通路及藥師公會的合作，提供實習及就業媒合機會。
            </li>
            <li>
              建立「學員履歷資料庫」與「合作藥局職缺平台」，協助學員快速銜接職場。
            </li>
            <li>
              追蹤學員轉職成果與工作滿意度，作為後續訓練品質改善依據。
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// 組件不再需要外部導入或數據
</script>

<style scoped>
.annual-commitment-section {
  padding: 60px 0;
  background-color: #f9fafb;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 48px;
  line-height: 1.2;
}

.commitments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 40px;
  max-width: 1100px;
  margin: 0 auto;
}

.commitment-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.commitment-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.commitment-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.commitment-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.commitment-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.commitment-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.commitment-list li {
  position: relative;
  padding-left: 28px;
  margin-bottom: 16px;
  line-height: 1.8;
  color: #4b5563;
  font-size: 1rem;
}

.commitment-list li:last-child {
  margin-bottom: 0;
}

.commitment-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #3b82f6;
  font-size: 1.5rem;
  font-weight: bold;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .annual-commitment-section {
    padding: 40px 0;
  }

  .section-title {
    font-size: 2rem;
    margin-bottom: 32px;
  }

  .commitments-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .commitment-card {
    padding: 24px;
  }

  .commitment-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .commitment-icon {
    font-size: 2rem;
  }

  .commitment-title {
    font-size: 1.5rem;
  }

  .commitment-list li {
    font-size: 0.95rem;
    padding-left: 24px;
  }
}

@media (max-width: 480px) {
  .commitments-grid {
    grid-template-columns: 1fr;
  }

  .commitment-card {
    padding: 20px;
  }
}
</style>
