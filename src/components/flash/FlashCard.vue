<script setup lang="ts">
/**
 * FlashCard —— 闪念卡片
 *
 * 特性：无复选框、无截止时间、无优先级，纯文本备忘。
 * 每条闪念右下角有 ✨ AI 整理按钮（仅在 aiConfigured 时亮起）。
 * 点击 AI 整理后触发父组件打开预览卡（AiPreviewCard）。
 */
import { computed } from 'vue'
import type { FlashNote } from '@/types'

const props = defineProps<{
  note: FlashNote
  aiAvailable: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'ai-organize', id: number): void
  (e: 'delete', id: number): void
}>()

const isProcessed = computed(() => props.note.is_processed)
const isTransferred = computed(() => props.note.transferred_to !== null)
</script>

<template>
  <div class="flash-card glass-card animate-fade-in-up">
    <p class="flash-content">{{ note.content }}</p>
    <div class="flash-footer">
      <span class="flash-tag">
        {{ isTransferred ? '✅ 已转任务' : isProcessed ? '✨ AI 整理过' : note.source === 'voice' ? '🎙️ 语音' : '📝' }}
      </span>

      <div class="flash-actions">
        <!-- AI 整理按钮 -->
        <button
          v-if="!isProcessed && !isTransferred"
          class="ai-btn"
          :disabled="!aiAvailable || loading"
          :title="aiAvailable ? '✨ AI 整理为任务' : '请先在设置中配置大模型'"
          @click.stop="emit('ai-organize', note.id)"
        >
          ✨ AI 整理
        </button>

        <button class="delete-btn" title="删除" @click.stop="emit('delete', note.id)">
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flash-card {
  padding: var(--space-md);
  margin-bottom: var(--space-sm);
}

.flash-content {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.6;
  word-break: break-word;
}

.flash-footer {
  margin-top: var(--space-sm);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flash-tag {
  font-size: 11px;
  color: var(--text-tertiary);
}

.flash-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.ai-btn {
  font-size: 11px;
  padding: 3px 10px;
  border: none;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, rgba(180, 120, 255, 0.3), rgba(140, 80, 240, 0.2));
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: all var(--duration-fast);
  border: 1px solid rgba(180, 120, 255, 0.4);
}
.ai-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(180, 120, 255, 0.5), rgba(140, 80, 240, 0.4));
}
.ai-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.delete-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 12px;
  cursor: pointer;
  border-radius: var(--radius-sm);
}
.delete-btn:hover {
  background: rgba(255, 56, 56, 0.2);
  color: var(--color-level-4);
}
</style>
