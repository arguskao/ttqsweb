<template>
  <footer class="footer">
    <div class="content has-text-centered">
      <div class="container">
        <div class="columns">
          <div class="column">
            <h5 class="title is-5">藥助Next學院</h5>
            <p>專業藥局助理轉職教育平台</p>
          </div>
          <div class="column">
            <h6 class="title is-6">快速連結</h6>
            <div class="columns is-multiline">
              <div class="column is-4">
                <ul class="footer-links">
                  <li><router-link to="/courses">課程介紹</router-link></li>
                  <li><router-link to="/jobs">就業媒合</router-link></li>
                  <li><router-link to="/documents">文件下載</router-link></li>
                </ul>
              </div>
              <div class="column is-4">
                <ul class="footer-links">
                  <li><router-link to="/training/policy">訓練政策</router-link></li>
                  <li><router-link to="/training/quality">訓練品質</router-link></li>
                  <li><router-link to="/training/performance">訓練績效</router-link></li>
                </ul>
              </div>
              <div class="column is-4">
                <ul class="footer-links">
                  <li><router-link to="/training/development">訓練發展方向</router-link></li>
                  <li><router-link to="/training/objectives">訓練目標</router-link></li>
                  <li><router-link to="/training/courses">訓練發展重點課程</router-link></li>
                </ul>
              </div>
            </div>
          </div>
          <div class="column">
            <h6 class="title is-6">聯絡我們</h6>
            <p>📧 wii543@gmail.com</p>
            <p>📞 (06)-290-6741</p>
          </div>
        </div>
        <hr />
        <p>&copy; {{ currentYear }} 藥助Next學院. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.footer-links li {
  white-space: nowrap;
  overflow: visible;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.footer-links a {
  display: block;
  white-space: nowrap;
  font-size: 0.9rem;
  padding: 0.25rem 0;
  color: #3273dc;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-links a:hover {
  color: #2366d1;
  text-decoration: underline;
}

/* 確保在小螢幕上也能正常顯示 */
@media screen and (max-width: 768px) {
  .footer-links li {
    white-space: normal;
    overflow: visible;
  }

  .footer-links a {
    white-space: normal;
    font-size: 0.85rem;
  }
}

/* 針對第三欄的長文字進行特別處理 */
.columns .column:last-child .footer-links a {
  font-size: 0.85rem;
  line-height: 1.3;
}

@media screen and (max-width: 1024px) {
  .columns .column:last-child .footer-links a {
    font-size: 0.8rem;
  }
}
</style>
