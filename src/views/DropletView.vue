<script setup lang="ts">
/**
 * DropletView —— 水滴态视图
 *
 * 常态：桌面悬浮一颗 60x60 圆形按钮，半透明液态玻璃质感。
 * 颜色随 urgencyLevel 变化（灰白 -> 绿 -> 黄 -> 橙 -> 红）。
 * 点击展开为面板；红色等级时 Rust 定时器会自动触发展开（已自动应用 urgent-pulse）。
 * 可拖拽移动（位置记忆）。
 */
import { computed } from 'vue'
import { useWindowStore } from '@/stores/windowStore'

const windowStore = useWindowStore()

const levelClass = computed(() => `level-${windowStore.urgencyLevel}`)
const isUrgent = computed(() => windowStore.urgencyLevel >= 4)

function onClick() {
  void windowStore.expand()
}

// TODO(Phase 3): 接入 Tauri startDragging API 实现水滴拖拽
//   import { getCurrentWindow } from '@tauri-apps/api/window'
//   function onDragStart() { getCurrentWindow().startDragging() }
// TODO(Phase 3): 拖拽结束后调用 savePosition 持久化坐标
</script>

<template>
  <div class="droplet-wrapper" :class="levelClass">
    <button
      class="droplet glass-button glass-glare animate-breathe"
      :class="{ 'animate-urgent': isUrgent }"
      :style="{ '--droplet-color': 'var(--level-color)' }"
      title="FloatTask"
      @click="onClick"
    >
      <!-- 极简线条图标：清单 -->
      <svg class="droplet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 6h11M9 12h11M9 18h11" stroke-linecap="round" />
        <circle cx="4" cy="6" r="1.2" fill="currentColor" />
        <circle cx="4" cy="12" r="1.2" fill="currentColor" />
        <circle cx="4" cy="18" r="1.2" fill="currentColor" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.droplet-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.droplet {
  width: var(--droplet-size);
  height: var(--droplet-size);
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 30%,
    rgba(255, 255, 255, 0.4),
    var(--droplet-color, rgba(255, 255, 255, 0.15)) 70%
  );
  /* 内部颜色叠加预警色 */
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.5),
    0 4px 16px rgba(0, 0, 0, 0.18);
  color: rgba(255, 255, 255, 0.95);
}

.droplet-icon {
  width: 26px;
  height: 26px;
}
</style>
