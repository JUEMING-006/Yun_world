<script setup lang="ts">
/**
 * SettingsView —— 设置浮层（模态卡片）
 *
 * 布局：
 *  - AI 配置卡片（API url / key / model + 测试连接 + 功能开关）
 *  - 通用设置（提醒检查间隔 / TODO: 开机自启）
 *
 * @emits close
 */
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAI } from '@/composables/useAI'
import { setSetting } from '@/composables/useTauriCommands'

const settingsStore = useSettingsStore()
const { aiAvailable, testConnection, loading } = useAI()

const emit = defineEmits<{
  (e: 'close'): void
}>()

/** 临时表单（还没 save 时展示） */
const apiUrl = ref(settingsStore.settings.ai_api_url)
const apiKey = ref(settingsStore.settings.ai_api_key)
const modelName = ref(settingsStore.settings.ai_model_name)
const voicePolishEnabled = ref(settingsStore.settings.ai_voice_polish_enabled)
const flashOrganizeEnabled = ref(settingsStore.settings.ai_flash_organize_enabled)

const connectionOk = ref(false)
const connectionMsg = ref('')

async function onSave() {
  try {
    await setSetting('ai_api_url', apiUrl.value)
    await setSetting('ai_api_key', apiKey.value)
    await setSetting('ai_model_name', modelName.value)
    await setSetting('ai_voice_polish_enabled', String(voicePolishEnabled.value ? 1 : 0))
    await setSetting('ai_flash_organize_enabled', String(flashOrganizeEnabled.value ? 1 : 0))
    // 同步到 store
    settingsStore.settings = {
      ...settingsStore.settings,
      ai_api_url: apiUrl.value,
      ai_api_key: apiKey.value,
      ai_model_name: modelName.value,
      ai_voice_polish_enabled: voicePolishEnabled.value,
      ai_flash_organize_enabled: flashOrganizeEnabled.value,
    }
    emit('close')
  } catch (e) {
    console.error('保存设置失败:', e)
  }
}

async function onTestConnection() {
  connectionOk.value = false
  connectionMsg.value = ''
  const result = await testConnection(apiUrl.value, apiKey.value, modelName.value)
  connectionOk.value = result.ok
  connectionMsg.value = result.message
}

function onOverlayClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('settings-overlay')) {
    emit('close')
  }
}
</script>

<template>
  <div class="settings-overlay" @click="onOverlayClick">
    <div class="settings-modal glass-panel animate-fade-in-up" @click.stop>
      <!-- 标题 -->
      <header class="settings-header">
        <h2>⚙️ 设置</h2>
        <button class="close-btn" @click="emit('close')">✕</button>
      </header>

      <!-- AI 配置卡片 -->
      <section class="settings-section">
        <h3 class="section-title">大模型接口配置</h3>

        <div class="form-group">
          <label>API 地址</label>
          <input
            v-model="apiUrl"
            type="text"
            class="form-input"
            placeholder="https://api.openai.com/v1"
          />
        </div>

        <div class="form-group">
          <label>API Key</label>
          <input
            v-model="apiKey"
            type="password"
            class="form-input"
            placeholder="sk-..."
          />
        </div>

        <div class="form-group">
          <label>模型名称</label>
          <input
            v-model="modelName"
            type="text"
            class="form-input"
            placeholder="gpt-4o-mini"
          />
        </div>

        <!-- 测试连接 -->
        <div class="test-connection">
          <button class="glass-button test-btn" :disabled="loading" @click="onTestConnection">
            {{ loading ? '测试中…' : '🔗 测试连接' }}
          </button>
          <span v-if="connectionOk" class="conn-ok">✅ {{ connectionMsg }}</span>
          <span v-if="connectionOk === false && connectionMsg" class="conn-fail">
            ❌ {{ connectionMsg }}
          </span>
        </div>

        <!-- 功能开关 -->
        <div class="toggles">
          <label class="toggle-row">
            <span>语音转写智能润色</span>
            <input
              v-model="voicePolishEnabled"
              type="checkbox"
              class="toggle-checkbox"
            />
          </label>
          <label class="toggle-row">
            <span>闪念 AI 自动整理</span>
            <input
              v-model="flashOrganizeEnabled"
              type="checkbox"
              class="toggle-checkbox"
            />
          </label>
        </div>
      </section>

      <!-- 通用设置 -->
      <section class="settings-section">
        <h3 class="section-title">通用设置</h3>
        <p class="hint">提醒检查间隔：{{ settingsStore.settings.timer_interval_seconds }} 秒</p>
        <!-- TODO(Phase 5): 开机自启、重绘间隔等可配置项 -->
      </section>

      <!-- 底部 -->
      <footer class="settings-footer">
        <button class="glass-button cancel-btn" @click="emit('close')">取消</button>
        <button class="glass-button confirm-btn" @click="onSave">保存</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.settings-modal {
  width: 320px;
  max-height: 90%;
  overflow-y: auto;
  padding: var(--space-lg);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
}
.settings-header h2 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}
.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  padding: var(--space-xs);
}

.settings-section {
  margin-bottom: var(--space-lg);
}
.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
}

.form-group {
  margin-bottom: var(--space-md);
}
.form-group label {
  display: block;
  font-size: 11px;
  color: var(--text-tertiary);
  margin-bottom: var(--space-xs);
}
.form-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  transition: border-color var(--duration-fast);
  font-family: inherit;
}
.form-input:focus {
  border-color: var(--glass-border-strong);
}

.test-connection {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}
.test-btn {
  padding: var(--space-sm) var(--space-md);
  font-size: 12px;
}
.conn-ok {
  font-size: 12px;
  color: var(--color-level-1);
}
.conn-fail {
  font-size: 12px;
  color: var(--color-level-4);
}

.toggles {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}
.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
}
.toggle-checkbox {
  width: 36px;
  height: 20px;
  accent-color: var(--text-primary);
  cursor: pointer;
}

.hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

.settings-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}
.cancel-btn,
.confirm-btn {
  padding: var(--space-sm) var(--space-lg);
  font-size: 13px;
}
.confirm-btn {
  background: linear-gradient(135deg, rgba(80, 160, 255, 0.4), rgba(60, 120, 255, 0.3));
  border-color: rgba(80, 160, 255, 0.55);
  color: white;
}
.confirm-btn:hover {
  background: linear-gradient(135deg, rgba(80, 160, 255, 0.55), rgba(60, 120, 255, 0.45));
}
</style>
