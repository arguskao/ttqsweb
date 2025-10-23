<template>
  <div class="container">
    <div class="section">
      <div class="columns">
        <div class="column is-8 is-offset-2">
          <div class="content">
            <h1 class="title is-2 has-text-centered">訓練政策</h1>
            <div class="box">
              <h2 class="title is-4">核心原則</h2>
              <div class="content">
                <ul>
                  <li>
                    <strong>職能導向</strong
                    >：以實際工作需求為導向，培養學員具備藥局助理所需的核心職能
                  </li>
                  <li><strong>實務結合</strong>：理論與實務並重，提供真實工作環境的實習機會</li>
                  <li><strong>就業媒合</strong>：建立完整的就業媒合機制，確保學員順利轉職</li>
                </ul>
              </div>
            </div>

            <div class="box">
              <h2 class="title is-4">訓練目標</h2>
              <div class="content">
                <ul>
                  <li><strong>轉職成功率</strong>：目標80%以上</li>
                  <li><strong>合作單位擴展</strong>：每年新增10家合作藥局</li>
                  <li><strong>學習成效</strong>：學員職能測驗平均達80分</li>
                  <li><strong>滿意度指標</strong>：學員滿意度維持4.0分以上（5分制）</li>
                </ul>
              </div>
            </div>

            <div class="box">
              <h2 class="title is-4">品質保證</h2>
              <div class="content">
                <ul>
                  <li><strong>PDDRO體系</strong>：計劃、設計、執行、評估、改善的完整循環</li>
                  <li><strong>四層評估</strong>：反應層、學習層、行為層、成果層的全面評估</li>
                  <li><strong>講師評鑑</strong>：滿意度80分以下講師退場機制</li>
                  <li><strong>持續改善</strong>：年度檢討會議與改進機制</li>
                </ul>
              </div>
            </div>

            <div class="box">
              <h2 class="title is-4">課程架構</h2>
              <div class="content">
                <div class="columns">
                  <div class="column">
                    <h3 class="title is-5">基礎職能</h3>
                    <ul>
                      <li>藥學入門</li>
                      <li>庫存管理</li>
                      <li>溝通技巧</li>
                      <li>職場倫理</li>
                    </ul>
                  </div>
                  <div class="column">
                    <h3 class="title is-5">進階實務</h3>
                    <ul>
                      <li>保健食品</li>
                      <li>處方箋辨識</li>
                      <li>櫃台管理</li>
                      <li>醫療法規</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div class="box">
              <h2 class="title is-4">師資來源</h2>
              <div class="content">
                <ul>
                  <li><strong>專業藥師</strong>：具備豐富臨床經驗的執業藥師</li>
                  <li><strong>資深助理</strong>：擁有多年藥局實務經驗的助理</li>
                  <li><strong>產業專家</strong>：醫藥產業相關領域的專業人士</li>
                </ul>
              </div>
            </div>

            <div class="box">
              <h2 class="title is-4">後續支援</h2>
              <div class="content">
                <ul>
                  <li><strong>學員群組</strong>：建立學員交流平台，持續提供支援</li>
                  <li><strong>練習場地</strong>：提供課後練習場地與再培訓機會</li>
                  <li><strong>講師發展</strong>：鼓勵優秀學員成為講師，建立人才循環</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  document.title = '訓練政策 - 藥助Next學院'
})
</script>

<style scoped>
.box {
  margin-bottom: 2rem;
}

.title {
  color: #3273dc;
}

.content ul li {
  margin-bottom: 0.5rem;
}
</style>
