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
            <ul>
              <li><router-link to="/courses">課程介紹</router-link></li>
              <li><router-link to="/jobs">就業媒合</router-link></li>
              <li><router-link to="/documents">文件下載</router-link></li>
            </ul>
          </div>
          <div class="column">
            <h6 class="title is-6">聯絡我們</h6>
            <p>
              📧 wii543@gmail.com
            </p>
            <p>
              📞 (06)-290-6741
            </p>
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
