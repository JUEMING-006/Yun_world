<script setup lang="ts">
/**
 * AiPreviewCard —— AI 整理结果确认卡
 *
 * 显示：原文、AI 提取的任务描述、建议截止时间、建议优先级。
 * 操作：[移至待办] 调用 flashStore.transferToTask / [取消]
 *
 * 本组件在父组件中使用 v-show 或 v-if 展开，无对外动画，
 * 父组件控制 transition。
 */
import { computed } from 'vue'
import type { OrganizedTask } from '@/types'

const props = defineProps<{
  originalContent: string
  organized: OrganizedTask
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const priorityIcon = computed(() => {
  return { low: '🟢 低', medium: '🟡 中', high: '🔴 高' }[props.organized.priority]
})

const deadlineText = computed(() => {
  return props.organized.deadline
    ? props.organized.deadline.replace('T', ' ').slice(0, 16)
    : '未指定'
})
</script>

<template>
  <div class="ai-preview glass-panel animate-fade-in-up">
    <div class="preview-header">
      <span class="preview-title">✨ AI 整理结果</span>
    </div>

    <div class="preview-body">
      <div class="preview-row">
        <span class="preview-label">原文</span>
        <p class="preview-text">{{ originalContent }}</p>
      </div>
      <div class="preview-divider" />
      <div class="preview-row">
        <span class="preview-label">任务</span>
        <p class="preview-text highlight">{{ organized.task }}</p>
      </div>
      <div class="preview-row">
        <span class="preview-label">截止</span>
        <p class="preview-text">{{ deadlineText }}</p>
      </div>
      <div class="preview-row">
        <span class="preview-label">优先级</span>
        <p class="preview-text">{{ priorityIcon }}</p>
      </div>
    </div>

    <div class="preview-actions">
      <button class="btn-cancel" @click="emit('cancel')">取消</button>
      <button class="btn-confirm" @click="emit('confirm')">✅ 移至待办</button>
    </div>
  </div>
</template>

<style scoped>
.ai-preview {
  padding: var(--space-md);
}

.preview-header {
  margin-bottom: var(--space-sm);
}

.preview-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(180, 120, 255, 0.95);
}

.preview-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.preview-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.preview-label {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
}
.preview-text.highlight {
  color: var(--text-primary);
  font-weight: 600;
}

.preview-divider {
  height: 1px;
  background: var(--glass-border);
  margin: var(--space-xs) 0;
}

.preview-actions {
  margin-top: var(--space-md);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

.btn-cancel,
.btn-confirm {
  padding: var(--space-sm) var(--space-lg);
  border: none;
  border-radius: var(--radius-full);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--duration-fast);
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
}
.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-confirm {
  background: linear-gradient(135deg, rgba(100, 180, 255, 0.4), rgba(80, 140, 255, 0.3));
  color: white;
  border: 1px solid rgba(100, 180, 255, 0.5);
}
.btn-confirm:hover {
  background: linear-gradient(135deg, rgba(100, 180, 255, 0.55), rgba(80, 140, 255, 0.45));
}
</style>
