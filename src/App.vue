<template>
  <div id="app">
    <Navbar />
    <main class="main-content">
      <router-view />
    </main>
    <footer class="footer">
      <p>&copy; 2025 Zhang Yuyang. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import { provideLanguage } from './composables/useLanguage'
import { usePageTracking } from './composables/usePageTracking'

// 提供语言功能给所有子组件，并获取翻译函数用于当前组件
const { t } = provideLanguage()

// 全局页面追踪（自动追踪所有页面的停留时长和滚动深度）
const route = useRoute()
usePageTracking()
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 0 0 2rem 0;
}

.footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  color: var(--text-light);
  text-align: center;
  padding: 1.5rem;
  margin-top: auto;
}

@media (max-width: 768px) {
  .main-content {
    padding: 0 0 1rem 0;
  }
}
</style>
