<script setup lang="ts">
/**
 * App.vue —— 根组件
 * 单窗口 Tauri 应用：根据 windowStore.mode 在「水滴态」与「展开态面板」间切换。
 * 不引入 vue-router，靠 v-show 控制（避免重建组件丢失状态）。
 */
import { onMounted } from 'vue'
import { useWindowStore } from '@/stores/windowStore'
import DropletView from '@/views/DropletView.vue'
import PanelView from '@/views/PanelView.vue'

const windowStore = useWindowStore()

onMounted(async () => {
  // 启动时初始化窗口形态（默认水滴态）、应用毛玻璃效果、注册定时器事件监听
  await windowStore.init()
})
</script>

<template>
  <div class="app-root" :class="[`level-${windowStore.urgencyLevel}`]">
    <!-- 水滴态：常态悬浮按钮 -->
    <DropletView v-show="windowStore.mode === 'droplet'" />

    <!-- 展开态：液态玻璃主面板 -->
    <PanelView v-show="windowStore.mode === 'panel'" />
  </div>
</template>

<style scoped>
.app-root {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
