<script setup lang="ts">
import { RouterView } from 'vue-router'

import AppFooter from './components/layout/AppFooter.vue'
import AppHeader from './components/layout/AppHeader.vue'
</script>

<template>
  <div id="app">
    <AppHeader />
    <main class="main-content">
      <RouterView v-slot="{ Component, route }">
        <KeepAlive :include="route.meta?.keepAlive ? [route.name as string] : []">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: 2rem;
  padding-bottom: 2rem;
}
</style>
