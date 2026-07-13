<script setup lang="ts">
/**
 * TabBar —— 三标签切换（待办 / 存档 / 闪念）
 * 下划线高亮跟随选中项滑动。
 */
import { computed } from 'vue'
import type { PanelTab } from '@/types'

const props = defineProps<{ modelValue: PanelTab }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: PanelTab): void }>()

const tabs: { key: PanelTab; label: string }[] = [
  { key: 'todo', label: '待办' },
  { key: 'archive', label: '存档' },
  { key: 'flash', label: '闪念' },
]

const activeIndex = computed(() => tabs.findIndex((t) => t.key === props.modelValue))

function select(key: PanelTab) {
  emit('update:modelValue', key)
}
</script>

<template>
  <nav class="tabbar">
    <button
      v-for="t in tabs"
      :key="t.key"
      class="tab-item"
      :class="{ active: t.key === modelValue }"
      @click="select(t.key)"
    >
      {{ t.label }}
    </button>
    <span class="tab-indicator" :style="{ transform: `translateX(${activeIndex * 100}%)` }" />
  </nav>
</template>

<style scoped>
.tabbar {
  flex: 0 0 auto;
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 0 var(--space-lg);
  border-bottom: 1px solid var(--glass-border);
}

.tab-item {
  padding: var(--space-md) 0;
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  font-size: 13px;
  cursor: pointer;
  transition: color var(--duration-fast);
  position: relative;
  z-index: 1;
}
.tab-item:hover {
  color: var(--text-secondary);
}
.tab-item.active {
  color: var(--text-primary);
  font-weight: 600;
}

.tab-indicator {
  position: absolute;
  bottom: -1px;
  left: var(--space-lg);
  width: calc((100% - 2 * var(--space-lg)) / 3);
  height: 2px;
  background: var(--text-primary);
  border-radius: 1px;
  transition: transform var(--duration-base) var(--ease-glass);
}
</style>
