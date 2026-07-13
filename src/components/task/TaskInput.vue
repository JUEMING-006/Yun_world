<script setup lang="ts">
/**
 * TaskInput —— 底部操作栏
 *
 * 场景：
 *  - 待办 tab：左侧输入框 + 右侧麦克风（语音）+ 加号（展开任务添加卡片）
 *  - 闪念 tab：左侧输入框 + 右侧麦克风（语音）+ 换行保存（回车）
 *
 * TODO:
 *  - 点击 '+' 展开任务添加模态卡（含截止时间、优先级）
 *  - 语音录入后自动润色（若 settings.ai_voice_polish_enabled）
 *  - 闪念的 AI 整理触发点在 FlashCard，不在此处
 */
import { ref, computed, nextTick } from 'vue'
import { useTauriCommands } from '@/composables/useTauriCommands'
import { useTaskStore } from '@/stores/taskStore'
import { useFlashStore } from '@/stores/flashStore'
import { useVoice } from '@/composables/useVoice'
import { useAI } from '@/composables/useAI'
import { useSettingsStore } from '@/stores/settingsStore'
import type { PanelTab, NewTask } from '@/types'

const props = defineProps<{ tab: PanelTab }>()

const emit = defineEmits<{
  (e: 'open-add-modal'): void
}>()

const { createTask, createFlashNote } = useTauriCommands()
const taskStore = useTaskStore()
const flashStore = useFlashStore()
const { isListening, transcript, interimTranscript, start, stop, clear } = useVoice()
const { loading: aiLoading, polish } = useAI()
const settings = useSettingsStore()

const inputText = ref('')
const expanded = ref(false)

/** 输入框高度自适应（最多 3 行） */
const textareaRef = ref<HTMLTextAreaElement | null>(null)

async function submitText() {
  const text = inputText.value.trim()
  if (!text) return

  if (props.tab === 'flash') {
    await flashStore.add(text, 'text')
  } else {
    // TODO(Phase 4): 模态卡确认后再实际 createTask，
    //   这里暂以默认值创建，实际交互需弹模态确认。
    try {
      await taskStore.add({
        title: text,
        source: 'manual',
      })
    } catch {
      /* parent handled */
    }
  }
  inputText.value = ''
  expanded.value = false
}

async function submitVoice() {
  const raw = transcript.value.trim()
  if (!raw) return

  if (props.tab === 'flash') {
    await flashStore.add(raw, 'voice')
    clear()
    return
  }

  // 待办：语音识别后，若开启 AI 润色则先润色再填入
  let finalText = raw
  if (settings.settings.ai_voice_polish_enabled) {
    finalText = await polish(raw)
  }
  inputText.value = finalText
  clear()
}

/** 切换语音 */
function toggleVoice() {
  if (isListening.value) {
    stop()
    // 识别结束，提交
    void submitVoice()
  } else {
    start()
  }
}

/** 回车提交；Shift+Enter 换行 */
function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    void submitText()
  }
}
</script>

<template>
  <div class="task-input" :class="{ expanded }">
    <textarea
      ref="textareaRef"
      v-model="inputText"
      class="input-field"
      :placeholder="tab === 'flash' ? '快速闪念…' : '添加任务…'"
      :rows="expanded ? 3 : 1"
      @keydown="onKeyDown"
    />

    <div class="input-actions">
      <button
        class="action-btn voice-btn"
        :class="{ listening: isListening }"
        :title="isListening ? '停止录音' : '语音输入'"
        @click="toggleVoice"
      >
        <span v-if="isListening" class="ripple-ring" />
        🎙️
      </button>

      <button
        v-if="tab === 'todo'"
        class="action-btn add-btn"
        title="添加任务"
        @click="() => emit('open-add-modal')"
      >
        ＋
      </button>
    </div>
  </div>
</template>

<style scoped>
.task-input {
  display: flex;
  gap: var(--space-sm);
  align-items: flex-end;
}

.input-field {
  flex: 1 1 auto;
  min-height: 32px;
  max-height: 80px;
  padding: var(--space-sm) var(--space-md);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 13px;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: border-color var(--duration-fast);
  font-family: inherit;
}
.input-field::placeholder {
  color: var(--text-tertiary);
}
.input-field:focus {
  border-color: var(--glass-border-strong);
}

.input-actions {
  flex: 0 0 auto;
  display: flex;
  gap: var(--space-sm);
}

.action-btn {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--glass-bg-strong);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border-strong);
  color: var(--text-primary);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all var(--duration-fast);
}
.action-btn:hover {
  background: rgba(255, 255, 255, 0.22);
}

.voice-btn.listening {
  color: #ff4444;
  border-color: rgba(255, 68, 68, 0.5);
  animation: voice-active 1.2s ease-in-out infinite;
}

@keyframes voice-active {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(255, 68, 68, 0); }
}

.ripple-ring {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-full);
  border: 2px solid rgba(255, 68, 68, 0.4);
  animation: voice-ripple 1.5s ease-out infinite;
  pointer-events: none;
}

.add-btn {
  background: linear-gradient(135deg, rgba(80, 160, 255, 0.3), rgba(60, 120, 255, 0.2));
  border-color: rgba(80, 160, 255, 0.45);
  font-size: 18px;
  font-weight: 600;
}
.add-btn:hover {
  background: linear-gradient(135deg, rgba(80, 160, 255, 0.5), rgba(60, 120, 255, 0.35));
}
</style>
