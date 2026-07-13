<script setup lang="ts">
/**
 * FlashList —— 闪念列表容器
 *
 * 列表项为 FlashCard；每条卡片可触发 AI 整理。
 * 整理成功后在卡片下方弹出 AiPreviewCard 确认。
 */
import { ref, computed } from 'vue'
import type { OrganizedTask } from '@/types'
import FlashCard from './FlashCard.vue'
import AiPreviewCard from './AiPreviewCard.vue'
import { useFlashStore } from '@/stores/flashStore'
import { useAI } from '@/composables/useAI'
import { useSettingsStore } from '@/stores/settingsStore'

const flashStore = useFlashStore()
const settingsStore = useSettingsStore()
const { aiAvailable, aiOrganizeFlash } = useAI()

const previewForId = ref<number | null>(null) // 当前正在展示预览卡的闪念 ID
const organizingId = ref<number | null>(null) // 正在调用 AI 的闪念 ID
const previewData = ref<{ original: string; organized: OrganizedTask } | null>(null)

function isOrganizing(id: number) {
  return organizingId.value === id
}
const showingPreview = computed(() => previewForId.value !== null)

async function onAiOrganize(id: number) {
  const note = flashStore.list.find((n) => n.id === id)
  if (!note) return
  organizingId.value = id
  try {
    const result = await aiOrganizeFlash(note.content)
    if (result) {
      previewData.value = { original: note.content, organized: result }
      previewForId.value = id
    }
  } finally {
    organizingId.value = null
  }
}

function onConfirm() {
  if (previewData.value && previewForId.value !== null) {
    void flashStore.transferToTask(previewForId.value, previewData.value.organized)
  }
  closePreview()
}

function closePreview() {
  previewForId.value = null
  previewData.value = null
}
</script>

<template>
  <div class="flash-list">
    <p v-if="!flashStore.list.length" class="empty-hint">还没有闪念，使用语音或键盘输入吧</p>

    <template v-else>
      <FlashCard
        v-for="note in flashStore.list"
        :key="note.id"
        :note="note"
        :ai-available="aiAvailable()"
        :loading="isOrganizing(note.id)"
        @ai-organize="onAiOrganize"
        @delete="(id) => flashStore.remove(id)"
      />

      <!-- AI 整理预览卡（紧随目标卡片下方） -->
      <AiPreviewCard
        v-if="showingPreview && previewData"
        :original-content="previewData.original"
        :organized="previewData.organized"
        @confirm="onConfirm"
        @cancel="closePreview"
      />
    </template>
  </div>
</template>

<style scoped>
.flash-list {
  display: flex;
  flex-direction: column;
}
.empty-hint {
  text-align: center;
  color: var(--text-tertiary);
  font-size: 13px;
  padding: var(--space-xl) 0;
}
</style>
