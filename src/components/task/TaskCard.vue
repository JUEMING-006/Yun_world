<script setup lang="ts">
/**
 * TaskCard —— 单个任务卡片
 *
 * 视觉：
 *  - 左侧竖线颜色 = color_level 对应预警色
 *  - 优先级用小圆点标记（low/medium/high）
 *  - 待办：空心方框；存档：打钩方框
 *  - 打钩后：滑出动画（由父组件触发移除）
 */
import { computed } from 'vue'
import type { Task } from '@/types'

const props = defineProps<{
  task: Task
  /** 是否已勾选（存档列表传入 true） */
  checked?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle', id: number): void
  (e: 'delete', id: number): void
}>()

const levelClass = computed(() => `level-${props.task.color_level}`)
const priorityClass = computed(() => `priority-${props.task.priority}`)

const priorityLabel = computed(() => {
  return { low: '🟢 低', medium: '🟡 中', high: '🔴 高' }[props.task.priority]
})

const deadlineText = computed(() => {
  if (!props.task.deadline) return ''
  // 简易展示：取 'YYYY-MM-DD HH:mm' 部分
  return props.task.deadline.replace('T', ' ').slice(0, 16)
})
</script>

<template>
  <div class="task-card glass-card" :class="[levelClass, priorityClass]">
    <!-- 左侧颜色竖条（预警色） -->
    <span class="color-bar" />

    <button
      class="checkbox"
      :class="{ checked }"
      :title="checked ? '点击恢复到待办' : '点击完成'"
      @click="emit('toggle', task.id)"
    >
      <svg v-if="checked" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
        <path d="M5 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <div class="task-content">
      <div class="task-title" :class="{ done: checked }">{{ task.title }}</div>
      <div v-if="task.description" class="task-desc">{{ task.description }}</div>
      <div class="task-meta">
        <span v-if="deadlineText" class="meta-deadline">⏰ {{ deadlineText }}</span>
        <span class="meta-priority">{{ priorityLabel }}</span>
      </div>
    </div>

    <button class="delete-btn" title="删除" @click.stop="emit('delete', task.id)">✕</button>
  </div>
</template>

<style scoped>
.task-card {
  display: flex;
  align-items: stretch;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-md) var(--space-md) 0;
  margin-bottom: var(--space-sm);
  position: relative;
  overflow: hidden;
}

.color-bar {
  flex: 0 0 auto;
  width: 3px;
  border-radius: 2px;
  background: var(--level-color);
  margin-right: var(--space-sm);
}

.checkbox {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  border: 1.5px solid var(--text-secondary);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  transition: all var(--duration-fast);
}
.checkbox.checked {
  background: var(--priority-color);
  border-color: var(--priority-color);
  color: white;
}
.checkbox:hover {
  border-color: var(--text-primary);
}

.task-content {
  flex: 1 1 auto;
  min-width: 0;
}

.task-title {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.4;
  word-break: break-word;
}
.task-title.done {
  text-decoration: line-through;
  color: var(--text-tertiary);
}

.task-desc {
  margin-top: 2px;
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.task-meta {
  margin-top: var(--space-xs);
  display: flex;
  gap: var(--space-md);
  font-size: 11px;
  color: var(--text-tertiary);
}
.meta-deadline {
  color: var(--level-color);
}

.delete-btn {
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 12px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  opacity: 0;
  transition: all var(--duration-fast);
  align-self: flex-start;
}
.task-card:hover .delete-btn {
  opacity: 1;
}
.delete-btn:hover {
  background: rgba(255, 56, 56, 0.2);
  color: var(--color-level-4);
}
</style>
